# MiniMax Integration Planning Report

**Date:** 2026-02-15
**Planner:** Opus 4.6 (Sonnet 4.5)
**Project:** Unified Coding Helper (uchelper)
**Task:** MiniMax Provider Integration

## Executive Summary

Complete implementation plan created for MiniMax provider integration, following Z.AI devpack patterns. Plan includes 6 detailed phases covering platform enhancement, MCP services, API validation, tool detection, bilingual localization, and comprehensive testing.

**Key Finding:** MiniMax integration is ~80% complete architecturally. Primary work is configuration enhancement, MCP service population, and validation implementation.

## Planning Overview

### Input Materials

1. **Research Report: MiniMax API** (`researcher-minimax-api-report.md`)
   - MiniMax Coding Plan API endpoints
   - Model variants (M2.5, M2.5-highspeed, M2.1, M2.1-highspeed)
   - Anthropic-compatible API format
   - Tool configuration examples

2. **Research Report: Z.AI Devpack** (`researcher-zai-devpack-report.md`)
   - Provider selection patterns
   - Environment variable injection
   - MCP server management
   - CLI automation patterns

3. **Current Codebase Analysis**
   - `src/lib/platform-manager.ts` - Platform abstraction (MiniMax exists, incomplete)
   - `src/lib/mcp-manager.ts` - MCP services (MiniMax array empty)
   - `src/lib/tool-manager.ts` - Tool config loading (already functional)
   - `src/lib/wizard.ts` - Interactive setup (already supports MiniMax)
   - `src/locales/` - i18n infrastructure (bilingual ready)

### Planning Approach

Followed systematic WBS (Work Breakdown Structure) methodology:
1. Analyzed task complexity and scope
2. Identified 6 main phases based on dependencies
3. Created detailed phase files with acceptance criteria
4. Listed open questions requiring user clarification
5. Identified risks and mitigation strategies

## Phases Overview

### Phase 01: Platform Manager Enhancement (1-2 hours)
**Objective:** Add all MiniMax model variants and improve model mapping

**Key Deliverables:**
- Add 4 models: M2.5, M2.5-highspeed, M2.1, M2.1-highspeed
- Default to highspeed variant for better UX
- Model tier mapping (Opus/Sonnet → M2.5-highspeed, Haiku → M2.1-highspeed)

**Dependencies:** None (foundation phase)

**Open Questions:**
- Default model selection (highspeed vs standard)
- Model mapping strategy (all highspeed vs tiered)

### Phase 02: MCP Services Integration (2-3 hours)
**Objective:** Populate MiniMax MCP services array

**Key Deliverables:**
- Add 2 MCP services: usage query, case feedback
- Install/uninstall functionality
- Plugin.json metadata

**Dependencies:** Phase 01 (model variants used by MCP services)

**Open Questions:**
- Service implementation timing (placeholder vs full implementation)
- Service metadata commands (empty vs placeholder)
- MiniMax usage query API endpoint information needed

### Phase 03: API Validation Implementation (2-3 hours)
**Objective:** Implement real API key validation

**Key Deliverables:**
- Real API call to validate credentials
- Validation cache (5-minute TTL)
- Timeout handling (10 seconds)
- Integration with wizard flow

**Dependencies:** Phase 01 (uses enhanced platform config)

**Open Questions:**
- Validation endpoint selection (/models vs /v1/messages vs /auth/validate)
- Timeout duration (10s vs 15s)
- MiniMax validation API quota impact needed

### Phase 04: Tool Detection & Auto-Configuration (2-3 hours)
**Objective:** Auto-detect installed coding tools

**Key Deliverables:**
- Auto-detect Claude Code, Cursor, Factory Droid, etc.
- Pre-select detected tools in wizard
- Batch configuration support
- CLI commands for detection

**Dependencies:** Phase 02 (MCP services used in tool config)

**Open Questions:**
- Auto-configuration behavior (pre-select vs auto-configure)
- Claude Code auto-installation (offer vs show all options)

### Phase 05: Bilingual Localization (1-2 hours)
**Objective:** Add MiniMax-specific translations

**Key Deliverables:**
- English translations for platform, models, MCP services, errors
- Chinese translations for all features
- Integration with i18n system

**Dependencies:** None (can run in parallel with Phases 02-04)

**Open Questions:**
- Chinese translation review needed
- Model name display (English vs translated)

### Phase 06: Testing & Validation (3-4 hours)
**Objective:** Comprehensive testing of all features

**Key Deliverables:**
- Unit tests for new code
- Integration tests for flows
- Manual testing checklist
- Documentation updates
- All tests passing, no regressions

**Dependencies:** All previous phases

**Open Questions:**
- Testing environment (mock vs real API)
- Test API key availability
- Test platforms (Windows only vs all platforms)

## Total Estimated Workload

**Minimum:** 11-17 hours (without open questions resolution)
**Maximum:** 15-23 hours (with research and testing on multiple platforms)

## Key Architectural Decisions

### 1. Model Selection Strategy
- **Decision:** Use Anthropic-compatible API format
- **Rationale:** Matches Z.AI pattern, already implemented
- **Trade-off:** Limited to Anthropic parameters (no image/document input)

### 2. MCP Services Approach
- **Decision:** Populate MCP array with placeholder services first
- **Rationale:** Unblocks other phases, API validation done first
- **Trade-off:** Services not functional until Phase 06

