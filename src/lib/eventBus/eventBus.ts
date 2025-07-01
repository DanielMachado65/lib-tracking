export type CallbackFn = (data: unknown) => void;

export class EventBus {
  private readonly topics: Record<string, Array<CallbackFn>> = {};

  subscribe(topicName: string, callback: CallbackFn): void {
    const topic = this.topics[topicName] || [];
    this.topics[topicName] = [...topic, callback];
  }

  unsubscribe(topicName: string, callback: CallbackFn): void {
    const topic = this.topics[topicName] || [];
    const subscriberIndex = topic.indexOf(callback);
    if (subscriberIndex >= 0) {
      topic.splice(subscriberIndex, 1);
    }
  }

  publish(topicName: string, data: unknown): Promise<null> {
    return new Promise((resolve, reject) => {
      try {
        const topic = this.topics[topicName] || [];
        topic.forEach((callback) => callback(data));
        resolve(null);
      } catch (error) {
        reject(error);
      }
    });
  }
}
