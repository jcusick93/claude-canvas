import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WsServer } from "../ws-server.js";

export interface ToolContext {
  mcp: McpServer;
  ws: WsServer;
}
