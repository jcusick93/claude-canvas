# Claude Canvas MCP Server

[![npm version](https://img.shields.io/npm/v/claude-canvas-mcp-server)](https://www.npmjs.com/package/claude-canvas-mcp-server)

An [MCP server](https://modelcontextprotocol.io) that lets Claude interact with Figma directly through the Claude Canvas plugin. Design, modify, and inspect Figma files using natural language.

## How it works

```
Claude Code ←(stdio)→ MCP Server ←(WebSocket)→ Figma Plugin
```

The server acts as a bridge between Claude and Figma. Claude communicates via the Model Context Protocol, and the server forwards requests to the Claude Canvas Figma plugin over a local WebSocket connection.

## Install

```bash
npm install -g claude-canvas-mcp-server
```

This automatically registers the server in your Claude Code MCP config (`~/.claude.json`). No manual setup needed.

### Manual setup

If you prefer to configure it yourself, add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "claude-canvas": {
      "command": "claude-canvas-mcp-server",
      "args": []
    }
  }
}
```

## Usage

1. Install the [Claude Canvas plugin](https://www.figma.com/community/plugin/claude-canvas) in Figma
2. Open the plugin in a Figma file
3. Start Claude Code and tell it to `start canvas loop`
4. Chat with Claude through the plugin — it can read and modify your Figma file

## Available tools

### Chat
- **wait_for_figma_message** — receive the first message from the plugin
- **respond_and_wait** — send a response and wait for the next message
- **send_status** — push a progress update to the plugin chat

### Read
- **get_figma_selection** — inspect the current selection
- **get_page_structure** — get the full layer tree
- **get_local_styles** — list paint, text, effect, and grid styles
- **get_local_variables** — list variable collections and values

### Create & modify
- **create_element** — create rectangles, text, frames, ellipses, lines
- **modify_element** — update position, size, color, text, and more
- **delete_element** — remove elements from the canvas
- **create_node_from_svg** — import SVG as a vector node
- **export_node** — export as PNG, SVG, PDF, or JPG

### Components
- **create_component** — convert a node into a component
- **add_variants** — add variants to a component set
- **create_instance** — create an instance of a component

### Styles & variables
- **create_style** — create paint, text, effect, or grid styles
- **set_style** — apply a style to a node
- **modify_variables** — bulk create/update/delete variable collections, modes, and values
- **set_variable** — bind a variable to a node property

### Layout
- **set_auto_layout** — configure auto layout (flex)
- **group_nodes** — group multiple nodes
- **boolean_operation** — union, subtract, intersect, or exclude

## Requirements

- Node.js 18+
- [Claude Code](https://claude.ai/claude-code) CLI
- [Claude Canvas Figma plugin](https://www.figma.com/community/plugin/claude-canvas)

## License

MIT
