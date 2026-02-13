# Unified Coding Helper - Implementation Plan

**Created:** 2026-02-13
**Goal:** Build a unified coding-helper that supports both GLM (Z.AI) and MiniMax platforms

## Summary

Create a unified CLI tool that helps developers manage and configure AI coding tools across multiple platforms (GLM/Z.AI and MiniMax). The tool will automatically detect, install, and configure coding tools like Claude Code, Cursor, Cline, Roo Code, etc.

## Platform Comparison

| Feature | GLM (Z.AI) | MiniMax |
|----------|-------------|----------|
| **API Base URL** | `https://open.bigmodel.cn/api/paas/v4/` | `https://api.minimax.io/anthropic` |
| **China URL** | `https://open.bigmodel.cn/api/paas/v4/` | `https://api.minimaxi.com/anthropic` |
| **Models** | glm-coding-plan, glm-coding-plan-china | MiniMax-M2.5, MiniMax-M2.1 |
| **Auth Token Env** | `ANTHROPIC_AUTH_TOKEN` | `ANTHROPIC_AUTH_TOKEN` |
| **Base URL Env** | `ANTHROPIC_BASE_URL` | `ANTHROPIC_BASE_URL` |
| **Settings File** | `~/.claude/settings.json` | `~/.claude/settings.json` |
| **OpenAI Compatible** | Yes (for some tools) | Yes (`/v1` endpoint) |

## Architecture

```
unified-coding-helper/
├── src/
│   ├── cli.ts                 # Main CLI entry point
│   ├── commands/
│   │   ├── index.ts           # Command router
│   │   ├── auth.ts            # API key management
│   │   ├── doctor.ts          # Health check
│   │   ├── lang.ts            # Language management
│   │   └── config.ts          # Config management
│   ├── lib/
│   │   ├── config.ts          # ConfigManager singleton
│   │   ├── tool-manager.ts    # Tool detection & installation
│   │   ├── platform-manager.ts # Platform abstraction (GLM/MiniMax)
│   │   ├── claude-code-manager.ts
│   │   ├── cursor-manager.ts
│   │   ├── cline-manager.ts
│   │   ├── roo-code-manager.ts
│   │   ├── mcp-manager.ts      # MCP service management
│   │   ├── wizard.ts           # Interactive wizard
│   │   ├── i18n.ts            # Internationalization
│   │   └── logger.ts          # Logging utilities
│   ├── locales/
│   │   ├── en_US.json
│   │   └── zh_CN.json
│   └── types/
│       ├── config.ts
│       ├── platform.ts
│       └── tools.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Implementation Phases

### Phase 1: Core Infrastructure

**Tasks:**
1. Initialize TypeScript project with Node.js 18+ support
2. Set up project structure and dependencies
3. Implement ConfigManager for `~/.unified-coding-helper/config.yaml`
4. Create Platform interface with GLM and MiniMax implementations
5. Build internationalization (i18n) framework

**Dependencies:**
- `commander` - CLI framework
- `inquirer` - Interactive prompts
- `chalk` - Terminal styling
- `ora` - Loading spinners
- `js-yaml` - YAML config parsing
- `terminal-link` - Terminal hyperlinks

### Phase 2: Platform Abstraction

**Tasks:**
1. Define `Platform` interface
2. Implement `GLMPlatform` class
3. Implement `MiniMaxPlatform` class
4. Create platform detection/selection logic
5. Build API validation for each platform

**Platform Interface:**
```typescript
interface Platform {
  id: string;
  name: string;
  globalUrl: string;
  chinaUrl: string;
  models: string[];
  defaultModel: string;
  getApiDocsUrl(): string;
  validateApiKey(key: string): Promise<boolean>;
  getToolConfig(plan: PlanType, apiKey: string): ToolConfig;
}
```

### Phase 3: Tool Managers

**Supported Tools:**
1. **Claude Code** - Base config in `~/.claude/settings.json`
2. **Cursor** - `~/.cursor/settings.json` or OpenAI-compatible
3. **Cline** - VS Code extension settings
4. **Roo Code** - VS Code extension settings
5. **Kilo Code** - VS Code extension settings
6. **OpenCode** - CLI tool
7. **Factory Droid** - `~/.factory/config.json`

**Per-tool responsibilities:**
- Detect if tool is installed
- Install tool if not present
- Read/write tool-specific config
- Load/unload platform configuration
- List MCP services

### Phase 4: Interactive Wizard

**Wizard Flow:**
1. Welcome screen with privacy notice
2. Language selection (English/Chinese)
3. Platform selection (GLM/MiniMax/Both)
4. Plan selection (Global/China)
5. API key entry & validation
6. Tool selection & installation
7. Load configuration to selected tools
8. MCP service management (optional)

### Phase 5: MCP Integration

**Built-in MCP Services:**
- Vision MCP Server
- Web Search MCP Server
- Web Reader MCP Server
- Usage Query Plugin (GLM)
- Case Feedback Plugin (GLM)

**MCP Manager Features:**
- List available MCP services
- Install/uninstall MCP services
- Enable/disable MCP services
- Batch install all built-in services

### Phase 6: CLI Commands

**Available Commands:**
```bash
# Interactive
unified-coding-helper          # Main menu
unified-coding-helper init         # First-time wizard

