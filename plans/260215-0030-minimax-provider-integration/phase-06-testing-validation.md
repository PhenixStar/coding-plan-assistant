# Phase 06: Testing & Validation

**Status:** Pending
**Priority:** High (Quality assurance for all features)
**Estimated Workload:** 3-4 hours

## Context Links

- [Main Plan](./plan.md)
- [All Previous Phases](.) - Features to test
- [Development Rules](../../../docs/development-rules.md) - Testing requirements

## Overview

Comprehensive testing and validation of all MiniMax integration features, including unit tests, integration tests, manual testing, and documentation updates.

## Key Insights

From development rules:
- Run tests after implementation (Step 2 in Primary Workflow)
- Use `tester` agent for test execution
- DO NOT ignore failing tests
- Fix all issues before marking phase complete
- Update documentation after implementation

## Requirements

### Functional Requirements

1. Test all MiniMax model variants (4 models)
2. Test API validation with valid and invalid keys
3. Test MCP service installation/uninstallation
4. Test tool detection and auto-configuration
5. Test bilingual support (en_US/zh_CN)
6. Test all CLI commands with MiniMax
7. Test wizard flow with MiniMax platform
8. Verify no regressions in GLM platform

### Non-Functional Requirements

1. All tests passing (no failures)
2. Code coverage > 80% for new code
3. No TypeScript compilation errors
4. No linting errors
5. Performance acceptable (validation < 10s, detection < 3s)
6. Documentation complete and accurate

## Architecture

**Test Categories:**

1. **Unit Tests**
   - `MiniMaxPlatform.validateApiKey()`
   - `MiniMaxPlatform.getToolConfig()`
   - Model selection logic
   - Translation completeness

2. **Integration Tests**
   - MCP service installation
   - Tool configuration loading/unloading
   - API key validation flow
   - Wizard flow with MiniMax

3. **Manual Tests**
   - CLI commands with MiniMax
   - Interactive wizard setup
   - Tool configuration (Claude Code, Cursor, Factory Droid)
   - Language switching

4. **Regression Tests**
   - GLM platform still works
   - Existing commands unchanged
   - No breaking changes to API

## Related Code Files

### Files to Modify

1. **`src/lib/platform-manager.ts`**
   - Add unit tests for new MiniMax features
   - Test model selection logic
   - Test API validation (mocked)

2. **`src/lib/mcp-manager.ts`**
   - Add tests for MiniMax MCP services
   - Test installation/uninstallation
   - Test service enumeration

3. **`src/lib/tool-manager.ts`**
   - Add tests for tool detection
   - Test MiniMax tool configuration
   - Test Factory Droid config updates

4. **`src/lib/wizard.ts`**
   - Add tests for MiniMax wizard flow
   - Test auto-detection logic
   - Test batch configuration

5. **`src/locales/en_US.json` & `zh_CN.json`**
   - Verify no missing translation keys
   - Test language switching

6. **`docs/`** (if needed)
   - Update development roadmap
   - Update project changelog
   - Update system architecture

### Files to Create

1. **`tests/unit/minimax-platform.test.ts`**
   - Unit tests for MiniMax platform

2. **`tests/integration/minimax-mcp.test.ts`**
   - Integration tests for MCP services

3. **`tests/integration/minimax-wizard.test.ts`**
   - Integration tests for wizard flow

4. **`tests/manual/minimax-test-plan.md`**
   - Manual testing checklist

### Files to Delete

None

## Implementation Steps

### Step 1: Create Unit Tests

1. **Test MiniMaxPlatform**
   - Test `validateApiKey()` with mocked API
   - Test `getToolConfig()` for all models
   - Test model selection for each tier (Opus/Sonnet/Haiku)
   - Test validation cache behavior
   - Test error handling

2. **Test MCP Manager**
   - Test MiniMax MCP service enumeration
   - Test service installation
   - Test service uninstallation
   - Test platform filtering

3. **Test Tool Manager**
   - Test MiniMax tool configuration
   - Test Factory Droid config generation
   - Test backup/restore logic
   - Test tool detection (mocked)

### Step 2: Create Integration Tests

1. **Test API Validation Flow**
   - Mock MiniMax API responses
   - Test valid API key validation
   - Test invalid API key validation
   - Test network error handling
   - Test timeout behavior

2. **Test MCP Service Flow**
   - Test MiniMax service installation
   - Test plugin.json creation
   - Test service enumeration
   - Test service uninstallation

3. **Test Wizard Flow**
   - Test platform selection (MiniMax)
   - Test API key entry and validation
   - Test tool detection
   - Test batch configuration
   - Test language switching

### Step 3: Manual Testing

1. **Test CLI Commands**
   - `uchelper platform set minimax`
   - `uchelper auth minimax <key>`
   - `uchelper tool detect`
   - `uchelper doctor validate`
   - `uchelper lang set en_US` / `zh_CN`

2. **Test Interactive Wizard**
   - Run `uchelper init`
   - Select MiniMax platform
   - Enter API key (test with valid and invalid)
   - Configure tools (Claude Code, Cursor, Factory Droid)
   - Test auto-detection
   - Test batch configuration

3. **Test Tool Configuration**
   - Load MiniMax config to Claude Code
   - Verify `~/.claude/settings.json` updated
   - Load MiniMax config to Factory Droid
   - Verify `~/.factory/config.json` updated
   - Test configuration unloading

4. **Test MCP Services**
   - Install MiniMax MCP services
   - Verify directories created
   - Verify plugin.json files created
   - Test service uninstallation

