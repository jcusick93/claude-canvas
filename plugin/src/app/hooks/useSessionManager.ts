import { useState, useCallback, useEffect } from "react";
import { useFigmaStorage } from "./useFigmaStorage";
import type { ChatMessage, ChatSession } from "../types";

const SESSIONS_KEY = "claude_canvas_sessions";

export function useSessionManager() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { getItem, setItem } = useFigmaStorage();

  // Load sessions from storage on mount
  useEffect(() => {
    getItem(SESSIONS_KEY).then((data) => {
      if (Array.isArray(data)) {
        setSessions(data as ChatSession[]);
      }
    }).catch(() => {});
  }, [getItem]);

  const persistSessions = useCallback(
    (updated: ChatSession[]) => {
      setSessions(updated);
      setItem(SESSIONS_KEY, updated).catch(() => {});
    },
    [setItem]
  );

  const saveSession = useCallback(
    (id: string, title: string, messages: ChatMessage[]) => {
      setSessions((prev) => {
        const now = Date.now();
        const existing = prev.find((s) => s.id === id);
        let updated: ChatSession[];
        if (existing) {
          updated = prev.map((s) =>
            s.id === id ? { ...s, title, messages, updatedAt: now } : s
          );
        } else {
          updated = [...prev, { id, title, messages, createdAt: now, updatedAt: now }];
        }
        setItem(SESSIONS_KEY, updated).catch(() => {});
        return updated;
      });
    },
    [setItem]
  );

  const loadSession = useCallback(
    (id: string): ChatMessage[] | null => {
      const session = sessions.find((s) => s.id === id);
      if (session) {
        setCurrentSessionId(id);
        return session.messages;
      }
      return null;
    },
    [sessions]
  );

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        setItem(SESSIONS_KEY, updated).catch(() => {});
        return updated;
      });
      if (currentSessionId === id) {
        setCurrentSessionId(null);
      }
    },
    [currentSessionId, setItem]
  );

  const newSession = useCallback(() => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setCurrentSessionId(id);
    return id;
  }, []);

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    saveSession,
    loadSession,
    deleteSession,
    newSession,
  };
}
