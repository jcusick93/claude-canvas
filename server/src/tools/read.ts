import type { ToolContext } from "./types.js";

export function registerReadTools(ctx: ToolContext): void {
  const { mcp, ws } = ctx;

  mcp.registerTool(
    "get_figma_selection",
    {
      description:
        "Returns details of the currently selected elements in Figma (id, name, type, position, size, fills, strokes, effects, text content).",
    },
    async () => {
      const data = await ws.sendFigmaRequest("get_selection");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "get_page_structure",
    {
      description:
        "Returns the layer tree of the current Figma page (id, name, type, children) for understanding the canvas structure.",
    },
    async () => {
      const data = await ws.sendFigmaRequest("get_page_structure");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "get_local_styles",
    {
      description:
        "Returns all local paint, text, effect, and grid styles in the Figma file.",
    },
    async () => {
      const data = await ws.sendFigmaRequest("get_local_styles");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "get_local_variables",
    {
      description:
        "Returns all local variables and variable collections in the Figma file.",
    },
    async () => {
      const data = await ws.sendFigmaRequest("get_local_variables");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
