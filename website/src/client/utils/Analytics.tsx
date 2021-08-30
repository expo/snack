import type { AmplitudeClient } from 'amplitude-js';

type AnalyticsCommonData = {
  snackId?: string;
  isEmbedded?: boolean;
  previewPane?: 'hidden' | 'mydevice' | 'ios' | 'android' | 'web';
};

type AnalyticsIdentifyTraits = {
  username?: string;
  build_date?: string;
};

type AnalyticsQueueItem = {
  type: 'identify' | 'logEvent';
  parameters: any[];
};

declare const rudderanalytics:
  | {
      identify(traits: AnalyticsIdentifyTraits): void;
      identify(userId: string, traits: AnalyticsIdentifyTraits): void;
      track(name: string, options: { [key: string]: number }): void;
    }
  | undefined;

interface Amplitude {
  getInstance(instanceName?: string): AmplitudeClient;
}

declare const amplitude: Amplitude | undefined;

let instance: Analytics | undefined;

export default class Analytics {
  private timers: {
    sessionStart: number;
    [key: string]: number;
  };

  private commonData: object;
  public isVerbose: boolean = false;
  private queue: AnalyticsQueueItem[] = [];
  private queueBackoffTimeout: number = 200;

  constructor() {
    this.timers = {
      sessionStart: Date.now(),
    };

    this.commonData = {};
  }

  static getInstance() {
    if (instance) {
      return instance;
    } else {
      instance = new Analytics();
      return instance;
    }
  }

  get verbose(): boolean {
    return this.isVerbose;
  }

  set verbose(isVerbose: boolean) {
    if (this.isVerbose !== isVerbose) {
      this.isVerbose = isVerbose;
      if (this.isVerbose) {
        if (typeof rudderanalytics !== 'undefined') {
          this.log('Recording to RudderStack');
        } else if (typeof amplitude !== 'undefined') {
          this.log(`Recording to Amplitude`);
        } else {
          this.log(`Recording Disabled`);
        }
      }
    }
  }

  startTimer = (name: string) => {
    this.timers[name] = Date.now();
  };

  clearTimer = (name: string) => {
    delete this.timers[name];
  };

  setCommonData = (data: AnalyticsCommonData) => {
    this.commonData = data;
  };

  updateCommonData = (data: AnalyticsCommonData) => {
    this.commonData = {
      ...this.commonData,
      ...data,
    };
  };

  private log(...optionalParams: any[]) {
    if (!this.verbose) {
      return;
    }

    const isDisabled = typeof rudderanalytics === 'undefined' && typeof amplitude === 'undefined';
    console.info.apply(console, [
      `%c ANALYTICS `,
      `background: #10089f${isDisabled ? '22' : ''}; color: #fff`,
      ...optionalParams,
    ]);
  }

  logEvent(name: string, data?: object, ...timerKeys: string[]) {
    this.log(name, data ?? '');

    const eventTenures: { [key: string]: number } = {};
    for (const key of timerKeys) {
      if (this.timers.hasOwnProperty(key)) {
        eventTenures[`${key}Tenure`] = this.eventTenure(key);
      }
    }

    eventTenures.sessionTenure = this.eventTenure('sessionStart');

    const info = {
      ...eventTenures,
      ...this.commonData,
      ...data,
    };

    this.addQueueItem({
      type: 'logEvent',
      parameters: [name, info],
    });
  }

  identify = (traits: AnalyticsIdentifyTraits, userId?: string) => {
    this.log('Identify, anonymous:', userId ? 'NO' : 'YES', ', traits:', traits);

    if (!traits) {
      return;
    }

    this.addQueueItem({
      type: 'identify',
      parameters: [traits, userId],
    });
  };

  get isReady() {
    if (typeof rudderanalytics !== 'undefined') {
      return true;
    } else if (typeof amplitude !== 'undefined') {
      // When getSessionId exists, the snippet has been loaded.
      // When getSessionId() returns a valid id, amplitude was initialized.
      return !!amplitude.getInstance().getSessionId?.();
    } else {
      return true;
    }
  }

  private addQueueItem(item: AnalyticsQueueItem) {
    if (this.queue.length < 200) {
      this.queue.push(item);
    }
    this.processQueue();
  }

  private processQueue() {
    if (this.isReady) {
      while (this.queue.length) {
        this.processQueueItem(this.queue.shift()!);
      }
    } else {
      const timeout = this.queueBackoffTimeout;
      this.queueBackoffTimeout *= 2;
      setTimeout(() => this.processQueue(), timeout);
    }
  }

  private processQueueItem(item: AnalyticsQueueItem) {
    const { type, parameters } = item;
    switch (type) {
      case 'identify':
        {
          const [traits, userId] = parameters;
          if (typeof rudderanalytics !== 'undefined') {
            if (userId) {
              rudderanalytics.identify(userId, traits);
            } else {
              rudderanalytics.identify(traits);
            }
          } else if (typeof amplitude !== 'undefined') {
            // @ts-expect-error TODO Identify needs to be defined on amplitude
            const identify = new amplitude.Identify();

            for (const [key, value] of Object.entries(traits)) {
              if (value !== undefined) {
                identify.set(key, value);
              }
            }

            amplitude.getInstance().identify(identify);
          }
        }
        break;
      case 'logEvent':
        {
          const [name, info] = parameters;
          if (typeof rudderanalytics !== 'undefined') {
            rudderanalytics.track(name, info);
          } else if (typeof amplitude !== 'undefined') {
            amplitude.getInstance().logEvent(name, info);
          }
        }
        break;
    }
  }

  private eventTenure = (timerKey: string) => {
    return (Date.now() - this.timers[timerKey]) / 1000;
  };
}
