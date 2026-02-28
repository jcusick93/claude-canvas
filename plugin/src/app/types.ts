export interface ChatMessage {
  id: string;
  text: string;
  role: "user" | "assistant" | "system";
}

export type ConnectionStatus = "connected" | "disconnected";
