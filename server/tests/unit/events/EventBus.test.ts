import { describe, it, expect, vi } from "vitest";
import { EventBus } from "../../../src/events/EventBus.js";

describe("EventBus", () => {
  it("calls registered handler when event emitted", async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("test.event", handler);
    await bus.emit("test.event", { data: 1 });
    expect(handler).toHaveBeenCalledWith({ data: 1 });
  });

  it("calls multiple handlers in registration order", async () => {
    const bus = new EventBus();
    const order: number[] = [];
    bus.on("e", async () => { order.push(1); });
    bus.on("e", async () => { order.push(2); });
    await bus.emit("e", {});
    expect(order).toEqual([1, 2]);
  });

  it("does not call handlers for different events", async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("event.a", handler);
    await bus.emit("event.b", {});
    expect(handler).not.toHaveBeenCalled();
  });

  it("no-ops when no handlers registered", async () => {
    const bus = new EventBus();
    await expect(bus.emit("no.handlers", {})).resolves.toBeUndefined();
  });
});
