import { useCallback, useRef, useEffect } from "react";

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

let requestId = 0;

export function useFigmaStorage() {
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (!msg || msg.type !== "storage_result") return;

      const pending = pendingRef.current.get(msg.requestId);
      if (pending) {
        pendingRef.current.delete(msg.requestId);
        if (msg.error) {
          pending.reject(new Error(msg.error));
        } else {
          pending.resolve(msg.data);
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const sendRequest = useCallback((action: string, key: string, value?: unknown): Promise<unknown> => {
    const id = `storage_${requestId++}`;
    return new Promise((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject });
      parent.postMessage(
        { pluginMessage: { type: "storage_request", requestId: id, action, key, value } },
        "*"
      );
      setTimeout(() => {
        if (pendingRef.current.has(id)) {
          pendingRef.current.delete(id);
          reject(new Error("Storage request timed out"));
        }
      }, 5000);
    });
  }, []);

  const getItem = useCallback(
    (key: string) => sendRequest("get", key) as Promise<unknown>,
    [sendRequest]
  );

  const setItem = useCallback(
    (key: string, value: unknown) => sendRequest("set", key, value) as Promise<void>,
    [sendRequest]
  );

  const deleteItem = useCallback(
    (key: string) => sendRequest("delete", key) as Promise<void>,
    [sendRequest]
  );

  return { getItem, setItem, deleteItem };
}
