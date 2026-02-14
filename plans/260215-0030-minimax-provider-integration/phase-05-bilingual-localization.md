# Phase 05: Bilingual Localization

**Status:** Pending
**Priority:** Medium (Can run in parallel with Phases 02-04)
**Estimated Workload:** 1-2 hours

## Context Links

- [Main Plan](./plan.md)
- [Current i18n Infrastructure](../../src/lib/i18n.ts) - Locale loading system
- [English Locales](../../src/locales/en_US.json) - Current translations
- [Chinese Locales](../../src/locales/zh_CN.json) - Existing Chinese translations

## Overview

Add MiniMax-specific translations to both English and Chinese locale files to ensure complete bilingual support for all MiniMax features.

## Key Insights

From existing codebase:
- i18n infrastructure already supports en_US and zh_CN
- Translation keys use dot notation (e.g., `platform.minimax`)
- Existing GLM translations provide template
- MiniMax needs translations for: platform name, models, MCP services, error messages

## Requirements

### Functional Requirements

1. Add MiniMax platform name translations
2. Add MiniMax model name translations
3. Add MiniMax MCP service translations
4. Add MiniMax-specific error messages
5. Add MiniMax documentation URL translations
6. Maintain consistency with existing translation patterns

### Non-Functional Requirements

1. Follow existing translation key structure
2. Use natural, idiomatic language (not machine translation)
3. Keep translations concise for UI elements
4. Maintain parallel structure between en_US and zh_CN
5. No missing translations between languages

## Architecture

**Add to `src/locales/en_US.json`:**
```json
{
  "platform": {
    "minimax_display": "MiniMax",
    "minimax_models": {
      "m2_5": "MiniMax M2.5",
      "m2_5_highspeed": "MiniMax M2.5 (High Speed)",
      "m2_1": "MiniMax M2.1",
      "m2_1_highspeed": "MiniMax M2.1 (High Speed)"
    }
  },
  "mcp": {
    "minimax_usage_query": "MiniMax Usage Query",
    "minimax_case_feedback": "MiniMax Case Feedback",
    "minimax_usage_query_desc": "Query MiniMax coding plan usage statistics",
    "minimax_case_feedback_desc": "Submit feedback for MiniMax issues"
  },
  "minimax": {
    "api_validation_success": "MiniMax API key validated successfully",
    "api_validation_failed": "MiniMax API key validation failed",
    "quota_exceeded": "MiniMax quota exceeded",
    "usage_query_failed": "Failed to query MiniMax usage",
    "feedback_submitted": "Feedback submitted to MiniMax"
  }
}
```

**Add to `src/locales/zh_CN.json`:**
```json
{
  "platform": {
    "minimax_display": "MiniMax",
    "minimax_models": {
      "m2_5": "MiniMax M2.5",
      "m2_5_highspeed": "MiniMax M2.5 (高速版)",
      "m2_1": "MiniMax M2.1",
      "m2_1_highspeed": "MiniMax M2.1 (高速版)"
    }
  },
  "mcp": {
    "minimax_usage_query": "MiniMax 使用量查询",
    "minimax_case_feedback": "MiniMax 问题反馈",
    "minimax_usage_query_desc": "查询 MiniMax 编程计划使用统计",
    "minimax_case_feedback_desc": "提交 MiniMax 问题反馈"
  },
  "minimax": {
    "api_validation_success": "MiniMax API 密钥验证成功",
    "api_validation_failed": "MiniMax API 密钥验证失败",
    "quota_exceeded": "MiniMax 配额已用完",
    "usage_query_failed": "查询 MiniMax 使用量失败",
    "feedback_submitted": "已向 MiniMax 提交反馈"
  }
}
```

## Related Code Files

### Files to Modify

1. **`src/locales/en_US.json`**
   - Add MiniMax platform translations
   - Add MiniMax model name translations
   - Add MiniMax MCP service translations
   - Add MiniMax error messages

2. **`src/locales/zh_CN.json`**
   - Add corresponding Chinese translations
   - Ensure parallel structure with en_US
   - Use natural, idiomatic Chinese

3. **`src/lib/platform-manager.ts`** (if needed)
   - Update to use i18n for platform display names
   - Use translated model names in UI

4. **`src/lib/mcp-manager.ts`** (if needed)
   - Update to use i18n for MCP service names
   - Use translated descriptions