### 3. API Validation Endpoint
- **Decision:** Use /models endpoint (Anthropic-compatible)
- **Rationale:** Standard endpoint, minimal response, likely exists
- **Trade-off:** May not exist or require special permissions

### 4. Validation Caching
- **Decision:** 5-minute TTL for validation cache
- **Rationale:** Balances freshness with performance
- **Trade-off:** Stale validations possible within window

### 5. Auto-Detection
- **Decision:** Pre-select detected tools, require confirmation
- **Rationale:** User control, no unexpected changes
- **Trade-off:** Extra step in setup flow

## Risk Assessment

### High Risk Items
1. **MiniMax API endpoint uncertainty**
   - **Mitigation:** Test with real API key early in Phase 03
   - **Fallback:** Implement alternative endpoints

2. **MCP service API discovery**
   - **Mitigation:** Follow GLM pattern as template
   - **Fallback:** Create custom skills if official APIs don't exist

### Medium Risk Items
1. **Cross-platform compatibility**
   - **Mitigation:** Test on Windows, macOS, Linux
   - **Fallback:** Platform-specific paths via env vars

2. **Translation quality**
   - **Mitigation:** Native speaker review
   - **Fallback:** Iterative improvement based on user feedback

### Low Risk Items
1. **Backward compatibility**
   - **Mitigation:** Additive changes only
   - **Verification:** GLM platform testing in Phase 06

## Questions Requiring User Clarification

### Critical (Blocking)

1. **MiniMax Usage Query API** (Phase 02)
   - Does official API endpoint exist?
   - What is the endpoint URL?
   - What is the response format?

2. **MiniMax Validation Endpoint** (Phase 03)
   - Confirm /models endpoint exists
   - Does validation consume quota?
   - What are rate limits?

### Important (Non-Blocking)

3. **Default Model Selection** (Phase 01)
   - Use highspeed by default (recommended) or standard?

4. **Model Mapping Strategy** (Phase 01)
   - All tiers use highspeed or tiered approach?

5. **Auto-Configuration Behavior** (Phase 04)
   - Pre-select with confirmation or auto-configure?

6. **Chinese Translation Review** (Phase 05)
   - Native speaker review needed

### Optional

7. **Testing Approach** (Phase 06)
   - Mock API, real API, or hybrid?
   - Test on all platforms or Windows only?

## Success Criteria

### Must Have
- [ ] All 4 MiniMax models available and functional
- [ ] Real API key validation working
- [ ] MCP services installable/uninstallable
- [ ] Tool detection improves UX
- [ ] Full bilingual support
- [ ] All tests passing
- [ ] No regressions in GLM platform

### Should Have
- [ ] MCP services functional (usage query, feedback)
- [ ] API validation cache working
- [ ] Batch tool configuration
- [ ] Performance acceptable (< 10s validation, < 3s detection)

### Could Have
- [ ] Advanced error messages
- [ ] Configuration presets
- [ ] Usage analytics integration

## Next Steps

### Immediate Actions

1. **User Reviews Plan**
   - Read all 6 phase files
   - Answer open questions
   - Provide MiniMax API information

2. **Resolve Blocking Questions**
   - Research MiniMax usage query API
   - Confirm validation endpoint
   - Provide test API key if available

3. **Begin Implementation**
   - Start Phase 01: Platform Manager Enhancement
   - Follow phases sequentially or in parallel where possible
   - Update task list as progress is made

### Implementation Order

**Sequential (Recommended):**
1. Phase 01 → Platform enhancement (foundation)
2. Phase 03 → API validation (uses Phase 01)
3. Phase 02 → MCP services (uses Phase 01)
4. Phase 04 → Tool detection (uses Phase 02)
5. Phase 05 → Localization (parallel with 02-04)
6. Phase 06 → Testing (after all implementation)

**Parallel Opportunities:**
- Phases 02, 04, 05 can run in parallel after Phase 01
- Phase 03 can run in parallel with Phase 02
- Phase 05 (localization) completely independent

## Documentation Deliverables

Created Files:
1. `plan.md` - Overview and coordination
2. `phase-01-platform-manager-enhancement.md` - Model variants
3. `phase-02-mcp-services-integration.md` - MCP services
4. `phase-03-api-validation-implementation.md` - API validation
5. `phase-04-tool-detection-auto-config.md` - Tool detection
6. `phase-05-bilingual-localization.md` - Translations
7. `phase-06-testing-validation.md` - Testing plan
8. `planner-260215-0033-minimax-integration-planning.md` - This report

Location: `D:/AI/coding-helper/plans/260215-0030-minimax-provider-integration/`

## Conclusion

MiniMax provider integration is well-architected and ~80% complete. The remaining work consists of:
1. Configuration enhancement (model variants, mapping)
2. MCP service population (usage query, feedback)
3. API validation implementation (real API calls)
4. UX improvements (tool detection, bilingual support)
5. Comprehensive testing and validation

The plan is detailed, actionable, and follows Z.AI devpack patterns. All phases have clear acceptance criteria, risk assessments, and open questions documented.

**Recommendation:** Proceed with implementation after user clarifies blocking questions about MiniMax API endpoints.

---

**Plan Status:** Ready for Implementation
**Awaiting:** User clarification on API endpoints, model selection preferences
**Estimated Timeline:** 2-3 days (11-23 hours depending on scope)

---

*Report generated by Opus 4.6 (Sonnet 4.5) - Planning Agent*
*Date: 2026-02-15*
