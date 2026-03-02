// Promise-based producer/consumer queue for chat messages from Figma
const MAX_QUEUE_SIZE = 100;

export class MessageQueue {
  private messages: string[] = [];
  private waiters: Array<(message: string) => void> = [];

  enqueue(message: string): void {
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter(message);
    } else if (this.messages.length < MAX_QUEUE_SIZE) {
      this.messages.push(message);
    }
    // Drop message silently if queue is full
  }

  dequeue(): Promise<string> {
    const message = this.messages.shift();
    if (message !== undefined) {
      return Promise.resolve(message);
    }
    return new Promise((resolve) => {
      this.waiters.push(resolve);
    });
  }
}
