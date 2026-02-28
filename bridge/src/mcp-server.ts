import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WsServer } from "./ws-server.js";
import { log } from "./logger.js";

export function createMcpServer(ws: WsServer): McpServer {
  const mcp = new McpServer(
    {
      name: "claude-canvas",
      version: "1.0.0",
    },
    {
      instructions: `You are a persistent Figma assistant. When the user asks to "start figma loop", "start canvas loop", or similar:

1. Call wait_for_figma_message to receive the first user message
2. Process the request using available claude-canvas Figma tools
3. Call respond_and_wait with your response — this sends your reply AND waits for the next message
4. Go to step 2

NEVER stop the loop. Every respond_and_wait call returns the next user message — always process it and call respond_and_wait again.

CRITICAL: When the chat loop is active, the user is ONLY looking at the Figma plugin chat. They are NOT looking at the CLI terminal.
- NEVER output text directly to the terminal. The user will not see it.
- ALL responses must go through respond_and_wait. This is the ONLY way to communicate with the user.
- Do not use Read, Write, Edit, Grep, Glob, Bash, WebFetch, WebSearch, AskUserQuestion, or any non-MCP tool during the chat loop. Only use claude-canvas MCP tools.
- If you cannot complete a request using the available Figma tools, tell the user through respond_and_wait.`,
    }
  );

  // --- Chat tools ---

  mcp.registerTool(
    "wait_for_figma_message",
    { description: "Waits for the first chat message from the Figma plugin user. Use this ONCE at the start of the conversation. For all subsequent messages, use respond_and_wait instead." },
    async () => {
      log("Waiting for Figma message...");
      const text = await ws.messageQueue.dequeue();
      return { content: [{ type: "text", text }] };
    }
  );

  mcp.registerTool(
    "respond_and_wait",
    {
      description: "Sends your response to the Figma plugin chat, then waits for the user's next message. Always use this tool to reply — it sends your message AND listens for the next one in a single step. Never use this for the first message; use wait_for_figma_message first.",
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

  // --- Figma read tools ---

  mcp.registerTool(
    "get_figma_selection",
    { description: "Returns details of the currently selected elements in Figma (id, name, type, position, size, fills, strokes, effects, text content)." },
    async () => {
      const data = await ws.sendFigmaRequest("get_selection");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "get_page_structure",
    { description: "Returns the layer tree of the current Figma page (id, name, type, children) for understanding the canvas structure." },
    async () => {
      const data = await ws.sendFigmaRequest("get_page_structure");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Figma write tools ---

  mcp.registerTool(
    "create_element",
    {
      description: "Creates a new element on the Figma canvas. Returns the created element's id and name.",
      inputSchema: {
        elementType: z.enum(["RECTANGLE", "TEXT", "FRAME", "ELLIPSE", "LINE"]).describe("Type of element to create"),
        x: z.number().optional().describe("X position (default 0)"),
        y: z.number().optional().describe("Y position (default 0)"),
        width: z.number().optional().describe("Width (default 100)"),
        height: z.number().optional().describe("Height (default 100)"),
        name: z.string().optional().describe("Layer name"),
        fillColor: z.object({
          r: z.number().min(0).max(1),
          g: z.number().min(0).max(1),
          b: z.number().min(0).max(1),
        }).optional().describe("Fill color with r, g, b values 0-1"),
        text: z.string().optional().describe("Text content (only for TEXT elements)"),
        fontSize: z.number().optional().describe("Font size (only for TEXT elements)"),
      },
    },
    async (params, _extra) => {
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
        fillColor: z.object({
          r: z.number().min(0).max(1),
          g: z.number().min(0).max(1),
          b: z.number().min(0).max(1),
        }).optional().describe("New fill color with r, g, b values 0-1"),
        text: z.string().optional().describe("New text content (only for TEXT nodes)"),
        fontSize: z.number().optional().describe("New font size (only for TEXT nodes)"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("modify_element", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "create_component",
    {
      description: "Converts an existing Figma node into a reusable component.",
      inputSchema: { nodeId: z.string().describe("The node ID of the element to convert into a component") },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("create_component", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "add_variants",
    {
      description: "Adds variants to an existing Figma component and combines them into a component set. The original component becomes the first variant.",
      inputSchema: {
        nodeId: z.string().describe("The node ID of the existing component"),
        variants: z.array(z.object({
          name: z.string().describe("Variant name (e.g. 'Secondary')"),
          fillColor: z.object({
            r: z.number().min(0).max(1),
            g: z.number().min(0).max(1),
            b: z.number().min(0).max(1),
          }).optional().describe("Optional fill color override"),
        })).describe("Array of variant definitions to add"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("add_variants", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "delete_element",
    {
      description: "Removes an element from the Figma canvas by node ID.",
      inputSchema: { nodeId: z.string().describe("The node ID of the element to delete") },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("delete_element", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Styles ---

  mcp.registerTool(
    "get_local_styles",
    { description: "Returns all local paint, text, effect, and grid styles in the Figma file." },
    async () => {
      const data = await ws.sendFigmaRequest("get_local_styles");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "create_style",
    {
      description: "Creates a new paint, text, effect, or grid style in the Figma file.",
      inputSchema: {
        styleType: z.enum(["PAINT", "TEXT", "EFFECT", "GRID"]).describe("Type of style to create"),
        name: z.string().describe("Style name (use / for grouping, e.g. 'Brand/Primary')"),
        properties: z.record(z.unknown()).describe("Style properties. For PAINT: {color: {r,g,b}} or {paints: [...]}. For TEXT: {fontSize, fontFamily, fontStyle, letterSpacing, lineHeight}. For EFFECT: {effects: [...]}. For GRID: {grids: [...]}"),
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
        styleType: z.enum(["PAINT", "STROKE", "TEXT", "EFFECT", "GRID"]).describe("Which style type to apply"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("set_style", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Variables & Tokens ---

  mcp.registerTool(
    "get_local_variables",
    { description: "Returns all local variables and variable collections in the Figma file." },
    async () => {
      const data = await ws.sendFigmaRequest("get_local_variables");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "create_variable_collection",
    {
      description: "Creates a new variable collection in the Figma file.",
      inputSchema: { name: z.string().describe("Collection name") },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("create_variable_collection", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "create_variable",
    {
      description: "Creates a new variable in a collection.",
      inputSchema: {
        collectionId: z.string().describe("The variable collection ID"),
        name: z.string().describe("Variable name"),
        resolvedType: z.enum(["COLOR", "FLOAT", "STRING", "BOOLEAN"]).describe("Variable type"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("create_variable", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "set_variable",
    {
      description: "Binds a variable to a node property.",
      inputSchema: {
        nodeId: z.string().describe("The node ID to bind the variable to"),
        variableId: z.string().describe("The variable ID to bind"),
        field: z.string().describe("The property field to bind (e.g. 'fill', 'width', 'height', 'opacity', 'itemSpacing')"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("set_variable", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Auto Layout ---

  mcp.registerTool(
    "set_auto_layout",
    {
      description: "Configures auto layout on a frame or component.",
      inputSchema: {
        nodeId: z.string().describe("The frame/component node ID"),
        direction: z.enum(["HORIZONTAL", "VERTICAL"]).optional().describe("Layout direction"),
        spacing: z.number().optional().describe("Spacing between items"),
        paddingTop: z.number().optional().describe("Top padding"),
        paddingRight: z.number().optional().describe("Right padding"),
        paddingBottom: z.number().optional().describe("Bottom padding"),
        paddingLeft: z.number().optional().describe("Left padding"),
        primaryAxisAlignItems: z.enum(["MIN", "CENTER", "MAX", "SPACE_BETWEEN"]).optional().describe("Primary axis alignment"),
        counterAxisAlignItems: z.enum(["MIN", "CENTER", "MAX"]).optional().describe("Counter axis alignment"),
        primaryAxisSizingMode: z.enum(["FIXED", "AUTO"]).optional().describe("Primary axis sizing"),
        counterAxisSizingMode: z.enum(["FIXED", "AUTO"]).optional().describe("Counter axis sizing"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("set_auto_layout", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Grouping & Boolean Operations ---

  mcp.registerTool(
    "group_nodes",
    {
      description: "Groups the specified nodes together.",
      inputSchema: { nodeIds: z.array(z.string()).describe("Array of node IDs to group") },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("group_nodes", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  mcp.registerTool(
    "boolean_operation",
    {
      description: "Performs a boolean operation (union, subtract, intersect, exclude) on nodes.",
      inputSchema: {
        nodeIds: z.array(z.string()).describe("Array of node IDs to combine"),
        operation: z.enum(["UNION", "SUBTRACT", "INTERSECT", "EXCLUDE"]).describe("Boolean operation type"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("boolean_operation", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Instances ---

  mcp.registerTool(
    "create_instance",
    {
      description: "Creates an instance of a local component.",
      inputSchema: {
        componentId: z.string().describe("The component node ID to instantiate"),
        x: z.number().optional().describe("X position (default 0)"),
        y: z.number().optional().describe("Y position (default 0)"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("create_instance", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Export ---

  mcp.registerTool(
    "export_node",
    {
      description: "Exports a node as PNG, SVG, PDF, or JPG. Returns base64-encoded data.",
      inputSchema: {
        nodeId: z.string().describe("The node ID to export"),
        format: z.enum(["PNG", "SVG", "PDF", "JPG"]).optional().describe("Export format (default PNG)"),
        scale: z.number().optional().describe("Export scale multiplier (default 1, only for PNG/JPG)"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("export_node", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Insert SVG ---

  mcp.registerTool(
    "create_node_from_svg",
    {
      description: "Creates a Figma node from an SVG string. Useful for importing icons and vector graphics.",
      inputSchema: {
        svg: z.string().describe("SVG markup string"),
        x: z.number().optional().describe("X position (default 0)"),
        y: z.number().optional().describe("Y position (default 0)"),
        name: z.string().optional().describe("Layer name for the created node"),
      },
    },
    async (params) => {
      const data = await ws.sendFigmaRequest("create_node_from_svg", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  return mcp;
}
