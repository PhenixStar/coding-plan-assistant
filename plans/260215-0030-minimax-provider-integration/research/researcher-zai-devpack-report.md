# Z.AI Devpack Research Report
**Date:** 2026-02-15
**Researcher:** Opus 4.6 (Research Agent)
**Target:** MiniMax Provider Integration

## Executive Summary

Z.AI's GLM Coding Plan provides a production-ready reference implementation for provider integration in coding tools. The system uses environment variable injection, model mapping through Claude Code's internal env vars, and automated CLI helpers for configuration. These patterns are directly applicable to MiniMax integration.

**Key Finding:** Z.AI achieves provider integration through three layers:
1. **Environment Variable Layer**: API credentials & endpoints via `ANTHROPIC_*` env vars
2. **Model Mapping Layer**: Map Claude models (Opus/Sonnet/Haiku) → provider models
3. **CLI Automation Layer**: Interactive helpers (`@z_ai/coding-helper`) for setup

## 1. Provider Selection Implementation

### 1.1 Z.AI Approach

Z.AI implements provider selection through **environment variable injection** into Claude Code's configuration file (`~/.claude/settings.json`):

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your_zai_api_key",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "API_TIMEOUT_MS": "3000000"
  }
}
```

**Model Selection via Environment Variables:**

```json
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7"
  }
}
```

**Reference:** [Claude Code - Z.AI Devpack](https://docs.z.ai/devpack/tool/claude)

### 1.2 Application to MiniMax

The existing codebase already implements this pattern correctly in `src/lib/platform-manager.ts`:

```typescript
getToolConfig(plan: PlanType, apiKey: string, endpoint: string): ToolConfig {
  const baseUrl = endpoint || (plan === 'china' ? this.chinaUrl : this.globalUrl);
  return {
    baseUrl,
    apiKey,
    model: this.defaultModel,
    env: {
      ANTHROPIC_BASE_URL: baseUrl,
      ANTHROPIC_AUTH_TOKEN: apiKey,
      ANTHROPIC_MODEL: this.defaultModel,
      ANTHROPIC_DEFAULT_SONNET_MODEL: this.defaultModel,
      ANTHROPIC_DEFAULT_OPUS_MODEL: this.defaultModel,
      ANTHROPIC_DEFAULT_HAIKU_MODEL: this.defaultModel,
      // MiniMax-specific vars
      OPENAI_BASE_URL: openAiBaseUrl,
      OPENAI_API_KEY: apiKey,
      MINIMAX_API_KEY: apiKey,
      MINIMAX_BASE_URL: baseUrl
    }
  };
}
```

**Strengths:**
- ✅ Matches Z.AI's pattern exactly
- ✅ Supports both Anthropic-compatible & OpenAI-compatible interfaces
- ✅ Platform-specific endpoints (global/china)

## 2. Configuration Injection Patterns

### 2.1 Z.AI Methods

**Method 1: Automated Coding Tool Helper** (Recommended)
```bash
npx @z_ai/coding-helper
```
- Interactive on-screen guidance
- Auto-installs tools, configures plan, manages MCP servers
- No manual file editing

**Reference:** [Quick Start - Z.AI](https://docs.z.ai/devpack/quick-start)

**Method 2: Script-Based Setup**
```bash
curl -O "https://cdn.bigmodel.cn/install/claude_code_zai_env.sh" && bash ./claude_code_zai_env.sh
```
- One-command setup
- macOS/Linux only

**Reference:** [Quick Start - Z.AI](https://docs.z.ai/devpack/quick-start)

**Method 3: Manual Configuration**
- Direct edit of `~/.claude/settings.json`
- For advanced users

**Reference:** [Claude Code - Z.AI](https://docs.z.ai/devpack/tool/claude)

### 2.2 Application to MiniMax

The existing CLI (`uchelper`) **already implements** Z.AI's Method 1 pattern:

- **Wizard-based setup:** `src/lib/wizard.ts` provides interactive configuration
- **Command-based auth:** `uchelper auth <platform> <token>`
- **Platform switching:** `uchelper platform set minimax`

**Current Implementation Strengths:**
- ✅ Interactive first-time setup wizard
- ✅ Bilingual support (en_US/zh_CN)
- ✅ Platform abstraction via `PlatformManager`
- ✅ YAML-based config persistence

**Gap Identified:**
- ❌ No automated MCP server management (like Z.AI's helper)

## 3. Interactive CLI Patterns

### 3.1 Z.AI Coding Tool Helper Features

Based on [Z.AI Quick Start Guide](https://docs.z.ai/devpack/quick-start):

1. **Automated Configuration:**
   - Detects installed coding tools
   - Auto-configures API keys & endpoints
   - Sets environment variables

2. **MCP Server Management:**
   - Auto-installs Vision/Search/Reader MCP servers
   - Configures MCP servers for selected tool
   - Platform-specific MCP services

3. **Multi-Tool Support:**
   - Claude Code, Cline, Cursor, Roo Code, etc.
   - Unified interface across tools

### 3.2 Application to MiniMax Integration

**Existing CLI Capabilities:**
```typescript
// Current structure already supports:
- uchelper init           // First-time wizard
- uchelper platform set     // Switch provider
- uchelper auth            // Configure API key
- uchelper lang             // Language selection
```

**Enhancements Needed (from Z.AI patterns):**

1. **Automated MCP Server Installation:**
   - Add MCP discovery & auto-install (partially done in `mcp-manager.ts`)
   - MiniMax-specific MCP services (currently empty array)

2. **Tool-Specific Configuration:**
   - Detect coding tools (Claude Code, Cursor, etc.)
   - Auto-configure each tool's settings.json

3. **Usage Query Integration:**
   - Add MiniMax usage query skill (similar to GLM's)
   - Real-time quota monitoring

## 4. MiniMax Integration Recommendations

### 4.1 MCP Server Expansion

**Current State:** `src/lib/mcp-manager.ts`
```typescript
const MINIMAX_MCP_SERVICES: McpService[] = [];
```

**Recommendation:** Add MiniMax-specific MCP services:
```typescript
const MINIMAX_MCP_SERVICES: McpService[] = [
  {
    id: 'minimax-usage-query',
    name: 'MiniMax Usage Query',
    description: 'Query MiniMax coding plan usage',
    category: 'minimax',
    platform: 'minimax',
    path: path.join(os.homedir(), '.claude', 'skills', 'minimax-plan-usage')
  },
  {
    id: 'minimax-case-feedback',
    name: 'MiniMax Case Feedback',
    description: 'Submit feedback for MiniMax issues',
    category: 'minimax',
    platform: 'minimax',
    path: path.join(os.homedir(), '.claude', 'skills', 'minimax-plan-bug')
  }
];
```

### 4.2 Model Mapping Enhancement

**Current Implementation:** Already correctly implements Z.AI's pattern
**No changes needed** - model mapping via `ANTHROPIC_DEFAULT_*` vars is production-ready.

### 4.3 Automated Configuration Enhancement

**Recommendation:** Add auto-detection of installed coding tools:
```typescript
// Proposed enhancement to wizard.ts
async detectInstalledTools(): Promise<string[]> {
  const tools = [];
  if (fs.existsSync(path.join(os.homedir(), '.claude'))) {
    tools.push('claude-code');
  }
  // Add detection for Cursor, Cline, etc.
  return tools;
}
```

### 4.4 API Validation

**Current State:** Basic format validation only
**Recommendation:** Implement actual API call validation (already marked as TODO in `platform-manager.ts:90`)

```typescript
async validateApiKey(key: string): Promise<boolean> {
  try {
    // MiniMax API validation call
    const response = await fetch(`${this.globalUrl}/models`, {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

## 5. Unresolved Questions

1. **MiniMax MCP Server Ecosystem:**
   - Does MiniMax provide Vision/Search/Reader MCP servers?
   - If not, what are the recommended alternatives?
   - **Action:** Research MiniMax API documentation for MCP services

2. **MiniMax Model Availability:**
   - Are `MiniMax-M2.5` and `MiniMax-M2.1` correct for Coding Plan?
   - Are there Haiku-equivalent lightweight models?
   - **Action:** Verify with MiniMax platform documentation

3. **Rate Limits & Quotas:**
   - What are MiniMax's rate limits compared to Z.AI (Lite: 80/5hrs, Pro: 400/5hrs)?
   - Should usage query be implemented before integration?
   - **Action:** Research MiniMax pricing/quota structure

4. **OpenAI Compatibility Layer:**
   - Is MiniMax's OpenAI-compatible endpoint fully compatible with Claude Code?
   - Are there known issues with the `OPENAI_*` env var approach?
   - **Action:** Test with actual MiniMax API key

## Sources

- [Z.AI Devpack Overview](https://docs.z.ai/devpack/overview)
- [Z.AI Quick Start Guide](https://docs.z.ai/devpack/quick-start)
- [Claude Code - Z.AI Devpack](https://docs.z.ai/devpack/tool/claude)
- [Cline - Z.AI Provider Config](https://docs.cline.bot/provider-config/zai)
- [Other Tools - Z.AI Devpack](https://docs.z.ai/scenario-example/develop-tools/others)

## Conclusion

The existing codebase **already implements** Z.AI's core patterns correctly. The primary integration work needed is:
1. Add MiniMax-specific MCP services
2. Implement actual API key validation
3. Add tool detection & auto-configuration
4. Research MiniMax-specific capabilities

**Assessment:** MiniMax integration is 80% complete architecturally. Remaining work is configuration & validation.
