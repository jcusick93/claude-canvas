import { z } from "zod";
import { log } from "../logger.js";
import type { ToolContext } from "./types.js";

export function registerChatTools(ctx: ToolContext): void {
  const { mcp, ws } = ctx;

  mcp.registerTool(
    "wait_for_figma_message",
    {
      description:
        "Waits for the first chat message from the Figma plugin user. Use this ONCE at the start of the conversation. For all subsequent messages, use respond_and_wait instead. IMPORTANT: Between receiving a message and calling respond_and_wait, you CAN and SHOULD use WebSearch, WebFetch, Read, Write, Edit, Bash, Grep, Glob and any other tools to fulfill the user's request. You are NOT limited to MCP tools only.",
    },
    async () => {
      log("Waiting for Figma message...");
      const text = await ws.messageQueue.dequeue();
      return { content: [{ type: "text", text }] };
    }
  );

  mcp.registerTool(
    "send_status",
    {
      description:
        "Sends a progress/status update to the Figma plugin chat without waiting for a reply. Use this BEFORE long-running operations like WebSearch or WebFetch to keep the user informed. Example: call send_status('Searching the web...') then call WebSearch.",
      inputSchema: {
        message: z.string().describe("A short status message to display in the chat, e.g. 'Searching the web...'"),
      },
    },
    async ({ message }) => {
      ws.send({ type: "status_update", text: message });
      log("Sent status update to Figma:", message);
      return { content: [{ type: "text", text: "Status sent." }] };
    }
  );

  mcp.registerTool(
    "respond_and_wait",
    {
      description:
        "Sends your response to the Figma plugin chat, then waits for the user's next message. Always use this tool to reply — it sends your message AND listens for the next one in a single step. Never use this for the first message; use wait_for_figma_message first. IMPORTANT: Between receiving a user message and calling this tool, you CAN and SHOULD use WebSearch, WebFetch, Read, Write, Edit, Bash, Grep, Glob and any other tools to fulfill the user's request. You have FULL access to web browsing, file system, and shell. You are NOT limited to MCP tools only. If the user asks you to search the web, DO IT using WebSearch — do not say you cannot. FORMATTING RULES: Your message is rendered as Markdown. NEVER write bare URLs. ALWAYS use markdown hyperlinks like [Base Web](https://baseweb.design). End every research response with a Sources section containing markdown links. Example format: **Sources:**\\n- [Site Name](https://url)",
      inputSchema: {
        message: z.string().describe("Your response message to display in the Figma chat"),
      },
    },
    async ({ message }) => {
      ws.send({ type: "chat_message", text: message });
      log("Sent message to Figma, waiting for next message...");
      const text = await ws.messageQueue.dequeue();
      return { content: [{ type: "text", text }] };
    }
  );
}