5. **Test Bilingual Support**
   - Test all features in English
   - Test all features in Chinese
   - Verify no missing translations
   - Check for awkward phrasing

6. **Test GLM Platform**
   - Verify GLM still works
   - Test GLM MCP services
   - Test GLM tool configuration
   - Verify no regressions

### Step 4: Fix Issues

1. **Run Tests**
   - Execute unit tests
   - Execute integration tests
   - Follow manual testing checklist

2. **Document Failures**
   - List all test failures
   - Categorize by severity (critical, major, minor)
   - Identify root causes

3. **Fix Issues**
   - Fix critical issues first
   - Fix major issues
   - Fix minor issues
   - Re-test after each fix

4. **Verify Fixes**
   - All tests passing
   - No regressions
   - No new issues

### Step 5: Update Documentation

1. **Update Development Roadmap**
   - Mark MiniMax integration complete
   - Update progress percentage
   - Add milestones achieved

2. **Update Project Changelog**
   - Document all changes
   - List new features
   - List bug fixes
   - Note breaking changes (none expected)

3. **Update System Architecture**
   - Document MiniMax platform
   - Document MCP services
   - Update architecture diagrams if needed

4. **Update Code Standards**
   - Add MiniMax coding patterns
   - Document model selection logic
   - Add API validation guidelines

## Todo List

### Unit Tests
- [ ] Create `minimax-platform.test.ts`
- [ ] Test validateApiKey()
- [ ] Test getToolConfig()
- [ ] Test model selection
- [ ] Test validation cache
- [ ] Create `minimax-mcp.test.ts`
- [ ] Test MCP service installation
- [ ] Test MCP service enumeration
- [ ] Create `minimax-tool-manager.test.ts`
- [ ] Test MiniMax tool config
- [ ] Test Factory Droid config

### Integration Tests
- [ ] Create `minimax-wizard.test.ts`
- [ ] Test wizard flow with MiniMax
- [ ] Test API validation flow
- [ ] Test tool detection flow
- [ ] Test batch configuration flow

### Manual Tests
- [ ] Test CLI commands
- [ ] Test interactive wizard
- [ ] Test Claude Code configuration
- [ ] Test Cursor configuration
- [ ] Test Factory Droid configuration
- [ ] Test MCP services
- [ ] Test bilingual support (en_US)
- [ ] Test bilingual support (zh_CN)
- [ ] Test GLM platform (regression)

### Documentation
- [ ] Update development roadmap
- [ ] Update project changelog
- [ ] Update system architecture
- [ ] Create manual test plan

### Issue Resolution
- [ ] Run all tests
- [ ] Document failures
- [ ] Fix critical issues
- [ ] Fix major issues
- [ ] Fix minor issues
- [ ] Re-test all fixes
- [ ] Verify no regressions

## Success Criteria

- All unit tests passing (100%)
- All integration tests passing (100%)
- All manual tests completed successfully
- Code coverage > 80% for new code
- No TypeScript compilation errors
- No linting errors
- No regressions in GLM platform
- Documentation updated
- All features working in both languages
- Performance acceptable (validation < 10s, detection < 3s)

## Risk Assessment

**Low Risk:**
- Testing phase has no impact on production
- Can test in isolation
- Rollback easy if issues found

**Potential Issues:**
- Mock API may not match real MiniMax API
- Integration tests may be flaky
- Manual testing may miss edge cases
- Translation quality issues only found in real use

**Mitigation:**
- Test with real MiniMax API key if available
- Make integration tests robust with retries
- Create comprehensive manual test checklist
- Have native speaker review translations
- Add smoke tests for critical paths
- Test on multiple platforms (Windows, macOS, Linux)

## Security Considerations

- No test data should include real API keys
- Use environment variables for test credentials
- Mock sensitive API responses
- Don't log sensitive data in tests
- Clean up test artifacts after testing

## Next Steps

1. Complete this phase
2. Create final integration report
3. Mark all phases as complete
4. Submit for review

## Questions That Need Further Clarification

### Question 1: Testing Environment

**Context:** Need to determine testing approach for MiniMax API.

**Recommended Solutions:**

- **Solution A:** Mock MiniMax API responses
  - Pros: No API key needed, fast tests, no quota cost
  - Cons: May not catch real API issues

- **Solution B:** Use real MiniMax API key for testing
  - Pros: Tests real API behavior
  - Cons: Consumes quota, requires API key

- **Solution C:** Hybrid - Mock for unit tests, real API for integration tests
  - Pros: Balanced approach
  - Cons: More complex test setup

**Awaiting User Selection:**
```
Please select your preferred approach:
[ ] Solution A - Mock API (recommended for unit tests)
[ ] Solution B - Real API key
[ ] Solution C - Hybrid approach
[ ] Other solution: _____________
```

### Question 2: Test API Key

**User Action Required (if using real API):**
Please provide a test MiniMax API key for integration testing:
```
Test API Key: _____________
```

### Question 3: Test Platforms

**Context:** Which platforms should we test on?

**Recommended Solutions:**

- **Solution A:** Test on Windows only (primary dev platform)
  - Pros: Faster, less setup
  - Cons: May miss platform-specific issues

- **Solution B:** Test on Windows, macOS, Linux
  - Pros: Comprehensive coverage
  - Cons: Time-consuming, requires multiple machines

**Awaiting User Selection:**
```
Please select your preferred approach:
[ ] Solution A - Windows only (minimum)
[ ] Solution B - All platforms (recommended)
[ ] Other solution: _____________
```

---

## User Feedback Area

Please supplement your opinions and suggestions on this phase:

```
User additional content:






---
```