# Language
unified-coding-helper lang show    # Show current language
unified-coding-helper lang set <lang>  # Set language

# Platform & Auth
unified-coding-helper platform show     # Show current platform
unified-coding-helper platform set <platform>  # Set platform
unified-coding-helper auth <token>        # Set API key for current platform
unified-coding-helper auth glm <token>     # Set GLM API key
unified-coding-helper auth minimax <token>  # Set MiniMax API key
unified-coding-helper auth reload <tool>   # Reload config to tool

# Tools
unified-coding-helper tool list        # List supported tools
unified-coding-helper tool install <tool>  # Install tool
unified-coding-helper tool config <tool>   # Configure tool

# Health
unified-coding-helper doctor        # Run health check
```

## Configuration File

**Location:** `~/.unified-coding-helper/config.yaml`

```yaml
# UI Language: en_US, zh_CN
lang: en_US

# Platform: glm, minimax
platform: glm

# Plan type: global, china
plan: global

# API Keys (platform-specific)
glm:
  api_key: your-glm-api-key
  plan: glm_coding_plan_global  # or glm_coding_plan_china

minimax:
  api_key: your-minimax-api-key
  endpoint: api.minimax.io  # or api.minimaxi.com for China

# Active configuration
active_platform: glm  # or minimax, or both
```

## Tool-Specific Configurations

### Claude Code (`~/.claude/settings.json`)

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

### Cursor Configuration

**Via OpenAI-compatible endpoint:**
- Base URL: `https://api.minimax.io/v1`
- API Key: MiniMax API key
- Model: `MiniMax-M2.5`

### Cline/Roo Code/Kilo Code (VS Code Extensions)

**Settings.json (workspace):**
```json
{
  "cline.apiProvider": "minimax",
  "cline.minimaxEntrypoint": "api.minimax.io",
  "cline.minimaxApiKey": "<MINIMAX_API_KEY>",
  "cline.model": "MiniMax-M2.1"
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

## NPM Package

**Package name:** `@unified/coding-helper`
**Bin commands:** `unified-coding-helper`, `uchelper`

**Installation:**
```bash
# Option 1: npx (recommended for occasional use)
npx @unified/coding-helper

# Option 2: Global install (recommended for frequent use)
npm install -g @unified/coding-helper
uchelper
```

## Testing Strategy

1. **Unit Tests** - Test each manager class independently
2. **Integration Tests** - Test config loading/saving
3. **E2E Tests** - Test full wizard flows
4. **Platform Tests** - Test both GLM and MiniMax APIs

## Documentation

- README.md with quick start
- CLI help text for all commands
- Platform-specific setup guides
- Troubleshooting guide
- API documentation for TypeScript types

## Open Questions

1. Should we support both platforms simultaneously or require switching?
   - **Decision:** Support both - store keys for both, allow quick switching

2. Should we auto-detect the platform from existing API key?
   - **Decision:** Yes - validate key format to determine platform

3. How to handle MCP services that differ between platforms?
   - **Decision:** Abstract MCP services per-platform, show only relevant services

4. Should we contribute this back to Z.AI as a multi-platform version?
   - **Decision:** Build separately first, then discuss integration

## Success Criteria

- [ ] Can install and configure both GLM and MiniMax
- [ ] All supported tools (Claude Code, Cursor, Cline, etc.) work
- [ ] Interactive wizard guides users through setup
- [ ] Configuration persists between sessions
- [ ] Doctor command validates setup
- [ ] MCP services can be installed/managed
- [ ] Bilingual UI (English/Chinese)
- [ ] Works on Windows, macOS, Linux
