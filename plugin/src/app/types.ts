export interface ChatMessage {
  id: string;
  text: string;
  role: "user" | "assistant" | "system";
  isNew?: boolean;
}

export type ConnectionStatus = "connected" | "disconnected";

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
