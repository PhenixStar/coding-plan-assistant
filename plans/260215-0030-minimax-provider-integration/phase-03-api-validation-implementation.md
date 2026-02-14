# Phase 03: API Validation Implementation

**Status:** Pending
**Priority:** High (Critical for user trust & error handling)
**Estimated Workload:** 2-3 hours

## Context Links

- [Main Plan](./plan.md)
- [MiniMax API Research](./research/researcher-minimax-api-report.md) - Authentication section
- [Current Platform Manager](../../src/lib/platform-manager.ts) - validateApiKey() placeholder (line 84-95)

## Overview

Implement real API key validation for MiniMax platform by making actual API calls to verify credentials, replacing the current placeholder validation.

## Key Insights

From research reports:
- Current validation only checks key length (> 10 chars)
- MiniMax uses Anthropic-compatible API format
- Needs real API call to validate credentials
- MiniMax may have `/models` or similar endpoint for validation
- Must handle network errors, invalid keys, rate limits

## Requirements

### Functional Requirements

1. Implement actual API call to validate MiniMax API keys
2. Handle network errors gracefully
3. Provide clear error messages for validation failures
4. Support timeout configuration
5. Cache validation results to avoid redundant API calls
6. Integrate with existing `platformManager.validateApiKey()` interface

### Non-Functional Requirements

1. Validation should complete within 5-10 seconds
2. No false positives (validate only real valid keys)
3. Handle rate limits and network failures
4. Support both Global and China endpoints
5. Respect existing API interface (no breaking changes)

## Architecture

**Current State:**
```typescript
async validateApiKey(key: string): Promise<boolean> {
  try {
    // Basic format validation
    if (!key || key.length < 10) {
      return false;
    }
    // TODO: Add actual API validation call
    return true;
  } catch {
    return false;
  }
}
```

**Target State:**
```typescript
private validationCache: Map<string, { valid: boolean, timestamp: number }> = new Map();
private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async validateApiKey(key: string): Promise<boolean> {
  try {
    // Check cache first
    const cached = this.getCachedValidation(key);
    if (cached !== null) return cached;

    // Basic format validation
    if (!key || key.length < 10) {
      return false;
    }

    // Real API validation call
    const baseUrl = this.globalUrl; // or chinaUrl based on plan
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const isValid = response.ok;

    // Cache result
    this.cacheValidation(key, isValid);

    return isValid;
  } catch (error) {
    // Network errors, timeouts, etc.
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        logger.warning('API validation timeout');
      } else {
        logger.warning(`API validation error: ${error.message}`);
      }
    }
    return false;
  }
}
```

## Related Code Files

### Files to Modify

1. **`src/lib/platform-manager.ts`**
   - Implement `MiniMaxPlatform.validateApiKey()` with real API call
   - Add validation cache to avoid redundant calls
   - Add helper methods: `getCachedValidation()`, `cacheValidation()`
   - Add timeout handling

2. **`src/types/platform.ts`** (if needed)
   - Add validation cache types if not present

3. **`src/lib/wizard.ts`**
   - Add validation step in API key configuration flow
   - Show success/error messages for validation
   - Allow user to skip validation (optional)

### Files to Create

1. **`src/lib/api-validator.ts`** (optional)
   - Extract common validation logic for reusability
   - Support multiple platforms if needed

### Files to Delete

None

## Implementation Steps

1. **Research MiniMax validation endpoint**
   - Confirm `/models` endpoint exists and works for validation
   - Test with actual MiniMax API key if available
   - Document expected response format

2. **Implement validation cache**
   - Add `validationCache` Map to `MiniMaxPlatform` class
   - Implement `getCachedValidation()` helper
   - Implement `cacheValidation()` helper
   - Set 5-minute TTL to balance freshness & performance

3. **Implement real API validation**
   - Replace placeholder logic in `validateApiKey()`
   - Add fetch call to MiniMax API endpoint
   - Include proper headers (Authorization, Content-Type)
   - Add 10-second timeout to prevent hanging

4. **Add error handling**
   - Handle network errors gracefully
   - Detect timeout errors specifically
   - Log validation failures with context
   - Return false for any validation errors

