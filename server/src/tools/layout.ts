import { z } from "zod";
import type { ToolContext } from "./types.js";

export function registerLayoutTools(ctx: ToolContext): void {
  const { mcp, ws } = ctx;

  mcp.registerTool(
    "set_auto_layout",
    {
      description: "Configures auto layout on a frame or component.",
      inputSchema: {
        nodeId: z.string().describe("The frame/component node ID"),
        direction: z
          .enum(["HORIZONTAL", "VERTICAL"])
          .optional()
          .describe("Layout direction"),
        spacing: z
          .number()
          .optional()
          .describe("Spacing between items"),
        paddingTop: z.number().optional().describe("Top padding"),
        paddingRight: z.number().optional().describe("Right padding"),
        paddingBottom: z.number().optional().describe("Bottom padding"),
        paddingLeft: z.number().optional().describe("Left padding"),
        primaryAxisAlignItems: z
          .enum(["MIN", "CENTER", "MAX", "SPACE_BETWEEN"])
          .optional()
          .describe("Primary axis alignment"),
        counterAxisAlignItems: z
          .enum(["MIN", "CENTER", "MAX"])
          .optional()
          .describe("Counter axis alignment"),
        primaryAxisSizingMode: z
          .enum(["FIXED", "AUTO"])
          .optional()
          .describe("Primary axis sizing"),
        counterAxisSizingMode: z
          .enum(["FIXED", "AUTO"])
          .optional()
          .describe("Counter axis sizing"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("set_auto_layout", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "group_nodes",
    {
      description: "Groups the specified nodes together.",
      inputSchema: {
        nodeIds: z.array(z.string()).describe("Array of node IDs to group"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("group_nodes", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "boolean_operation",
    {
      description:
        "Performs a boolean operation (union, subtract, intersect, exclude) on nodes.",
      inputSchema: {
        nodeIds: z.array(z.string()).describe("Array of node IDs to combine"),
        operation: z
          .enum(["UNION", "SUBTRACT", "INTERSECT", "EXCLUDE"])
          .describe("Boolean operation type"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("boolean_operation", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
