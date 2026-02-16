/**
 * Doctor/Health Check API Module
 * Provides programmatic access to health checks and diagnostics for scripts and CI/CD
 */

import { configManager } from '../lib/config.js';
import { toolRegistry } from '../lib/tool-registry.js';
import { toolInstaller } from '../lib/tool-installer.js';
import { platformManager } from '../lib/platform-manager.js';
import type { PlatformId } from '../types/config.js';
import type { ApiResult, DoctorCheckResult, HealthCheck, HealthCheckSummary } from './types.js';

/**
 * Run health checks on the system
 * @param params - Optional parameters
 */
export async function check(params?: { platform?: PlatformId }): Promise<ApiResult<DoctorCheckResult>> {
  try {
    const platform = params?.platform || configManager.getActivePlatform();
    const checks: HealthCheck[] = [];

    // Check 1: PATH (assumed working if Node.js is running)
    checks.push({
      name: 'PATH',
      passed: true,
      message: 'PATH is available (Node.js is running)',
      severity: 'low'
    });

    // Check 2: Platform configuration
    const platformConfigured = platform !== null && platform !== undefined;
    checks.push({
      name: 'Platform Configuration',
      passed: platformConfigured,
      message: platformConfigured
        ? `Platform configured: ${platform}`
        : 'No platform configured',
      severity: 'high'
    });

    // Check 3: API key
    const apiKey = configManager.getApiKey(platform);
    if (!apiKey) {
      checks.push({
        name: 'API Key',
        passed: false,
        message: 'No API key configured',
        severity: 'critical'
      });
    } else {
      // Validate API key with platform
      const isValid = await platformManager.validateApiKey(platform, apiKey);
      checks.push({
        name: 'API Key',
        passed: isValid,
        message: isValid
          ? 'API key is valid'
          : 'API key is invalid or network error',
        severity: 'critical'
      });
    }

    // Check 4: Git installation
    const gitInstalled = toolInstaller.isGitInstalled();
    checks.push({
      name: 'Git',
      passed: gitInstalled,
      message: gitInstalled
        ? 'Git is installed'
        : 'Git is not installed',
      severity: 'medium'
    });

    // Check 5: Tools status
    const tools = toolRegistry.getSupportedTools();
    const toolChecks: HealthCheck[] = [];
    let allToolsInstalled = true;

    for (const tool of tools) {
      const installed = toolInstaller.isToolInstalled(tool.id);
      if (!installed) {
        allToolsInstalled = false;
      }
      toolChecks.push({
        name: `Tool: ${tool.name}`,
        passed: installed,
        message: installed
          ? `${tool.name} is installed`
          : `${tool.name} is not installed`,
        severity: 'medium'
      });
    }

    checks.push(...toolChecks);

    // Calculate summary
    const total = checks.length;
    const passed = checks.filter(c => c.passed).length;
    const failed = checks.filter(c => !c.passed).length;
    const warnings = toolChecks.filter(c => !c.passed).length;

    const summary: HealthCheckSummary = {
      total,
      passed,
      failed,
      warnings
    };

    const allPassed = failed === 0;

    return {
      success: true,
      data: {
        passed: allPassed,
        checks,
        summary
      },
      message: allPassed
        ? 'All health checks passed'
        : `${failed} check(s) failed`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Health check failed';
    return {
      success: false,
      error: message
    };
  }
}
