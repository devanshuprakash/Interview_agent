/**
 * EventBus — simple synchronous in-process Observer / Domain Events bus.
 *
 * Decouples side effects (credit refund on AI failure, credit grant on
 * payment verify) from the primary write path. Handlers are registered
 * once at composition time; events are published from services.
 *
 * Pattern: Observer / Pub-Sub.
 */
export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

export class EventBus {
  private readonly handlers = new Map<string, EventHandler[]>();

  /** Register a handler for a named event. */
  on<T>(event: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, [...existing, handler as EventHandler]);
  }

  /** Publish an event — all handlers run sequentially (await-ed). */
  async emit<T>(event: string, payload: T): Promise<void> {
    const list = this.handlers.get(event) ?? [];
    for (const handler of list) {
      await handler(payload);
    }
  }
}

/** Singleton exported so composition-root wires it once. */
export const eventBus = new EventBus();
