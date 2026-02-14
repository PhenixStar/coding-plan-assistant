# Phase 01: Platform Manager Enhancement

**Status:** Pending
**Priority:** High (Foundation for all other phases)
**Estimated Workload:** 1-2 hours

## Context Links

- [Main Plan](./plan.md)
- [MiniMax API Research](./research/researcher-minimax-api-report.md) - Model Variants section
- [Z.AI Devpack Research](./research/researcher-zai-devpack-report.md) - Model Mapping section

## Overview

Enhance the MiniMax platform configuration to support all model variants (M2.5, M2.5-highspeed, M2.1, M2.1-highspeed) and improve model mapping flexibility.

## Key Insights

From research reports:
- MiniMax offers 4 Coding Plan models: M2.5, M2.5-highspeed, M2.1, M2.1-highspeed
- Current implementation only has 2 models: `['MiniMax-M2.5', 'MiniMax-M2.1']`
- Missing highspeed variants which are "provided based on resource load at no extra cost"
- Z.AI pattern uses `ANTHROPIC_DEFAULT_*_MODEL` env vars for model mapping

## Requirements

### Functional Requirements

1. Add all 4 MiniMax model variants to platform config
2. Update default model to use highspeed variant for better performance
3. Support model selection per Claude model tier (Opus/Sonnet/Haiku)
4. Maintain backward compatibility with existing configs

### Non-Functional Requirements

1. No breaking changes to existing API
2. Model names must match MiniMax documentation exactly
3. Highspeed models should be default for better UX

## Architecture

**Current State:**
```typescript
const MINIMAX_CONFIG = {
  models: ['MiniMax-M2.5', 'MiniMax-M2.1'],
  defaultModel: 'MiniMax-M2.5',
  // ...
};
```

**Target State:**
```typescript
const MINIMAX_CONFIG = {
  models: [
    'MiniMax-M2.5',
    'MiniMax-M2.5-highspeed',
    'MiniMax-M2.1',
    'MiniMax-M2.1-highspeed'
  ],
  defaultModel: 'MiniMax-M2.5-highspeed',  // Use highspeed by default
  modelMapping: {
    opus: 'MiniMax-M2.5-highspeed',
    sonnet: 'MiniMax-M2.5-highspeed',
    haiku: 'MiniMax-M2.1-highspeed'
  }
  // ...
};
```

## Related Code Files

### Files to Modify

1. **`src/lib/platform-manager.ts`**
   - Update `MINIMAX_CONFIG` object
   - Add model mapping configuration
   - Enhance `getToolConfig()` to use model mapping

### Files to Create

None for this phase

### Files to Delete

None

## Implementation Steps

1. **Update MINIMAX_CONFIG object**
   - Add missing highspeed models to `models` array
   - Change `defaultModel` to `'MiniMax-M2.5-highspeed'`
   - Add `modelMapping` property for tier-based model selection

2. **Enhance MiniMaxPlatform.getToolConfig()**
   - Use model mapping instead of single default model
   - Map Opus → M2.5-highspeed, Sonnet → M2.5-highspeed, Haiku → M2.1-highspeed
   - Support custom model selection via endpoint parameter

3. **Add model selection helper**
   - Create `getModelForTier(tier: string)` method
   - Return appropriate model based on Claude tier
   - Fallback to default model for unknown tiers

4. **Update type definitions**
   - Add `ModelMapping` type to `src/types/platform.ts`
   - Extend `PlatformConfig` interface if needed

## Todo List

- [ ] Update `MINIMAX_CONFIG` in `platform-manager.ts`
- [ ] Add model mapping configuration
- [ ] Enhance `getToolConfig()` method
- [ ] Add `getModelForTier()` helper method
- [ ] Update type definitions in `platform.ts`
- [ ] Test model selection with different tiers
- [ ] Verify backward compatibility

## Success Criteria

- All 4 MiniMax models available in platform config
- Default model is `MiniMax-M2.5-highspeed`
- Model mapping works correctly for Opus/Sonnet/Haiku tiers
- Existing GLM platform configuration unchanged
- No TypeScript compilation errors

## Risk Assessment

**Low Risk:**
- Changes are additive (adding models, not removing)
- Model selection logic is isolated to MiniMax platform
- GLM platform remains untouched

**Potential Issues:**
- Model names must match MiniMax documentation exactly
- Highspeed models may have different availability in different regions

**Mitigation:**
- Use exact model names from MiniMax docs
- Add runtime validation for model availability
- Provide fallback to standard models if highspeed unavailable

## Security Considerations

- No new security risks
- Model names are configuration only, not code execution
- API key handling unchanged

## Next Steps

1. Complete this phase
2. Move to [Phase 02: MCP Services Integration](./phase-02-mcp-services-integration.md)
3. Model variants will be used by MCP services for usage queries

## Questions That Need Further Clarification

### Question 1: Default Model Selection ✅ RESOLVED

**User Decision:** Standard model (`MiniMax-M2.5`)
- Default to `MiniMax-M2.5` (standard)
- Guaranteed availability everywhere
- User can manually select highspeed if desired

### Question 2: Model Mapping Strategy ✅ RESOLVED

**User Clarification:** "we never touch opus or claude, we just load z.ai api and endpoint or its mcp"

**Key Insight from Z.AI Pattern:**
- Don't modify Claude model tiers (Opus/Sonnet/Haiku)
- Only inject provider API endpoint & API key
- Use single model for all tiers (provider handles routing)

**Simplified Approach:**
- All Claude tiers map to `MiniMax-M2.5` (standard)
- MiniMax backend handles tier-based routing
- No complex tier mapping needed

---

## User Feedback Area

Please supplement your opinions and suggestions on this phase:

```
User additional content:






---
```
