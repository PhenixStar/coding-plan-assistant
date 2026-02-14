# Coding Plan Assistant (cpa)

> A CLI assistant for GLM (Z.AI) and MiniMax AI coding platforms

**Version:** 0.1.0
**NPM Package:** `coding-plan-assistant`

## Features

- **Multi-Platform Support** - Supports both GLM (Z.AI) and MiniMax platforms
- **Interactive Wizard** - Friendly onboarding guidance on first launch
- **Tool Management** - Automatically detects, installs, and configures coding tools
- **MCP Integration** - Easily manage Model Context Protocol services
- **Local Storage** - All settings are stored securely on your machine
- **Bilingual UI** - English and Chinese interface support

## Supported Coding Tools

- **Claude Code** - Full configuration support
- **Cursor** - Configuration via settings
- **Cline** - VS Code extension
- **Roo Code** - VS Code extension
- **Kilo Code** - VS Code extension
- **OpenCode** - CLI tool
- **Factory Droid** - Full configuration support

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Git (optional, for some features)

### Installation

**Option 1: Run directly with npx (recommended for occasional use)**
```bash
npx coding-plan-assistant
```

**Option 2: Install globally (recommended for frequent use)**
```bash
npm install -g coding-plan-assistant
cpa
```

### First-Time Setup

Run the interactive wizard:
```bash
uchelper init
```

The wizard will guide you through:
1. Selecting interface language
2. Choosing AI platform (GLM or MiniMax)
3. Selecting plan (Global or China)
4. Entering your API key
5. Selecting tools to manage
6. Loading configuration into tools
7. Managing MCP services (optional)

## Commands

```bash
# Show help
uchelper -h
uchelper --help

# Show version
uchelper -v
uchelper --version

# Run initialization wizard
uchelper init

# Language management
uchelper lang show              # Display current language
uchelper lang set <en_US|zh_CN> # Set language
uchelper lang                    # Interactive language selection

# Platform management
uchelper platform show           # Display current platform
uchelper platform set <glm|minimax>  # Set platform
uchelper platform                # Interactive platform selection

# API key management
uchelper auth <platform> <token>     # Set API key for platform
uchelper auth glm <token>          # Set GLM API key
uchelper auth minimax <token>       # Set MiniMax API key
uchelper auth reload <tool>        # Reload config to tool

# Tool management
uchelper tool list               # List supported tools

# Health check
uchelper doctor                 # Run health check
```

## Configuration

Configuration is stored at `~/.coding-plan-assistant/config.yaml`:

```yaml
# UI Language: en_US, zh_CN
lang: en_US

# Platform: glm, minimax
platform: glm

# Plan type: global, china
plan: global

# Platform-specific configs
glm:
  api_key: your-glm-api-key
  plan: glm_coding_plan_global  # or glm_coding_plan_china

minimax:
  api_key: your-minimax-api-key
  endpoint: api.minimax.io  # or api.minimaxi.com for China

# Active platform
active_platform: glm  # or minimax
```

## Platform Configuration

### GLM (Z.AI)

**API Documentation:** https://open.bigmodel.cn/dev/api

**Global URL:** `https://open.bigmodel.cn/api/paas/v4/`
**China URL:** `https://open.bigmodel.cn/api/paas/v4/`
**Models:** `glm-coding-plan`, `glm-coding-plan-china`

### MiniMax

**API Documentation:** https://platform.minimax.io/docs

**Global URL:** `https://api.minimax.io/anthropic`
**China URL:** `https://api.minimaxi.com/anthropic`
**Models:** `MiniMax-M2.5`, `MiniMax-M2.1`

## Tool-Specific Configuration

### Claude Code (`~/.claude/settings.json`)

> When you load GLM/MiniMax into Claude Code, the assistant replaces Claude env auth/base-url settings for that tool.  
> When you unload, it restores the previous Claude env (including prior API/OAuth-related values) from a local backup.

**GLM Configuration:**
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/paas/v4/",
    "ANTHROPIC_AUTH_TOKEN": "<GLM_API_KEY>",
    "ANTHROPIC_MODEL": "glm-coding-plan",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-coding-plan",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-coding-plan",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-coding-plan"
  }
}
```

**MiniMax Configuration:**
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.minimax.io/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "<MINIMAX_API_KEY>",
    "ANTHROPIC_MODEL": "MiniMax-M2.5",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "MiniMax-M2.5",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "MiniMax-M2.5",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "MiniMax-M2.5"
  }
}
```

### Factory Droid (`~/.factory/config.json`)

```json
{
  "custom_models": [
    {
      "model_display_name": "MiniMax-M2.5",
      "model": "MiniMax-M2.5",
      "base_url": "https://api.minimax.io/anthropic",
      "api_key": "<MINIMAX_API_KEY>",
      "provider": "anthropic",
      "max_tokens": 64000
    }
  ]
}
```

## MCP Services

Built-in MCP services that can be installed:

### GLM Services
- **GLM Usage Query** - Query GLM coding plan usage statistics
- **GLM Case Feedback** - Submit feedback for GLM coding plan issues

### Common Services
- **Vision MCP Server** - Image and vision analysis
- **Web Search MCP Server** - Web search capabilities
- **Web Reader MCP Server** - Web content reader and scraper

## Getting API Keys

### GLM (Z.AI)
Visit: https://open.bigmodel.cn/dev/api

### MiniMax
Visit: https://platform.minimax.io/docs

## Troubleshooting

Run health check to diagnose issues:
```bash
uchelper doctor
```

### Common Issues

**API Key invalid**
- Verify API key was copied correctly
- Check account has sufficient balance

**Network error**
- Check network connection
- Configure proxy if needed:
  ```bash
  export HTTP_PROXY=http://your.proxy.server:port
  export HTTPS_PROXY=http://your.proxy.server:port
  ```

**Permission denied (npm install -g)**
- Windows: Run as Administrator
- macOS/Linux: Use `sudo` or nvm

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev

# Lint
npm run lint
npm run lint:fix
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
