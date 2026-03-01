# Claude Canvas Figma Plugin

The Figma plugin for [Claude Canvas](https://github.com/jcusick93/claude-canvas) — a chat interface that lets Claude read and modify your Figma files directly.

## Features

- Chat with Claude inside Figma through a built-in chat UI
- Claude can read your selection, page structure, styles, and variables
- Claude can create, modify, and delete elements on your canvas
- Claude can manage components, auto layout, boolean operations, and more
- Session history with sidebar — pick up where you left off
- Markdown rendering for Claude's responses
- Word-by-word animated message reveal

## Install

### From Figma Community

Install the Claude Canvas plugin from the [Figma Community](https://www.figma.com/community/plugin/claude-canvas) (coming soon).

### Local development

1. Clone the repo:
   ```bash
   git clone https://github.com/jcusick93/claude-canvas.git
   cd claude-canvas
   npm install
   ```

2. Build the plugin:
   ```bash
   npm run build -w plugin
   ```

3. In Figma, go to **Plugins > Development > Import plugin from manifest...**

4. Select `plugin/manifest.json`

## Development

```bash
npm run dev -w plugin
```

This runs webpack in watch mode. Figma picks up changes automatically — just re-run the plugin.

## Architecture

```
plugin/
├── src/
│   ├── app/                  React chat UI
│   │   ├── App.tsx           Main app with message state
│   │   ├── components/       UI components
│   │   │   ├── Header/       Connection status bar
│   │   │   ├── InputArea/    Message input with send/stop
│   │   │   ├── MessageList/  Scrollable message feed
│   │   │   ├── Message/      Message bubble with markdown + animations
│   │   │   ├── MessageActions/ Copy & retry buttons
│   │   │   ├── Sidebar/      Session history panel
│   │   │   ├── Landing/      Empty state with greeting
│   │   │   ├── IconButton/   Reusable icon button
│   │   │   ├── Icons/        SVG icon components
│   │   │   └── LoadingIndicator/
│   │   ├── hooks/            useFigmaStorage, useSessionManager
│   │   └── types.ts          ChatMessage, ChatSession types
│   └── controller/           Figma sandbox (postMessage bridge)
│       └── index.ts          Handles all Figma API calls
├── manifest.json             Figma plugin config
└── webpack.config.js         Builds UI + controller
```

The plugin communicates with the MCP server over WebSocket (port 8080). The chat UI runs in an iframe, and the controller runs in Figma's sandbox with access to the Figma API.

## Requirements

- [claude-canvas-mcp-server](https://www.npmjs.com/package/claude-canvas-mcp-server) installed and running
- [Claude Code](https://claude.ai/claude-code) CLI
- Figma desktop app

## License

MIT
