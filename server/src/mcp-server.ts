import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WsServer } from "./ws-server.js";
import { registerAllTools } from "./tools/index.js";
import { INSTRUCTIONS } from "./instructions.js";

export function createMcpServer(ws: WsServer): McpServer {
  const mcp = new McpServer(
    {
      name: "claude-canvas",
      version: "1.0.0",
    },
    {
      instructions: INSTRUCTIONS,
    }
  );

  registerAllTools({ mcp, ws });

  return mcp;
}
