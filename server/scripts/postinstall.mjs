#!/usr/bin/env node

/**
 * Postinstall script that registers claude-canvas-mcp in the user's
 * global Claude Code MCP settings (~/.claude.json).
 *
 * - Uses absolute path to the binary so it works whether installed
 *   globally (`npm i -g`) or locally (`npm i`)
 * - Merges into the existing file without clobbering other servers
 * - Skips silently if anything goes wrong (postinstall should never
 *   break `npm install`)
 */

import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN_PATH = resolve(__dirname, "..", "dist", "index.js");

const CONFIG_PATH = join(homedir(), ".claude.json");
const SERVER_NAME = "claude-canvas";

async function main() {
  let config = {};

  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    config = JSON.parse(raw);
  } catch {
    // File doesn't exist or isn't valid JSON — start fresh
  }

  // Don't overwrite if the user already has a claude-canvas entry
  if (config.mcpServers?.[SERVER_NAME]) {
    return;
  }

  config.mcpServers = config.mcpServers || {};
  config.mcpServers[SERVER_NAME] = {
    command: "node",
    args: [BIN_PATH],
  };

  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf-8");

  console.log(
    `\n  ✓ claude-canvas MCP server registered in ${CONFIG_PATH}\n`
  );
}

main().catch(() => {
  // Silently ignore errors — never break npm install
});
