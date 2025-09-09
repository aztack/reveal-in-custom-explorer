# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension called "Reveal in Custom Explorer" that adds a configurable context menu item to the Explorer view, allowing users to open files and folders in their preferred file explorer application instead of the default system explorer.

## Architecture

The extension follows VS Code's standard extension structure:

- **src/extension.ts**: Main extension entry point containing activation/deactivation logic and the command handler
- **package.json**: Extension manifest defining commands, menus, configuration properties, and activation events
- **tsconfig.json**: TypeScript configuration for ES2020 target with CommonJS modules
- **esbuild.js**: Build configuration using esbuild for bundling and watching

### Key Components

- `revealInCustomExplorer.reveal` command: Registered in package.json and implemented in extension.ts
- Explorer context menu integration: Added via `contributes.menus.explorer/context`
- Configuration properties: Three settings for explorer path, menu title, and command usage method
- Cross-platform support: Handles macOS .app bundles and other platforms differently

## Development Commands

```bash
# Install dependencies
npm install

# Compile TypeScript to JavaScript
npm run compile

# Watch for changes and recompile
npm run watch

# Prepare for publishing
npm run vscode:prepublish
```

## Build System

The project uses both TypeScript compiler and esbuild:

- **TypeScript**: Compiles to `out/` directory for development
- **esbuild**: Bundles to `dist/extension.js` for production (configured in esbuild.js)
- **Watch mode**: Both TSC and esbuild have watch capabilities defined in tasks.json

## Configuration

The extension provides three configuration options:

- `revealInCustomExplorer.explorerPath`: Path to the file explorer application
- `revealInCustomExplorer.menuTitle`: Custom title for the context menu item
- `revealInCustomExplorer.useOpenCommand`: Whether to use 'open' command vs direct launch

## Testing

- Test files are located in `src/test/`
- Uses VS Code's standard testing framework
- Basic test structure is in place but minimal implementation

## Linting

ESLint configuration in `eslint.config.mjs` with TypeScript ESLint plugin and standard rules for naming conventions, semicolons, and equality checks.