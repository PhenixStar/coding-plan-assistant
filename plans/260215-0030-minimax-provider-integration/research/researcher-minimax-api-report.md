# MiniMax API Research Report
**Date:** 2026-02-15
**Researcher:** Opus 4.6 (Researcher Agent)
**Focus:** MiniMax Coding Plan API integration for coding helper tools

---

## Executive Summary

MiniMax offers a subscription-based Coding Plan compatible with Anthropic API format. Provides M2.5/M2.1 models at ~1/10th cost of Claude. Supports Claude Code, Cursor, Factory Droid via Anthropic/OpenAI compatibility layers.

**Key Finding:** Uses Anthropic-compatible endpoints with custom base URLs. Requires clearing Anthropic env vars before configuration.

---

## API Endpoints

### Global Endpoint
- **Base URL:** `https://api.minimaxi.com/anthropic`
- **Alternative (OpenAI format):** `https://api.minimaxi.com/v1`
- **Authentication:** API key via `ANTHROPIC_API_KEY` or `Authorization` header
- **Protocol:** Anthropic API compatible (not standard OpenAI)

### China Endpoint
- **Base URL:** `https://api.minimaxi.com/anthropic` (same domain)
- **Note:** Documentation mentions `api.minimax.com` for global, `api.minimaxi.com` for China

