# Phase 02: MCP Services Integration

**Status:** Pending
**Priority:** High (Required for usage monitoring & feedback)
**Estimated Workload:** 2-3 hours

## Context Links

- [Main Plan](./plan.md)
- [Z.AI Devpack Research](./research/researcher-zai-devpack-report.md) - MCP Server Expansion section
- [Current MCP Manager](../../src/lib/mcp-manager.ts) - Empty MINIMAX_MCP_SERVICES array

## Overview

Populate the MiniMax MCP services array with usage query and case feedback services, following the pattern established by GLM platform.

## Key Insights

From Z.AI devpack research:
- GLM has 2 built-in MCP services: `glm-usage-query` and `glm-case-feedback`
- MiniMax currently has empty MCP services array
- MCP services are platform-specific skills for quota monitoring & issue reporting
- Pattern: Platform skills stored in `~/.claude/skills/<service-id>/`

## Requirements

### Functional Requirements

1. Add MiniMax usage query service for quota monitoring
2. Add MiniMax case feedback service for issue reporting
3. Implement service installation/uninstallation logic
4. Create plugin.json metadata for each service
5. Integrate with existing MCP manager infrastructure

### Non-Functional Requirements

1. Follow GLM MCP service patterns for consistency
2. Services should be installable/uninstallable
3. Plugin metadata must be valid JSON
4. Support both en_US and zh_CN (Phase 05 will handle translations)

## Architecture

**Current State:**
```typescript
const MINIMAX_MCP_SERVICES: McpService[] = [];
```

**Target State:**
```typescript
const MINIMAX_MCP_SERVICES: McpService[] = [
  {
    id: 'minimax-usage-query',
    name: 'MiniMax Usage Query',
    description: 'Query MiniMax coding plan usage statistics',
    category: 'minimax',
    platform: 'minimax',
    path: path.join(os.homedir(), '.claude', 'skills', 'minimax-plan-usage')
  },
  {
    id: 'minimax-case-feedback',
    name: 'MiniMax Case Feedback',
    description: 'Submit feedback for MiniMax coding plan issues',
    category: 'minimax',
    platform: 'minimax',
    path: path.join(os.homedir(), '.claude', 'skills', 'minimax-plan-feedback')
  }
];
```

## Related Code Files

### Files to Modify

1. **`src/lib/mcp-manager.ts`**
   - Populate `MINIMAX_MCP_SERVICES` array
   - Update `installService()` to handle MiniMax category
   - Update `uninstallService()` if needed

2. **`src/lib/wizard.ts`**
   - Ensure MCP menu shows MiniMax services when MiniMax platform selected
   - Verify `installAllBuiltInServices()` includes MiniMax services

### Files to Create

None for this phase (service implementation will be in future iteration)

### Files to Delete

None

## Implementation Steps

1. **Define MINIMAX_MCP_SERVICES array**
   - Add usage query service definition
   - Add case feedback service definition
   - Use same structure as GLM_MCP_SERVICES

2. **Update service installation logic**
   - Modify `installService()` to recognize `'minimax'` category
   - Create `.claude-plugin/plugin.json` for MiniMax services
   - Ensure service directories are created with proper permissions

3. **Integrate with wizard**
   - Verify `showMcpMenu()` filters by platform correctly
   - Test `installAllBuiltInServices('minimax')` functionality
   - Ensure services appear in MCP menu for MiniMax platform

4. **Add service metadata**
   - Create plugin.json with name, description, version, author
   - Follow Claude Code plugin format
   - Include commands array (empty for now, will implement later)

5. **Test service installation**
   - Install MiniMax services via CLI
   - Verify directories and plugin.json created
   - Test uninstallation
   - Ensure services appear in tool configuration

## Todo List

- [ ] Add MINIMAX_MCP_SERVICES array to `mcp-manager.ts`
- [ ] Update `installService()` to handle 'minimax' category
- [ ] Test service installation via CLI
- [ ] Verify plugin.json creation
- [ ] Test service uninstallation
- [ ] Verify services appear in wizard MCP menu
- [ ] Test `installAllBuiltInServices('minimax')`
- [ ] Document service usage

## Success Criteria

- MINIMAX_MCP_SERVICES contains 2 services (usage query, case feedback)
- Services installable via `uchelper` CLI
- Plugin.json created with valid metadata
- Services appear in wizard when MiniMax platform selected
- Services uninstallable without errors
- No regressions in GLM MCP services

## Risk Assessment

**Medium Risk:**
- MiniMax API endpoints for usage/feedback may differ from GLM
- Service paths must be correct and accessible
- Plugin.json format must match Claude Code expectations

**Potential Issues:**
- MiniMax may not have official usage/feedback APIs documented
- Service implementation may require custom API calls
- Installation paths may vary across platforms (Windows/macOS/Linux)

**Mitigation:**
- Use GLM services as template, adapt for MiniMax APIs
- Make service paths configurable if needed
- Add error handling for installation failures
- Document that service logic will be implemented in Phase 06

## Security Considerations

- Service directories should respect user permissions
- Plugin.json should not contain sensitive information
- API keys should not be stored in service configs
- Follow principle of least privilege for directory creation

## Next Steps

1. Complete this phase
2. Move to [Phase 03: API Validation Implementation](./phase-03-api-validation-implementation.md)
3. Usage query service will use validated API keys

## Questions That Need Further Clarification

### Question 1: MiniMax MCP Service Implementation

**Context:** GLM has implemented skills with actual API calls for usage queries and feedback. Should we:

**Recommended Solutions:**

- **Solution A:** Create placeholder services now, implement API logic in Phase 06
  - Pros: Faster completion, API validation done first, can test with real API
  - Cons: Services won't be functional until Phase 06

- **Solution B:** Implement full service logic now (requires MiniMax API research)
  - Pros: Complete MCP services early
  - Cons: Blocks on API endpoint discovery, may delay integration

**Awaiting User Selection:**
```
Please select your preferred approach:
[ ] Solution A - Placeholder services, implement in Phase 06 (recommended)
[ ] Solution B - Implement full services now
[ ] Other solution: _____________
```

### Question 2: Service Metadata & Commands

**Context:** Plugin.json requires a `commands` array. What commands should MiniMax services expose?

**Recommended Solutions:**

- **Solution A:** Empty commands array for now (matches GLM approach)
  - Pros: Consistent with GLM, simpler implementation
  - Cons: Services won't be invocable until commands added

- **Solution B:** Add placeholder commands (e.g., `usage-query`, `submit-feedback`)
  - Pros: Clear API contract, ready for implementation
  - Cons: Commands won't work until logic implemented

**Awaiting User Selection:**
```
Please select your preferred approach:
[ ] Solution A - Empty commands (recommended)
[ ] Solution B - Add placeholder commands
[ ] Other solution: _____________
```

### Question 3: MiniMax Usage Query API

**Context:** Does MiniMax provide an official API endpoint for querying coding plan usage?

**User Action Required:**
Please research MiniMax platform documentation and provide:
- Usage query API endpoint (if exists)
- Authentication method for usage queries
- Response format for usage data
- Rate limits for usage queries

**User Response:**
```
MiniMax usage query API information:
- Endpoint: _____________
- Auth method: _____________
- Response format: _____________
- Rate limits: _____________
```

---

## User Feedback Area

Please supplement your opinions and suggestions on this phase:

```
User additional content:






---
```