### Files to Create

None for this phase

### Files to Delete

None

## Implementation Steps

1. **Add platform translations**
   - Add `platform.minimax_display` to both locale files
   - Add `platform.minimax_models.*` for all 4 models
   - Ensure model names match MiniMax documentation

2. **Add MCP service translations**
   - Add `mcp.minimax_usage_query` and description
   - Add `mcp.minimax_case_feedback` and description
   - Keep translations concise but descriptive

3. **Add error message translations**
   - Add `minimax.api_validation_success` / `failed`
   - Add `minimax.quota_exceeded`
   - Add `minimax.usage_query_failed`
   - Add `minimax.feedback_submitted`
   - Use consistent, clear messaging

4. **Add documentation URL translations**
   - Add `minimax.docs_url` if needed
   - Add `minimax.get_api_key_hint` translations
   - Ensure URLs are correct for both languages

5. **Integrate translations into code**
   - Update `platform-manager.ts` to use `i18n.t()` for MiniMax names
   - Update `mcp-manager.ts` to use `i18n.t()` for service names
   - Update `wizard.ts` to use `i18n.t()` for MiniMax messages
   - Update `auth.ts` to use `i18n.t()` for validation messages

6. **Test language switching**
   - Test all MiniMax features in English
   - Test all MiniMax features in Chinese
   - Verify no missing translations
   - Check for awkward phrasing

## Todo List

- [ ] Add MiniMax platform translations to en_US.json
- [ ] Add MiniMax platform translations to zh_CN.json
- [ ] Add model name translations (4 models)
- [ ] Add MCP service translations (2 services)
- [ ] Add error message translations (5+ messages)
- [ ] Update platform-manager.ts to use i18n
- [ ] Update mcp-manager.ts to use i18n
- [ ] Update wizard.ts to use i18n
- [ ] Test in English (en_US)
- [ ] Test in Chinese (zh_CN)
- [ ] Verify no missing translation keys

## Success Criteria

- All MiniMax features have English translations
- All MiniMax features have Chinese translations
- No missing translation keys between languages
- Translations are natural and idiomatic
- Language switching works correctly
- No hardcoded MiniMax text in TypeScript files
- Consistent with existing GLM translation patterns

## Risk Assessment

**Low Risk:**
- Translations are additive (no breaking changes)
- Existing i18n infrastructure is solid
- Can test both languages independently

**Potential Issues:**
- Awkward machine translations if not reviewed
- Missing translations causing fallback to keys
- Inconsistent terminology between languages
- Cultural differences in phrasing

**Mitigation:**
- Have native speaker review Chinese translations
- Use professional terminology (not slang)
- Test with both languages before finalizing
- Keep translations simple and direct
- Follow GLM translation patterns as template

## Security Considerations

- No security risks for translations
- Ensure no sensitive data in locale files
- Translation keys don't expose implementation details

## Next Steps

1. Complete this phase
2. Move to [Phase 06: Testing & Validation](./phase-06-testing-validation.md)
3. All features will be tested in both languages

## Questions That Need Further Clarification

### Question 1: Chinese Translation Review

**Context:** Chinese translations should be natural and idiomatic, not machine-translated.

**User Action Required:**
Please review the proposed Chinese translations and provide corrections:

```
Proposed translations:
- "MiniMax Usage Query" → "MiniMax 使用量查询"
- "MiniMax Case Feedback" → "MiniMax 问题反馈"
- "High Speed" → "高速版"
- "API key validated successfully" → "API 密钥验证成功"

Corrections needed:
- _____________
- _____________
- _____________
```

### Question 2: Model Name Display

**Context:** Should model names be translated or kept in English?

**Recommended Solutions:**

- **Solution A:** Keep model names in English (MiniMax-M2.5, etc.)
  - Pros: Consistent with MiniMax docs, no confusion
  - Cons: Mixed language for Chinese users

- **Solution B:** Translate model names (M2.5 模型, etc.)
  - Pros: Fully localized experience
  - Cons: May not match MiniMax documentation

**Awaiting User Selection:**
```
Please select your preferred approach:
[ ] Solution A - Keep model names in English (recommended)
[ ] Solution B - Translate model names
[ ] Other solution: _____________
```

---

## User Feedback Area

Please supplement your opinions and suggestions on this phase:

```
User additional content:






---
```
