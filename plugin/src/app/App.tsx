import { useState, useCallback, useEffect } from "react";
import { MessageList } from "./components/MessageList/MessageList";
import { InputArea } from "./components/InputArea/InputArea";
import { useWebSocket } from "./hooks/useWebSocket";
import { useFigmaBridge } from "./hooks/useFigmaBridge";
import type { ChatMessage } from "./types";

let nextId = 0;
function createMessage(
  text: string,
  role: ChatMessage["role"]
): ChatMessage {
  return { id: String(nextId++), text, role };
}

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage("Connect to start chatting with Claude", "system"),
  ]);
  const [loading, setLoading] = useState(false);

  const { connected, send, lastMessage } = useWebSocket("ws://localhost:8080");

  const addMessage = useCallback(
    (text: string, role: ChatMessage["role"]) => {
      setMessages((prev) => [...prev, createMessage(text, role)]);
    },
    []
  );

  // Handle figma sandbox responses — forward to WS server
  const handleFigmaResponse = useCallback(
    (msg: { type: string; [key: string]: unknown }) => {
      if (msg.type === "figma_response") {
        send(msg);
      }
    },
    [send]
  );

  const { sendToFigma } = useFigmaBridge(handleFigmaResponse);

  // Handle incoming WS messages
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "chat_message") {
      setLoading(false);
      addMessage(lastMessage.text as string, "assistant");
    } else if (lastMessage.type === "figma_request") {
      sendToFigma(lastMessage as { type: string; [key: string]: unknown });
    }
  }, [lastMessage, addMessage, sendToFigma]);

  // Connection status messages
  const prevConnected = usePrevious(connected);
  useEffect(() => {
    if (prevConnected === undefined) return;
    if (connected && !prevConnected) {
      addMessage("Connected to Claude", "system");
    } else if (!connected && prevConnected) {
      addMessage("Disconnected", "system");
    }
  }, [connected, prevConnected, addMessage]);

  const handleSend = useCallback(
    (text: string) => {
      send({ type: "chat_message", text });
      addMessage(text, "user");
      setLoading(true);
    },
    [send, addMessage]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <MessageList messages={messages} loading={loading} />
      <InputArea disabled={!connected} onSend={handleSend} />
    </div>
  );
}

function usePrevious<T>(value: T): T | undefined {
  const [prev, setPrev] = useState<{ current: T | undefined }>({
    current: undefined,
  });

  useEffect(() => {
    setPrev({ current: value });
  }, [value]);

  return prev.current;
}
