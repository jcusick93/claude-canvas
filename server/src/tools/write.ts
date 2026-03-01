import { z } from "zod";
import type { ToolContext } from "./types.js";

const colorSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
});

export function registerWriteTools(ctx: ToolContext): void {
  const { mcp, ws } = ctx;

  mcp.registerTool(
    "create_element",
    {
      description:
        "Creates a new element on the Figma canvas. Returns the created element's id and name.",
      inputSchema: {
        elementType: z
          .enum(["RECTANGLE", "TEXT", "FRAME", "ELLIPSE", "LINE"])
          .describe("Type of element to create"),
        x: z.number().optional().describe("X position (default 0)"),
        y: z.number().optional().describe("Y position (default 0)"),
        width: z.number().optional().describe("Width (default 100)"),
        height: z.number().optional().describe("Height (default 100)"),
        name: z.string().optional().describe("Layer name"),
        fillColor: colorSchema
          .optional()
          .describe("Fill color with r, g, b values 0-1"),
        text: z
          .string()
          .optional()
          .describe("Text content (only for TEXT elements)"),
        fontSize: z
          .number()
          .optional()
          .describe("Font size (only for TEXT elements)"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("create_element", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "modify_element",
    {
      description: "Modifies properties of an existing Figma element by node ID.",
      inputSchema: {
        nodeId: z.string().describe("The node ID of the element to modify"),
        x: z.number().optional().describe("New X position"),
        y: z.number().optional().describe("New Y position"),
        width: z.number().optional().describe("New width"),
        height: z.number().optional().describe("New height"),
        name: z.string().optional().describe("New layer name"),
        fillColor: colorSchema
          .optional()
          .describe("New fill color with r, g, b values 0-1"),
        text: z
          .string()
          .optional()
          .describe("New text content (only for TEXT nodes)"),
        fontSize: z
          .number()
          .optional()
          .describe("New font size (only for TEXT nodes)"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("modify_element", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "delete_element",
    {
      description: "Removes an element from the Figma canvas by node ID.",
      inputSchema: {
        nodeId: z.string().describe("The node ID of the element to delete"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("delete_element", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "export_node",
    {
      description:
        "Exports a node as PNG, SVG, PDF, or JPG. Returns base64-encoded data.",
      inputSchema: {
        nodeId: z.string().describe("The node ID to export"),
        format: z
          .enum(["PNG", "SVG", "PDF", "JPG"])
          .optional()
          .describe("Export format (default PNG)"),
        scale: z
          .number()
          .optional()
          .describe(
            "Export scale multiplier (default 1, only for PNG/JPG)"
          ),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("export_node", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "create_node_from_svg",
    {
      description:
        "Creates a Figma node from an SVG string. Useful for importing icons and vector graphics.",
      inputSchema: {
        svg: z.string().describe("SVG markup string"),
        x: z.number().optional().describe("X position (default 0)"),
        y: z.number().optional().describe("Y position (default 0)"),
        name: z
          .string()
          .optional()
          .describe("Layer name for the created node"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("create_node_from_svg", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
