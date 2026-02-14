# Phase 04: Tool Detection & Auto-Configuration

**Status:** Pending
**Priority:** Medium (UX improvement, not blocking)
**Estimated Workload:** 2-3 hours

## Context Links

- [Main Plan](./plan.md)
- [Z.AI Devpack Research](./research/researcher-zai-devpack-report.md) - Tool Auto-Detection section
- [Current Tool Manager](../../src/lib/tool-manager.ts) - isToolInstalled() method
- [Current Wizard](../../src/lib/wizard.ts) - Manual tool selection

## Overview

Implement automatic detection of installed coding tools (Claude Code, Cursor, Factory Droid, etc.) to improve setup experience by pre-selecting available tools and offering to configure them automatically.

## Key Insights

From Z.AI devpack research:
- Z.AI's helper detects installed tools and auto-configures them
- Current implementation requires manual tool selection
- `toolManager.isToolInstalled()` already exists for detection
- Can automate tool configuration flow after platform setup

## Requirements

### Functional Requirements

1. Auto-detect installed coding tools on startup
2. Pre-select detected tools in configuration wizard
3. Offer one-click configuration for detected tools
4. Support batch configuration (configure all detected tools)
5. Show installation instructions for missing tools
6. Integrate with existing `toolManager.isToolInstalled()`

### Non-Functional Requirements

