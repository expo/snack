import React from 'react';

export function AppetizeScript() {
  return <script dangerouslySetInnerHTML={{ __html: getAppetizeScript() }} />;
}

/** @see https://docs.appetize.io/javascript-sdk/getting-started#installation */
function getAppetizeScript() {
  return `
(function () {const n = window,i = document,o = i.getElementsByTagName("script")[0],t = i.createElement("script");
(t.src = "https://js.appetize.io/embed.js"), (t.async = 1), o.parentNode.insertBefore(t, o);
const s = new Promise(function (e) {t.onload = function () {e();};});n.appetize = {getClient: function (...e) {
return s.then(() => n.appetize.getClient(...e));},};})();
`.trim();
}

declare global {
  interface Window {
    appetize: {
      getClient(iframeId: string, config?: AppetizeSdkConfig): Promise<AppetizeSdkClient>;
    };
  }

  /** @see https://docs.appetize.io/javascript-sdk/configuration */
  type AppetizeSdkConfig = {
    publicKey: string;
    device: string;
    osVersion?: string;
    scale?: number | 'auto';
    orientation?: 'portrait' | 'horizontal';
    centered?: 'vertical' | 'horizontal' | 'both';
    deviceColor?: 'black' | 'white';
    screenOnly?: boolean;
    language?: string;
    locale?: string;
    iosKeyboard?: boolean;
    iosAutocorrect?: boolean;
    disableVirtualKeyboard?: boolean;
    location?: number[];
    timezone?: string;
    grantPermissions?: boolean;
    autoPlay?: boolean;
    hidePasswords?: boolean;
    launchUrl?: string;
    launchArgs?: string;
    debug?: boolean;
    proxy?: string;
    record?: boolean;
    enableAdb?: boolean;
    androidPackageManager?: boolean;
    region?: 'us' | 'eu';
    appearance?: 'light' | 'dark';
    params?: string;
    audio?: boolean;
    codec?: 'h264' | 'jpeg';
    toast?: 'top' | 'bottom';
  };

  type AppetizeQueueEventData = {
    type: 'session' | 'concurrent';
    position: number;
    name?: string;
  };

  type AppetizeSdkClientEvent =
    | { type: 'queue'; data: AppetizeQueueEventData }
    | { type: 'error'; data: string }
    | { type: 'deviceInfo'; data: Record<string, any> }
    | { type: 'sessionRequested'; data: void }
    | { type: 'session'; data: AppetizeSdkSession }
    | { type: 'app'; data: Record<string, any> };

  type ExtractType<T> = T extends { type: infer U } ? U : never;

  interface AppetizeSdkClient {
    /** @see https://docs.appetize.io/javascript-sdk/api-reference#on-client */
    on<T extends ExtractType<AppetizeSdkClientEvent>>(
      event: T,
      listener: (data: Extract<AppetizeSdkClientEvent, { type: T }>['data']) => void
    ): void;

    /** @see https://docs.appetize.io/javascript-sdk/api-reference#startsession */
    startSession(config?: AppetizeSdkConfig): AppetizeSdkSession;

    /** @see https://docs.appetize.io/javascript-sdk/api-reference#setconfig */
    setConfig(config?: AppetizeSdkConfig): Promise<void>;
  }

  interface AppetizeSdkSession {
    /** @see https://docs.appetize.io/javascript-sdk/api-reference#openurl-url */
    openUrl(url: string): Promise<void>;

    /** @see https://docs.appetize.io/javascript-sdk/api-reference#restartapp */
    restartApp(): Promise<void>;

    /** @see https://docs.appetize.io/javascript-sdk/api-reference#shake */
    shake(): Promise<void>;

    /** @see https://docs.appetize.io/javascript-sdk/api-reference#rotate */
    rotate(direction: 'left' | 'right'): Promise<void>;

    /** @see https://docs.appetize.io/sample-use-cases/test-accessibility-font-sizes#android */
    adbShellCommand(command: string): Promise<void>;

    /** @see https://docs.appetize.io/javascript-sdk/api-reference#end */
    end(): Promise<void>;
  }
}
