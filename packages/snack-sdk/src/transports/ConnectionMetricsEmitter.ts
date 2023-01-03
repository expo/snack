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

class ConnectionMetricsEmitter {
  private readonly METRICS_FAILED_FOR_RECONNECT_ATTEMPTS = 5;
  private _listener: ConnectionMetricsUpdateListener | null = null;
  private _lastEmitState:
    | undefined
    | 'TRANSPORT_CONNECTION_SUCCEEDED'
    | 'TRANSPORT_CONNECTION_FAILED';

  public emitSuccessed(payload: ConnectionMetricsCommonPayload) {
    if (
      this._lastEmitState === undefined ||
      this._lastEmitState === 'TRANSPORT_CONNECTION_FAILED'
    ) {
      // To reduce the duplicated events, e.g. keeping failed events.
      // We only log undefined -> succeeded, undefined -> failed, and failed -> successed
      this.emit({ name: 'TRANSPORT_CONNECTION_SUCCEEDED', ...payload });
      this._lastEmitState = 'TRANSPORT_CONNECTION_SUCCEEDED';
    }
  }

  public emitFailed(payload: ConnectionMetricsCommonPayload) {
    if (
      this._lastEmitState === undefined &&
      payload.attempts >= this.METRICS_FAILED_FOR_RECONNECT_ATTEMPTS
    ) {
      // To reduce the duplicated events, e.g. keeping failed events.
      // We only log undefined -> succeeded, undefined -> failed, and failed -> successed
      this.emit({ name: 'TRANSPORT_CONNECTION_FAILED', ...payload });
      this._lastEmitState = 'TRANSPORT_CONNECTION_FAILED';
    }
  }

  public resetState() {
    this._lastEmitState = undefined;
  }

  public setUpdateListener(listener: ConnectionMetricsUpdateListener) {
    this._listener = listener;
  }

  private emit(event: ConnectionMetricsEvents) {
    this._listener?.(event);
  }
}

export default new ConnectionMetricsEmitter();