**Sources:**
- [Quick Start Guide](https://platform.minimaxi.com/docs/coding-plan/quickstart)
- [Anthropic API Compatibility](https://platform.minimaxi.com/docs/api-reference/text-anthropic-api)

---

## Model Variants

### Coding Plan Models
| Model Name | Description | Output Speed |
|------------|-------------|--------------|
| `MiniMax-M2.5` | Top performance, complex tasks | Standard |
| `MiniMax-M2.5-highspeed` | Same performance, faster | Faster |
| `MiniMax-M2.1` | Multi-language coding | ~60 tps |
| `MiniMax-M2.1-highspeed` | Faster M2.1 | ~100 tps |
| `MiniMax-M2` | Efficient coding/agent workflows | Standard |

**Note:** M2.5-highspeed provided based on resource load at no extra cost.

**Source:** [Anthropic API Compatibility](https://platform.minimaxi.com/docs/api-reference/text-anthropic-api)

---

## Authentication

### API Key Format
- **Type:** Bearer token
- **Environment Variable:** `ANTHROPIC_API_KEY` (Anthropic compatibility)
- **Header:** `Authorization: Bearer <MINIMAX_API_KEY>`
- **Retrieval:** Account Management → Coding Plan → Create Coding Plan Key

### Key Constraints
- Coding Plan keys are subscription-specific (valid during subscription period)
- Separate from pay-as-you-go API keys
- Only valid for text models (Coding Plan)

**Source:** [Quick Start Guide](https://platform.minimaxi.com/docs/coding-plan/quickstart)

---

## Tool Configuration

### Claude Code
**Environment Variables:**
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.minimaxi.com/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "<MINIMAX_API_KEY>",
    "API_TIMEOUT_MS": "3000000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": 1,
    "ANTHROPIC_MODEL": "MiniMax-M2.5",
    "ANTHROPIC_SMALL_FAST_MODEL": "MiniMax-M2.5",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "MiniMax-M2.5",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "MiniMax-M2.5",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "MiniMax-M2.5"
  }
}
```

**VS Code Extension:**
```json
"claudeCode.environmentVariables": [
  {"name": "ANTHROPIC_BASE_URL", "value": "https://api.minimaxi.com/anthropic"},
  {"name": "ANTHROPIC_AUTH_TOKEN", "value": "<MINIMAX_API_KEY>"},
  {"name": "API_TIMEOUT_MS", "value": "3000000"},
  {"name": "ANTHROPIC_MODEL", "value": "MiniMax-M2.5"}
]
```

**CRITICAL:** Must clear existing Anthropic env vars (`ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`) before configuring MiniMax.

**Source:** [Claude Code Guide](https://platform.minimaxi.com/docs/coding-plan/claude-code)

---

### Cursor
**Configuration (OpenAI compatibility):**
1. Settings → Models → API Keys
2. Check "Override OpenAI Base URL"
3. Set base URL to `https://api.minimaxi.com/v1`
4. Enter MiniMax API Key in "OpenAI API Key" field
5. Add custom model: `MiniMax-M2.5`

**Source:** [AI Coding Tools Guide](https://platform.minimaxi.com/docs/guides/text-ai-coding-tools)

---

### Factory Droid
**Configuration File:** `~/.factory/config.json`
```json
{
  "custom_models": [
    {
      "model_display_name": "MiniMax-M2.5",
      "model": "MiniMax-M2.5",
      "base_url": "https://api.minimaxi.com/anthropic",
      "api_key": "<MINIMAX_API_KEY>",
      "provider": "anthropic",
      "max_tokens": 64000
    }
  ]
}
```

**Usage:**
```bash
cd /path/to/project
droid
# Type /model and select "MiniMax-M2.5"
```

**Source:** [AI Coding Tools Guide](https://platform.minimaxi.com/docs/guides/text-ai-coding-tools)

---

## API Compatibility

### Anthropic Format Support
**Fully Supported Parameters:**
- `model`, `messages`, `max_tokens`, `stream`, `system`
- `temperature` (0.0-1.0, recommend 1.0)
- `tool_choice`, `tools`, `top_p`, `thinking`, `metadata`

**Partially Supported:**
- `messages` - text/tool calls only, no image/document input
- Message types: `text`, `tool_use`, `tool_result`, `thinking` supported
- Message types: `image`, `document` NOT supported

**Ignored Parameters:**
- `top_k`, `stop_sequences`, `service_tier`, `mcp_servers`, `context_management`, `container`

**Source:** [Anthropic API Compatibility](https://platform.minimaxi.com/docs/api-reference/text-anthropic-api)

---

## Differences from GLM Platform

| Aspect | MiniMax | GLM Platform |
|--------|---------|---------------|
| **API Protocol** | Anthropic-compatible | Proprietary/OpenAI-compatible |
| **Base URL** | `api.minimaxi.com/anthropic` | `open.bigmodel.cn/api/paas/v4` |
| **Auth Header** | `ANTHROPIC_API_KEY` | `Authorization: Bearer <token>` |
| **Model Naming** | `MiniMax-M2.5` | `glm-4-plus`, `glm-4-flash` |
| **Subscription** | Fixed monthly prompts | Token-based billing |
| **Thinking Blocks** | Supported (thinking delta) | Not documented |
| **Tool Calling** | Anthropic format | OpenAI format |

**Key Differentiator:** MiniMax uses Anthropic protocol (thinking blocks, Anthropic SDK), GLM uses OpenAI/proprietary format.

---

## Pricing & Limits

### Subscription Plans
- **Starter/Plus/Max:** Fixed monthly fee, prompt-based quota
- **1 prompt ≈ 15 requests** (varies by complexity)
- **5-hour rolling window** for rate limiting
- **Pay-as-you-go fallback:** Switch to standard API key after limit

**Reset Behavior:** Rolling 5-hour window auto-restores quota.

**Source:** [Coding Plan Overview](https://platform.minimax.io/docs/coding-plan/)

---

## Integration Recommendations

### For Coding Helper Tool
1. **Add MiniMax Provider Support**
   - Endpoint: `https://api.minimaxi.com/anthropic`
   - Models: `MiniMax-M2.5`, `MiniMax-M2.5-highspeed`
   - Use Anthropic SDK for compatibility

2. **Environment Configuration**
   - Detect `ANTHROPIC_BASE_URL` pointing to MiniMax
   - Auto-switch model names to `MiniMax-*` variants
   - Warn if existing Anthropic env vars present

3. **Feature Limitations**
   - Disable image/document inputs
   - Support thinking blocks for transparency
   - Implement 5-hour rate limit handling

4. **Cost Optimization**
   - Default to `MiniMax-M2.5-highspeed` for faster responses
   - Fall back to pay-as-you-go key when quota exhausted
   - Track prompt usage against subscription limits

---

## Unresolved Questions

1. **Rate Limit Specifics:** What are exact prompt quotas per plan tier?
2. **Streaming Implementation:** Are there streaming-specific parameters needed?
3. **Error Handling:** What error codes indicate quota exhaustion vs. API failures?
4. **Model Comparison:** How does M2.5 performance compare to Claude Sonnet 4.5?
5. **Tool Definition Format:** Anthropic `tools` format fully compatible?

---

## Sources

- [Coding Plan Overview](https://platform.minimax.io/docs/coding-plan/)
- [Quick Start Guide](https://platform.minimaxi.com/docs/coding-plan/quickstart)
- [Claude Code Integration](https://platform.minimaxi.com/docs/coding-plan/claude-code)
- [Anthropic API Compatibility](https://platform.minimaxi.com/docs/api-reference/text-anthropic-api)
- [AI Coding Tools Guide](https://platform.minimaxi.com/docs/guides/text-ai-coding-tools)