1. Detection should complete within 2-3 seconds
2. No false positives (only detect actually installed tools)
3. Support Windows, macOS, Linux platforms
4. Non-intrusive (offer but don't force auto-configuration)
5. Maintain backward compatibility with manual selection

## Architecture

**Current State:**
```typescript
// Manual tool selection in wizard
async selectTool(): Promise<string> {
  const tools = toolManager.getSupportedTools();
  const { tool } = await inquirer.prompt([...]);
  return tool;
}
```

**Target State:**
```typescript
// Auto-detect and pre-select tools
async detectInstalledTools(): Promise<ToolInfo[]> {
  const allTools = toolManager.getSupportedTools();
  const installed = allTools.filter(t => toolManager.isToolInstalled(t.id));
  return installed;
}

async showToolConfigurationMenu(): Promise<void> {
  const installed = await this.detectInstalledTools();

  if (installed.length === 0) {
    console.log('No coding tools detected. Installing Claude Code...');
    await toolManager.installTool('claude-code');
  }

  const { configureTools } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'configureTools',
    message: 'Detected coding tools - select to configure:',
    choices: installed.map(t => ({
      name: `${t.displayName} (${i18n.t('wizard.detected')})`,
      value: t.id,
      checked: true // Pre-select detected tools
    }))
  }]);

  // Batch configure selected tools
  for (const toolId of configureTools) {
    await this.loadConfig(toolId, platform);
  }
}
```

## Related Code Files

### Files to Modify

1. **`src/lib/wizard.ts`**
   - Add `detectInstalledTools()` method
   - Enhance `showToolMenu()` to show detected tools first
   - Add `showToolConfigurationMenu()` for batch configuration
   - Modify `runFirstTimeSetup()` to include auto-detection

2. **`src/lib/tool-manager.ts`**
   - Review `isToolInstalled()` for accuracy
   - Add `getInstallInstructions()` for missing tools
   - Ensure detection works across all supported platforms

3. **`src/commands/init.ts`** (if exists)
   - Add auto-detection to initialization flow
   - Show summary of detected tools

### Files to Create

None for this phase

### Files to Delete

None

## Implementation Steps

1. **Enhance tool detection**
   - Review `isToolInstalled()` for each tool
   - Test detection on Windows, macOS, Linux
   - Add fallback detection methods if needed
   - Handle edge cases (tools in non-standard paths)

2. **Create auto-detection method**
   - Add `detectInstalledTools()` to wizard
   - Return array of installed ToolInfo objects
   - Include installation status for each tool

3. **Enhance tool selection UI**
   - Modify `showToolMenu()` to group detected tools first
   - Add visual indicators for detected tools
   - Show installation commands for missing tools
   - Pre-select detected tools by default

4. **Implement batch configuration**
   - Add `showToolConfigurationMenu()` method
   - Allow multi-select of tools to configure
   - Configure all selected tools in sequence
   - Show progress for batch operations

5. **Integrate into setup flow**
   - Modify `runFirstTimeSetup()` to detect tools
   - Offer auto-configuration after platform setup
   - Show summary of configured tools
   - Allow skip if user prefers manual config

6. **Add CLI command**
   - Support `uchelper tool detect` to show installed tools
   - Support `uchelper tool auto-configure` for batch setup
   - Show detailed detection results

## Todo List

- [ ] Review and test tool detection methods
- [ ] Implement `detectInstalledTools()` in wizard
- [ ] Enhance `showToolMenu()` with detection indicators
- [ ] Create `showToolConfigurationMenu()` for batch config
- [ ] Integrate into `runFirstTimeSetup()`
- [ ] Add auto-configure CLI command
- [ ] Test detection on Windows
- [ ] Test detection on macOS (if possible)
- [ ] Test detection on Linux (if possible)
- [ ] Add detection to `uchelper doctor` output

## Success Criteria

- All installed coding tools detected automatically
- Detected tools pre-selected in configuration menu
- Batch configuration works for multiple tools
- Missing tools show installation instructions
- Detection works on Windows, macOS, Linux
- No false positives or false negatives
- Setup experience improved (fewer manual steps)
- No breaking changes to existing wizard

## Risk Assessment

**Low Risk:**
- Changes are additive (new features, not replacing)
- Manual tool selection still works
- Detection uses existing `isToolInstalled()` method

**Potential Issues:**
- Detection may fail on some systems (non-standard paths)
- False positives (detect installed but actually broken)
- Cross-platform differences in detection
- Performance impact if detection is slow

**Mitigation:**
- Test detection on multiple platforms
- Add fallback detection methods
- Provide manual override if auto-detection fails
- Add timeout for slow detection methods
- Log detection failures for debugging
- Keep detection fast (< 3 seconds total)

## Security Considerations

- Tool detection reads file system only
- No code execution during detection
- No network calls for detection
- Respect user privacy (no telemetry)
- No sensitive data collected

## Next Steps

1. Complete this phase
2. Move to [Phase 05: Bilingual Localization](./phase-05-bilingual-localization.md)
3. Or skip to [Phase 06: Testing & Validation](./phase-06-testing-validation.md)

## Questions That Need Further Clarification

### Question 1: Auto-Configuration Behavior

**Context:** Should detected tools be configured automatically, or should user confirm?

**Recommended Solutions:**

- **Solution A:** Pre-select detected tools, require user confirmation
  - Pros: User control, no unexpected changes
  - Cons: Extra step in setup flow

- **Solution B:** Auto-configure detected tools, show summary after
  - Pros: Faster setup, less user friction
  - Cons: May make unexpected changes

**Awaiting User Selection:**
```
Please select your preferred approach:
[ ] Solution A - Pre-select, require confirmation (recommended)
[ ] Solution B - Auto-configure, show summary
[ ] Other solution: _____________
```

### Question 2: Claude Code Auto-Installation

**Context:** If no tools detected, should we offer to install Claude Code?

**Recommended Solutions:**

- **Solution A:** Offer to install Claude Code automatically
  - Pros: Most common tool, smooth setup
  - Cons: May not want Claude Code

- **Solution B:** Show all tools with install commands
  - Pros: User choice, no assumptions
  - Cons: More manual steps

**Awaiting User Selection:**
```
Please select your preferred approach:
[ ] Solution A - Offer Claude Code install (recommended)
[ ] Solution B - Show all tool options
[ ] Other solution: _____________
```

---

## User Feedback Area

Please supplement your opinions and suggestions on this phase:

```
User additional content:






---
```
