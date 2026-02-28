// Messages sent FROM the bridge TO the Figma plugin
export type BridgeToPluginMessage =
  | { type: "chat_message"; text: string }
  | { type: "figma_request"; requestId: string; action: string; params: Record<string, unknown> };

// Messages sent FROM the Figma plugin TO the bridge
export type PluginToBridgeMessage =
  | { type: "chat_message"; text: string }
  | { type: "figma_response"; requestId: string; success: boolean; data?: unknown; error?: string };
