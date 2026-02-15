# AI Coding Tools Research Report

## Overview
This research identifies emerging AI coding tools and IDE integrations to add support for in the Unified Coding Helper. The goal is to expand from 7 current tools to 15+ tools.

## Current Tools (7)
1. Claude Code
2. Cursor
3. Cline
4. Roo Code
5. Kilo Code
6. OpenCode
7. Factory Droid

## New Tools Identified (8)

### 1. Windsurf
- **Type**: IDE Integration (VS Code fork)
- **Description**: Codeium's AI-powered fork of VS Code with AI chat and autocomplete
- **Website**: https://codeium.com/windsurf
- **Install**: Download from windsurf.net
- **Config**: `~/.windsurf/settings.json`
- **Category**: IDE-based AI assistant

### 2. Zed AI
- **Type**: AI-native IDE
- **Description**: High-performance IDE with built-in AI assistant (Zed AI)
- **Website**: https://zed.dev
- **Install**: `brew install zed` or download from zed.dev
- **Config**: `~/.config/zed/settings.json`
- **Category**: AI-native IDE

### 3. GitHub Copilot CLI
- **Type**: CLI Tool
- **Description**: GitHub's AI command-line tool for terminal assistance
- **Website**: https://github.com/features/copilot
- **Install**: `npm install -g @githubnext/github-copilot-cli`
- **Config**: `~/.github-copilot-cli/`
- **Category**: CLI-based AI assistant

### 4. Aider
- **Type**: CLI Tool
- **Description**: AI pair programming in your terminal with git integration
- **Website**: https://aider.chat
- **Install**: `pip install aider-chat` or `brew install aider`
- **Config**: `~/.config/aider/settings.yml`
- **Category**: CLI-based AI assistant

### 5. Codeium
- **Type**: VS Code Extension
- **Description**: Free AI code completion and chat for VS Code
- **Website**: https://codeium.com
- **Install**: `code --install-extension codeium.codeium`
- **Config**: VS Code workspace settings
- **Category**: IDE extension

### 6. Continue.dev
- **Type**: VS Code/JetBrains Extension
- **Description**: Open-source AI coding assistant for VS Code and JetBrains
- **Website**: https://continue.dev
- **Install**: `code --install-extension continue.continue`
- **Config**: `~/.continue/config.json`
- **Category**: IDE extension

### 7. Bolt.new
- **Type**: Web-based IDE
- **Description**: StackBlitz's AI-powered web-based coding environment
- **Website**: https://bolt.new
- **Install**: Browser-based (no installation)
- **Config**: Cloud-based
- **Category**: Web-based AI IDE

### 8. Lovable
- **Type**: Web-based IDE
- **Description**: AI-powered development platform for building web apps
- **Website**: https://lovable.dev
- **Install**: Browser-based (no installation)
- **Config**: Cloud-based
- **Category**: Web-based AI IDE

## Summary

| Tool Name | Type | Install Method | Config Location |
|-----------|------|----------------|-----------------|
| Windsurf | IDE | Download | ~/.windsurf/settings.json |
| Zed AI | IDE | brew/npm | ~/.config/zed/settings.json |
| Copilot CLI | CLI | npm | ~/.github-copilot-cli/ |
| Aider | CLI | pip/brew | ~/.config/aider/ |
| Codeium | Extension | code --install-extension | VS Code settings |
| Continue | Extension | code --install-extension | ~/.continue/config.json |
| Bolt.new | Web | Browser | Cloud-based |
| Lovable | Web | Browser | Cloud-based |

## Verification
- Total new tools identified: 8
- Requirement: 5+ tools
- Status: PASSED (8 >= 5)

## Next Steps
These tools will be added to the SUPPORTED_TOOLS object in `src/lib/tool-manager.ts` in subsequent phases:
- Phase 2: Add new tools to tool manager
- Phase 3: Update tool commands
- Phase 4: Implement configuration templates
- Phase 5: Update tests
- Phase 6: Integration testing
