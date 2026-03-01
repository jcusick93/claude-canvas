import { z } from "zod";
import type { ToolContext } from "./types.js";

const colorSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
});

export function registerComponentsTools(ctx: ToolContext): void {
  const { mcp, ws } = ctx;

  mcp.registerTool(
    "create_component",
    {
      description:
        "Converts an existing Figma node into a reusable component.",
      inputSchema: {
        nodeId: z
          .string()
          .describe(
            "The node ID of the element to convert into a component"
          ),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("create_component", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "add_variants",
    {
      description:
        "Adds variants to an existing Figma component and combines them into a component set. The original component becomes the first variant.",
      inputSchema: {
        nodeId: z
          .string()
          .describe("The node ID of the existing component"),
        variants: z
          .array(
            z.object({
              name: z.string().describe("Variant name (e.g. 'Secondary')"),
              fillColor: colorSchema
                .optional()
                .describe("Optional fill color override"),
            })
          )
          .describe("Array of variant definitions to add"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("add_variants", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "create_instance",
    {
      description: "Creates an instance of a local component.",
      inputSchema: {
        componentId: z
          .string()
          .describe("The component node ID to instantiate"),
        x: z.number().optional().describe("X position (default 0)"),
        y: z.number().optional().describe("Y position (default 0)"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("create_instance", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
