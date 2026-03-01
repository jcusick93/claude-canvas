import { useState, useCallback, useEffect, useRef } from "react";
import { MessageList } from "./components/MessageList/MessageList";
import { InputArea } from "./components/InputArea/InputArea";
import { Header } from "./components/Header/Header";
import { Landing } from "./components/Landing/Landing";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { useWebSocket } from "./hooks/useWebSocket";
import { useFigmaBridge } from "./hooks/useFigmaBridge";
import { useSessionManager } from "./hooks/useSessionManager";
import type { ChatMessage } from "./types";

let nextId = 0;
function createMessage(
  text: string,
  role: ChatMessage["role"],
  isNew = true
): ChatMessage {
  return { id: String(nextId++), text, role, isNew };
}

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);

  const { connected, send, lastMessage } = useWebSocket("ws://localhost:8080");
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    saveSession,
    loadSession,
    deleteSession,
    newSession,
  } = useSessionManager();

  const sessionIdRef = useRef<string | null>(null);

  const addMessage = useCallback(
    (text: string, role: ChatMessage["role"]) => {
      setMessages((prev) => [...prev, createMessage(text, role)]);
    },
    []
  );

  // Auto-save messages when they change
  useEffect(() => {
    if (!sessionIdRef.current) return;
    const userMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");
    if (userMessages.length === 0) return;

    const firstUserMsg = userMessages.find((m) => m.role === "user");
    const title = firstUserMsg
      ? firstUserMsg.text.length > 50
        ? firstUserMsg.text.slice(0, 50) + "..."
        : firstUserMsg.text
      : "New Chat";

    saveSession(sessionIdRef.current, title, messages);
  }, [messages, saveSession]);

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

    if (lastMessage.type === "status_update") {
      setStatusLabel(lastMessage.text as string);
    } else if (lastMessage.type === "chat_message") {
      setLoading(false);
      setStatusLabel(null);
      addMessage(lastMessage.text as string, "assistant");
    } else if (lastMessage.type === "figma_request") {
      sendToFigma(lastMessage as { type: string; [key: string]: unknown });
    }
  }, [lastMessage, addMessage, sendToFigma]);

  const handleSend = useCallback(
    (text: string) => {
      // Start a new session if we don't have one
      if (!sessionIdRef.current) {
        const id = newSession();
        sessionIdRef.current = id;
      }
      send({ type: "chat_message", text });
      addMessage(text, "user");
      setLoading(true);
    },
    [send, addMessage, newSession]
  );

  const handleRetry = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

    const lastAssistantIdx = messages.map((m) => m.role).lastIndexOf("assistant");
    if (lastAssistantIdx !== -1) {
      setMessages((prev) => prev.slice(0, lastAssistantIdx));
    }

    send({ type: "chat_message", text: lastUserMsg.text });
    setLoading(true);
  }, [messages, send]);

  const handleStop = useCallback(() => {
    setLoading(false);
    setStatusLabel(null);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleLoadSession = useCallback(
    (id: string) => {
      const restored = loadSession(id);
      if (restored) {
        sessionIdRef.current = id;
        setMessages(restored.map((m) => ({ ...m, isNew: false })));
        setLoading(false);
        setStatusLabel(null);
      }
      setSidebarOpen(false);
    },
    [loadSession]
  );

  const handleDeleteSession = useCallback(
    (id: string) => {
      deleteSession(id);
      if (sessionIdRef.current === id) {
        sessionIdRef.current = null;
        setMessages([]);
        setLoading(false);
        setStatusLabel(null);
      }
    },
    [deleteSession]
  );

  const handleNewChat = useCallback(() => {
    sessionIdRef.current = null;
    setCurrentSessionId(null);
    setMessages([]);
    setLoading(false);
    setStatusLabel(null);
    setSidebarOpen(false);
  }, [setCurrentSessionId]);

  const isLanding = !messages.some(
    (m) => m.role === "user" || m.role === "assistant"
  );

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <Header status={connected ? "connected" : "disconnected"} statusLabel={statusLabel} onToggleSidebar={handleToggleSidebar} />
      {isLanding ? (
        <Landing />
      ) : (
        <MessageList messages={messages} loading={loading} onRetry={handleRetry} />
      )}
      <InputArea disabled={!connected} loading={loading} onSend={handleSend} onStop={handleStop} />
      <Sidebar
        open={sidebarOpen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
        onNewChat={handleNewChat}
        onClose={handleCloseSidebar}
      />
    </div>
  );
}
