# lib-tracking

A small library for capturing user actions such as clicks, inputs and global errors. It is designed to be framework agnostic but works well in React applications.

## Installation

```bash
npm install lib-tracking
```

## Usage

```ts
import { initUserTracking } from 'lib-tracking';

const tracker = initUserTracking({
  endpoint: '/track',
  bufferLimit: 5,
});
```

You can also access the `EventBus` if you need to subscribe to tracking events internally:

```ts
import { EventBus, UserTracking } from 'lib-tracking';

const bus = new EventBus();
const tracker = new UserTracking({ endpoint: '/track', bus });
bus.subscribe('tracking', (event) => console.log(event));
tracker.start();
```
