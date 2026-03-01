import { useEffect, useRef } from "react";
import styles from "./MessageList.module.css";
import { Message } from "../Message/Message";
import { LoadingIndicator } from "../LoadingIndicator/LoadingIndicator";
import type { ChatMessage } from "../../types";

interface MessageListProps {
  messages: ChatMessage[];
  loading?: boolean;
  onRetry?: () => void;
}

export function MessageList({ messages, loading, onRetry }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div ref={containerRef} className={styles.container}>
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} onRetry={msg.role === "assistant" ? onRetry : undefined} />
      ))}
      <LoadingIndicator animate={loading} />
    </div>
  );
}
