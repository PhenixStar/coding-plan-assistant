# MiniMax Provider Integration Plan

**Created:** 2026-02-15
**Status:** Planning
**Progress:** 0%

## Overview

Complete MiniMax provider integration for the Unified Coding Helper, following Z.AI devpack patterns. Enhance existing platform abstraction with full MiniMax model support, MCP services, API validation, and bilingual localization.

**Research Basis:**
- [MiniMax API Research](./research/researcher-minimax-api-report.md)
- [Z.AI Devpack Research](./research/researcher-zai-devpack-report.md)

## Current Status

**Completed:**
- ✅ Basic platform abstraction (`MiniMaxPlatform` class)
- ✅ Environment variable injection (Anthropic-compatible)
- ✅ Tool configuration loading/unloading
- ✅ CLI commands for platform/auth management
- ✅ Bilingual i18n infrastructure

**Gaps Identified:**
- ❌ MiniMax model variants incomplete (missing highspeed models)
- ❌ MCP services array empty (needs usage query & case feedback)
- ❌ API validation is placeholder only
- ❌ No tool auto-detection for better UX
- ❌ Missing MiniMax-specific translations

## Main Phases

1. **Phase 01:** Platform Manager Enhancement - Add all MiniMax model variants
2. **Phase 02:** MCP Services Integration - Populate MiniMax MCP services
3. **Phase 03:** API Validation Implementation - Real API key validation
4. **Phase 04:** Tool Detection & Auto-Configuration - Better UX
5. **Phase 05:** Bilingual Localization - MiniMax-specific translations
6. **Phase 06:** Testing & Validation - Comprehensive testing

## Phase Files

- [Phase 01: Platform Manager Enhancement](./phase-01-platform-manager-enhancement.md)
- [Phase 02: MCP Services Integration](./phase-02-mcp-services-integration.md)
- [Phase 03: API Validation Implementation](./phase-03-api-validation-implementation.md)
- [Phase 04: Tool Detection & Auto-Configuration](./phase-04-tool-detection-auto-config.md)
- [Phase 05: Bilingual Localization](./phase-05-bilingual-localization.md)
- [Phase 06: Testing & Validation](./phase-06-testing-validation.md)

## Success Criteria

- All MiniMax models (M2.5, M2.5-highspeed, M2.1, M2.1-highspeed) available
- MCP services for usage query & case feedback functional
- Real API key validation working
- Tool auto-detection improves setup experience
- Full bilingual support (en_US/zh_CN) for MiniMax features
- All tests passing, no regressions

## Key Dependencies

**Prerequisites:**
- MiniMax API access & documentation
- Test API key for validation
- Existing platform abstraction architecture

**Cross-Phase Dependencies:**
- Phase 03 (API validation) depends on Phase 01 (model variants)
- Phase 04 (tool detection) depends on Phase 02 (MCP services)
- Phase 05 (localization) can run in parallel with 02-04
- Phase 06 (testing) depends on all previous phases

## Risk Assessment

**Medium Risk:**
- API validation endpoint may differ from documentation
- MCP service installation paths may vary across platforms

**Mitigation:**
- Test with real MiniMax API key early in Phase 03
- Make MCP paths configurable via environment variables
- Add comprehensive error handling and user feedback

## Questions Requiring Clarification

1. **MiniMax MCP Services:**
   - Does MiniMax provide official MCP servers for usage/feedback?
   - Or should we implement custom skills like GLM's `glm-plan-usage`?

2. **API Validation Endpoint:**
   - Is `/models` endpoint the correct validation endpoint?
   - Are there rate limits for validation calls?

3. **Model Availability:**
   - Are all 4 models (M2.5, M2.5-highspeed, M2.1, M2.1-highspeed) available in both Global & China regions?
   - Should we default to highspeed variants?

**Awaiting User Input** - See individual phase files for specific questions.

## Next Steps

1. User reviews this plan and provides clarification on open questions
2. Begin Phase 01: Platform Manager Enhancement
3. Execute phases sequentially or in parallel where possible
4. Continuous testing and validation
