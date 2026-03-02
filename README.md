# Claude Canvas

[![npm version](https://img.shields.io/npm/v/claude-canvas-mcp-server?label=server)](https://www.npmjs.com/package/claude-canvas-mcp-server)
[![plugin version](https://img.shields.io/github/package-json/v/jcusick93/claude-canvas?filename=plugin%2Fpackage.json&label=plugin)](https://github.com/jcusick93/claude-canvas/tree/main/plugin)

Talk to Figma through Claude. Claude Canvas connects Claude Code to Figma via an MCP server and a Figma plugin, giving Claude direct access to read, create, and modify designs.

## How it works

```
Claude Code <-- stdio/MCP --> Server <-- WebSocket --> Figma Plugin <-- postMessage --> Figma API
```

The **server** is an MCP server that exposes Figma tools to Claude. The **plugin** is a Figma plugin with a chat UI that bridges commands between the server and Figma's API.

When running, Claude enters a persistent chat loop — you talk to Claude through the plugin's chat interface inside Figma, and Claude responds by reading and manipulating your designs directly.

## Setup

### Prerequisites

- Node.js >= 18
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Figma](https://www.figma.com) desktop app

### Install

```bash
npm install -g claude-canvas-mcp-server
```

This installs the MCP server and automatically registers it in your Claude Code config (`~/.claude.json`).

### Figma Plugin

Install the [Claude Canvas plugin](https://www.figma.com/community/plugin/1609844266347058170/claude-canvas) from the Figma Community.

## Usage

1. Open the Claude Canvas plugin in Figma
2. Start a Claude Code session
3. Tell Claude to **"start the canvas loop"**
4. Chat with Claude through the plugin UI — Claude can now read and edit your Figma file

## Available Tools

| Category | Tools |
|---|---|
| **Chat** | `wait_for_figma_message`, `respond_and_wait` |
| **Read** | `get_figma_selection`, `get_page_structure`, `get_local_styles`, `get_local_variables` |
| **Create/Modify** | `create_element`, `modify_element`, `delete_element` |
| **Components** | `create_component`, `add_variants`, `create_instance` |
| **Styles** | `create_style`, `set_style` |
| **Variables** | `create_variable_collection`, `create_variable`, `set_variable` |
| **Layout** | `set_auto_layout`, `group_nodes`, `boolean_operation` |
| **Export/Import** | `export_node`, `create_node_from_svg` |

## Development

```bash
git clone https://github.com/jcusick93/claude-canvas.git
cd claude-canvas
npm install
```

### Build everything

```bash
npm run build
```

### Watch mode

```bash
npm run dev
```

This runs both the server and plugin in watch mode. Plugin changes are picked up by Figma automatically. Server changes require restarting your Claude Code session.

### Project structure

```
claude-canvas/
├── server/          MCP server (Node.js, published to npm)
│   ├── src/
│   │   ├── index.ts          Entry point
│   │   ├── ws-server.ts      WebSocket server (port 8080)
│   │   ├── mcp-server.ts     MCP tool registration
│   │   └── tools/            Tool implementations
│   └── dist/index.js         Built output
├── plugin/          Figma plugin (React)
│   ├── src/
│   │   ├── app/              Chat UI (React)
│   │   └── controller/       Figma API sandbox
│   ├── manifest.json         Figma plugin manifest
│   └── dist/                 Built output
└── package.json     Monorepo root
```

## License

MIT
