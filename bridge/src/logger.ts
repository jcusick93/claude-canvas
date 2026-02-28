// All logging goes to stderr because stdout is reserved for MCP stdio transport
export function log(...args: unknown[]): void {
  console.error("[claude-canvas]", ...args);
}
