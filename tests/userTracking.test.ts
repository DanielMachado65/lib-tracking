/**
 * @jest-environment jsdom
 */
import { UserTracking } from '../src/lib/userTracking/userTracking';
import { EventBus } from '../src/lib/eventBus/eventBus';

describe(UserTracking.name, () => {
  test('captures click events with data-event-id', () => {
    const bus = new EventBus();
    const received: unknown[] = [];
    bus.subscribe('tracking', (data) => received.push(data));
    const tracker = new UserTracking({ endpoint: '/track', bus, bufferLimit: 1 });
    document.body.innerHTML = '<button data-event-id="btn"></button>';
    tracker.start();

    document.querySelector('button')!.dispatchEvent(new Event('click', { bubbles: true }));

    expect(received.length).toBe(1);
    const event = received[0] as any;
    expect(event.id).toBe('btn');
    expect(event.type).toBe('click');

    tracker.stop();
  });
});
