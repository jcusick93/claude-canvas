// Messages sent FROM the server TO the Figma plugin
export type BridgeToPluginMessage =
  | { type: "chat_message"; text: string }
  | { type: "figma_request"; requestId: string; action: string; params: Record<string, unknown> }
  | { type: "status_update"; text: string };

// Messages sent FROM the Figma plugin TO the server
export type PluginToBridgeMessage =
  | { type: "chat_message"; text: string }
  | { type: "figma_response"; requestId: string; success: boolean; data?: unknown; error?: string };
