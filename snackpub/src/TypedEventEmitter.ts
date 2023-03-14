import { EventEmitter } from 'events';

export default class TypedEventEmitter<T extends Record<string, any>> extends EventEmitter {
  override on<Event extends keyof T & string>(event: Event, listener: T[Event]): this {
    return super.on(event, listener);
  }

  override once<Event extends keyof T & string>(event: Event, listener: T[Event]): this {
    return super.once(event, listener);
  }

  override off<Event extends keyof T & string>(event: Event, listener: T[Event]): this {
    return super.off(event, listener);
  }

  override emit<Event extends keyof T & string>(
    event: Event,
    ...args: Parameters<T[Event]>
  ): boolean {
    return super.emit(event, ...args);
  }
}
