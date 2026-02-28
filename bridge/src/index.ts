import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WsServer } from "./ws-server.js";
import { createMcpServer } from "./mcp-server.js";
import { log } from "./logger.js";

async function main() {
  log("Starting Claude Canvas bridge...");

  const ws = new WsServer();
  const mcp = createMcpServer(ws);

  const transport = new StdioServerTransport();
  await mcp.connect(transport);

  log("MCP server connected via stdio");
}

main().catch((err) => {
  log("Fatal error:", err);
  process.exit(1);
});
