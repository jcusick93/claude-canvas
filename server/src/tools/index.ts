import type { ToolContext } from "./types.js";
import { registerChatTools } from "./chat.js";
import { registerReadTools } from "./read.js";
import { registerWriteTools } from "./write.js";
import { registerStylesTools } from "./styles.js";
import { registerVariablesTools } from "./variables.js";
import { registerLayoutTools } from "./layout.js";
import { registerComponentsTools } from "./components.js";

export type { ToolContext } from "./types.js";

export function registerAllTools(ctx: ToolContext): void {
  registerChatTools(ctx);
  registerReadTools(ctx);
  registerWriteTools(ctx);
  registerStylesTools(ctx);
  registerVariablesTools(ctx);
  registerLayoutTools(ctx);
  registerComponentsTools(ctx);
}
