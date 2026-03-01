import { z } from "zod";
import type { ToolContext } from "./types.js";

export function registerStylesTools(ctx: ToolContext): void {
  const { mcp, ws } = ctx;

  mcp.registerTool(
    "create_style",
    {
      description:
        "Creates a new paint, text, effect, or grid style in the Figma file.",
      inputSchema: {
        styleType: z
          .enum(["PAINT", "TEXT", "EFFECT", "GRID"])
          .describe("Type of style to create"),
        name: z
          .string()
          .describe(
            "Style name (use / for grouping, e.g. 'Brand/Primary')"
          ),
        properties: z
          .record(z.unknown())
          .describe(
            "Style properties. For PAINT: {color: {r,g,b}} or {paints: [...]}. For TEXT: {fontSize, fontFamily, fontStyle, letterSpacing, lineHeight}. For EFFECT: {effects: [...]}. For GRID: {grids: [...]}"
          ),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("create_style", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "set_style",
    {
      description: "Applies an existing style to a node by style ID.",
      inputSchema: {
        nodeId: z.string().describe("The node ID to apply the style to"),
        styleId: z.string().describe("The style ID to apply"),
        styleType: z
          .enum(["PAINT", "STROKE", "TEXT", "EFFECT", "GRID"])
          .describe("Which style type to apply"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("set_style", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
