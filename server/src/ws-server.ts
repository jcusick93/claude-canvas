import { WebSocketServer, WebSocket } from "ws";
import { execFileSync } from "child_process";
import { log } from "./logger.js";
import { MessageQueue } from "./message-queue.js";
import { RequestManager } from "./request-manager.js";
import type { BridgeToPluginMessage, PluginToBridgeMessage } from "./types.js";

const WS_PORT = 8080;
const MAX_PAYLOAD = 1024 * 1024; // 1 MB

function killStaleProcess(): void {
  try {
    const pids = execFileSync("lsof", ["-ti", `:${WS_PORT}`], { encoding: "utf-8" })
      .trim()
      .split("\n")
      .filter(Boolean);

    for (const pid of pids) {
      try {
        const cmd = execFileSync("ps", ["-p", pid, "-o", "command="], { encoding: "utf-8" }).trim();
        if (cmd.includes("dist/index.js")) {
          log(`Killing stale process (PID ${pid})`);
          process.kill(Number(pid), "SIGTERM");
        }
      } catch {
        // Process may have already exited
      }
    }

    execFileSync("sleep", ["0.5"]);
  } catch {
    // No process on port — nothing to kill
  }
}

export class WsServer {
  private wss: WebSocketServer | null = null;
  private client: WebSocket | null = null;
  public messageQueue = new MessageQueue();
  public requestManager = new RequestManager();

  /** Call after MCP stdio is connected */
  start(): void {
    killStaleProcess();

    this.wss = new WebSocketServer({
      port: WS_PORT,
      host: "127.0.0.1",
      maxPayload: MAX_PAYLOAD,
    });

    this.wss.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        log(`Port ${WS_PORT} is still in use after cleanup — exiting`);
        process.exit(1);
      }
      log("WebSocket server error:", err.message);
    });

    log(`WebSocket server listening on port ${WS_PORT}`);

    this.wss.on("connection", (ws) => {
      log("Figma plugin connected");
      this.client = ws;

      ws.on("message", (raw) => {
        try {
          const parsed = JSON.parse(raw.toString());
          if (!parsed || typeof parsed !== "object" || typeof parsed.type !== "string") {
            log("Invalid WS message: missing type");
            return;
          }
          const msg = parsed as PluginToBridgeMessage;
          if (msg.type === "chat_message" && typeof msg.text !== "string") {
            log("Invalid chat_message: missing text");
            return;
          }
          if (msg.type === "figma_response" && typeof msg.requestId !== "string") {
            log("Invalid figma_response: missing requestId");
            return;
          }
          this.handleMessage(msg);
        } catch (e) {
          log("Failed to parse WS message:", e);
        }
      });

      ws.on("close", () => {
        log("Figma plugin disconnected");
        if (this.client === ws) this.client = null;
      });

      ws.on("error", (err) => {
        log("WebSocket error:", err.message);
      });
    });
  }

  private handleMessage(msg: PluginToBridgeMessage): void {
    if (msg.type === "chat_message") {
      log("Chat message from Figma:", msg.text);
      this.messageQueue.enqueue(msg.text);
    } else if (msg.type === "figma_response") {
      const handled = this.requestManager.resolveRequest(
        msg.requestId,
        msg.success,
        msg.data,
        msg.error
      );
      if (!handled) {
        log("Received response for unknown request:", msg.requestId);
      }
    }
  }

  send(msg: BridgeToPluginMessage): void {
    if (!this.client || this.client.readyState !== WebSocket.OPEN) {
      log("No connected Figma plugin — dropping message");
      return;
    }
    this.client.send(JSON.stringify(msg));
  }

  async sendFigmaRequest(action: string, params: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.client || this.client.readyState !== WebSocket.OPEN) {
      throw new Error("No Figma plugin connected");
    }
    const { requestId, promise } = this.requestManager.createRequest();
    this.send({ type: "figma_request", requestId, action, params });
    return promise;
  }
}
