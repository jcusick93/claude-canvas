// Promise-based producer/consumer queue for chat messages from Figma
export class MessageQueue {
  private messages: string[] = [];
  private waiters: Array<(message: string) => void> = [];

  enqueue(message: string): void {
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter(message);
    } else {
      this.messages.push(message);
    }
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
