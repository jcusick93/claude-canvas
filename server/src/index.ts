import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WsServer } from "./ws-server.js";
import { createMcpServer } from "./mcp-server.js";
import { log } from "./logger.js";

async function main() {
  log("Starting Claude Canvas MCP server...");

  // Create WS server wrapper (does NOT bind the port yet)
  const ws = new WsServer();
  const mcp = createMcpServer(ws);

  // Connect MCP stdio FIRST — this is what Claude is waiting for
  const transport = new StdioServerTransport();
  await mcp.connect(transport);
  log("MCP server connected via stdio");

  // NOW start the WebSocket server (can take time, Claude won't timeout)
  ws.start();
}

main().catch((err) => {
  log("Fatal error:", err);
  process.exit(1);
});
