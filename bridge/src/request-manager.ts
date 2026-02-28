import { v4 as uuidv4 } from "uuid";

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const REQUEST_TIMEOUT_MS = 30_000;

export class RequestManager {
  private pending = new Map<string, PendingRequest>();

  createRequest(): { requestId: string; promise: Promise<unknown> } {
    const requestId = uuidv4();
    const promise = new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Figma request ${requestId} timed out after ${REQUEST_TIMEOUT_MS}ms`));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(requestId, { resolve, reject, timer });
    });

    return { requestId, promise };
  }

  resolveRequest(requestId: string, success: boolean, data?: unknown, error?: string): boolean {
    const req = this.pending.get(requestId);
    if (!req) return false;

    clearTimeout(req.timer);
    this.pending.delete(requestId);

    if (success) {
      req.resolve(data);
    } else {
      req.reject(new Error(error ?? "Figma request failed"));
    }
    return true;
  }
}