5. **Integrate with wizard**
   - Call `validateApiKey()` after user enters API key
   - Show validation result (success/error)
   - Provide option to continue even if validation fails
   - Add loading spinner during validation

6. **Add CLI command for validation**
   - Support `uchelper doctor validate` to test API keys
   - Validate current platform's API key
   - Show detailed validation results

## Todo List

- [ ] Research MiniMax validation endpoint
- [ ] Implement validation cache helpers
- [ ] Implement real API validation logic
- [ ] Add timeout and error handling
- [ ] Integrate validation into wizard flow
- [ ] Add validation CLI command
- [ ] Test with valid API key
- [ ] Test with invalid API key
- [ ] Test network failure scenarios
- [ ] Document validation behavior

## Success Criteria

- Real API call made to validate MiniMax API keys
- Valid keys return `true`, invalid keys return `false`
- Validation completes within 10 seconds
- Network errors handled gracefully
- Cache reduces redundant API calls
- Wizard shows validation results
- CLI `doctor validate` command works
- No breaking changes to existing API

## Risk Assessment

**Medium Risk:**
- Validation endpoint may differ from documentation
- Rate limits may block validation calls
- Network errors may cause false negatives
- Timeout may be too short for slow connections

**Potential Issues:**
- `/models` endpoint may not exist or require special permissions
- Validation may consume quota (need to verify)
- Different behavior between Global and China endpoints
- CORS or other network restrictions

**Mitigation:**
- Test with real MiniMax API key early in implementation
- Add configurable timeout (default 10s, configurable via env var)
- Provide option to skip validation in wizard
- Cache validation results to minimize API calls
- Add detailed logging for debugging
- Document known limitations

## Security Considerations

- API keys sent over HTTPS only
- No logging of actual API key values
- Validation cache should be in-memory only (not persisted)
- Respect user privacy during validation
- Clear error messages (don't expose sensitive info)

## Next Steps

1. Complete this phase
2. Move to [Phase 04: Tool Detection & Auto-Configuration](./phase-04-tool-detection-auto-config.md)
3. Validated API keys will be used in tool configuration

## Questions That Need Further Clarification

### Question 1: MiniMax Validation Endpoint

**Context:** Need to confirm the correct endpoint for API key validation.

**Recommended Solutions:**

- **Solution A:** Use `/models` endpoint (Anthropic-compatible)
  - Pros: Standard endpoint, minimal response
  - Cons: May not exist or require special permissions

- **Solution B:** Use `/v1/messages` with minimal payload
  - Pros: Guaranteed to exist for API access
  - Cons: Consumes quota, slower response

- **Solution C:** Use dedicated `/auth/validate` endpoint (if exists)
  - Pros: Designed for validation, no quota cost
  - Cons: May not exist in MiniMax API

**Awaiting User Selection:**
```
Please select your preferred approach:
[ ] Solution A - Use /models endpoint (recommended)
[ ] Solution B - Use /v1/messages endpoint
[ ] Solution C - Use /auth/validate if exists
[ ] Other solution: _____________
```

### Question 2: Validation Timeout

**Context:** What timeout should we use for API validation?

**Recommended Solutions:**

- **Solution A:** 10 seconds (default)
  - Pros: Fast feedback, reasonable for most connections
  - Cons: May fail on slow networks

- **Solution B:** 15 seconds
  - Pros: More lenient for slow connections
  - Cons: Slower user feedback

**Awaiting User Selection:**
```
Please select timeout duration:
[ ] Solution A - 10 seconds (recommended)
[ ] Solution B - 15 seconds
[ ] Other duration: _____ seconds
```

### Question 3: Validation Quota Impact

**User Action Required:**
Please test with a MiniMax API key and confirm:
- Does the validation endpoint consume quota?
- What is the rate limit for validation calls?
- Are there different limits for Global vs China endpoints?

**User Response:**
```
MiniMax validation API information:
- Consumes quota: [Yes/No]
- Rate limit: _____________
- Global/China differences: _____________
```

---

## User Feedback Area

Please supplement your opinions and suggestions on this phase:

```
User additional content:






---
```
