import { useEffect, useCallback } from "react";

interface FigmaMessage {
  type: string;
  [key: string]: unknown;
}

export function useFigmaBridge(
  onFigmaResponse: (msg: FigmaMessage) => void
): { sendToFigma: (msg: FigmaMessage) => void } {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (!msg) return;
      onFigmaResponse(msg);
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onFigmaResponse]);

  const sendToFigma = useCallback((msg: FigmaMessage) => {
    parent.postMessage({ pluginMessage: msg }, "*");
  }, []);

  return { sendToFigma };
}
