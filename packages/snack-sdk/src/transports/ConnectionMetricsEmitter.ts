interface ConnectionMetricsCommonPayload {
  timeMs: number;
  attempts: number;
}

export interface ConnectionMetricsSucceeded extends ConnectionMetricsCommonPayload {
  name: 'TRANSPORT_CONNECTION_SUCCEEDED';
}

export interface ConnectionMetricsFailed extends ConnectionMetricsCommonPayload {
  name: 'TRANSPORT_CONNECTION_FAILED';
}

type ConnectionMetricsEvents = ConnectionMetricsSucceeded | ConnectionMetricsFailed;

export type ConnectionMetricsUpdateListener = (event: ConnectionMetricsEvents) => void;

const METRICS_FAILED_FOR_RECONNECT_ATTEMPTS = 5;

class ConnectionMetricsEmitter {
  private listener: ConnectionMetricsUpdateListener | null = null;
  private lastEmitState:
    | undefined
    | 'TRANSPORT_CONNECTION_SUCCEEDED'
    | 'TRANSPORT_CONNECTION_FAILED';

  public emitSuccessed(payload: ConnectionMetricsCommonPayload) {
    if (this.lastEmitState === undefined || this.lastEmitState === 'TRANSPORT_CONNECTION_FAILED') {
      // To reduce the duplicated events, e.g. keeping failed events.
      // We only log undefined -> succeeded, undefined -> failed, and failed -> successed
      this.emit({ name: 'TRANSPORT_CONNECTION_SUCCEEDED', ...payload });
      this.lastEmitState = 'TRANSPORT_CONNECTION_SUCCEEDED';
    }
  }

  public emitFailed(payload: ConnectionMetricsCommonPayload) {
    if (
      this.lastEmitState === undefined &&
      payload.attempts >= METRICS_FAILED_FOR_RECONNECT_ATTEMPTS
    ) {
      // To reduce the duplicated events, e.g. keeping failed events.
      // We only log undefined -> succeeded, undefined -> failed, and failed -> succeeded
      this.emit({ name: 'TRANSPORT_CONNECTION_FAILED', ...payload });
      this.lastEmitState = 'TRANSPORT_CONNECTION_FAILED';
    }
  }

  public resetState() {
    this.lastEmitState = undefined;
  }

  public setUpdateListener(listener: ConnectionMetricsUpdateListener) {
    this.listener = listener;
  }

  private emit(event: ConnectionMetricsEvents) {
    this.listener?.(event);
  }
}

export default new ConnectionMetricsEmitter();
