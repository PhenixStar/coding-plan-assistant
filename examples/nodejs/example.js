#!/usr/bin/env node

/**
 * Node.js API Usage Example for Coding Plan Assistant
 *
 * This example demonstrates how to use the Scriptable Automation API
 * programmatically in Node.js scripts and CI/CD pipelines.
 *
 * Usage:
 *   node examples/nodejs/example.js [command] [options]
 *
 * Commands:
 *   doctor           Run health checks
 *   lang             Get/set language
 *   platform         Get/set platform
 *   tools            List available tools
 *   config           Export/import configuration
 *   all              Run all API demonstrations
 *   help             Show this help message
 *
 * Options:
 *   --lang <value>    Set language (en_US, zh_CN)
 *   --platform <id>   Set platform (glm, minimax)
 *   --help           Show help
 */

import { getLang, setLang } from '../../dist/api/lang.js';
import { getPlatform, setPlatform } from '../../dist/api/platform.js';
import { getApiKey, setApiKey, reload } from '../../dist/api/auth.js';
import { listTools, loadTool, unloadTool } from '../../dist/api/tools.js';
import { check as doctorCheck } from '../../dist/api/doctor.js';
import { exportConfig, importConfig, loadConfigFile, saveConfigFile, getConfigPath } from '../../dist/api/config.js';

/**
 * Print a formatted section header
 */
function printSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

/**
 * Print API result in a formatted way
 */
function printResult(result, operation) {
  if (result.success) {
    console.log(`[OK] ${operation}:`, JSON.stringify(result.data, null, 2));
    if (result.message) {
      console.log(`     ${result.message}`);
    }
  } else {
    console.error(`[ERROR] ${operation}: ${result.error}`);
    if (result.code) {
      console.error(`        Code: ${result.code}`);
    }
  }
}

/**
 * Run doctor/health check demonstration
 */
async function runDoctorCheck(platform) {
  printSection('Doctor/Health Check');

  const result = await doctorCheck({ platform });
  printResult(result, 'Health Check');

  if (result.success && result.data.checks) {
    console.log('\nDetailed Checks:');
    for (const check of result.data.checks) {
      const status = check.passed ? '✓' : '✗';
      console.log(`  ${status} ${check.name}: ${check.message} [${check.severity}]`);
    }
    console.log(`\nSummary: ${result.data.summary.passed}/${result.data.summary.total} passed`);
  }
}

/**
 * Run language API demonstration
 */
function runLangDemo(targetLang) {
  printSection('Language API');

  // Get current language
  const getResult = getLang();
  printResult(getResult, 'Get Language');

  // Set language if requested
  if (targetLang) {
    const setResult = setLang({ lang: targetLang });
    printResult(setResult, 'Set Language');

    // Verify the change
    const verifyResult = getLang();
    printResult(verifyResult, 'Verify Language');
  }
}

/**
 * Run platform API demonstration
 */
function runPlatformDemo(targetPlatform, plan) {
  printSection('Platform API');

  // Get current platform
  const getResult = getPlatform();
  printResult(getResult, 'Get Platform');

  // Set platform if requested
  if (targetPlatform) {
    const setResult = setPlatform({ platform: targetPlatform, plan });
    printResult(setResult, 'Set Platform');

    // Verify the change
    const verifyResult = getPlatform();
    printResult(verifyResult, 'Verify Platform');
  }
}

/**
 * Run tools API demonstration
 */
function runToolsDemo() {
  printSection('Tools API');

  // List all tools
  const listResult = listTools();
  printResult(listResult, 'List Tools');

  if (listResult.success && listResult.data.tools) {
    console.log('\nAvailable Tools:');
    for (const tool of listResult.data.tools) {
      const status = tool.installed ? '✓ Installed' : '○ Not installed';
      console.log(`  - ${tool.name} (${tool.id}): ${status}`);
    }
  }
}

/**
 * Run config API demonstration
 */
function runConfigDemo() {
  printSection('Config API');

  // Export current config
  const exportResult = exportConfig();
  printResult(exportResult, 'Export Config');

  if (exportResult.success && exportResult.data.config) {
    console.log('\nExported Config Keys:', Object.keys(exportResult.data.config).join(', '));
  }
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
Node.js API Usage Example for Coding Plan Assistant

This example demonstrates how to use the Scriptable Automation API
programmatically in Node.js scripts and CI/CD pipelines.

Usage:
  node examples/nodejs/example.js [command] [options]

Commands:
  doctor           Run health checks on the system
  lang             Get or set language (en_US, zh_CN)
  platform         Get or set platform (glm, minimax)
  tools            List available tools and their status
  config           Export current configuration
  all              Run all API demonstrations (default)
  help             Show this help message

Options:
  --lang <value>     Set language when using 'lang' command (en_US, zh_CN)
  --platform <id>    Set platform when using 'platform' command (glm, minimax)
  --help             Show this help message

Examples:
  # Run all demonstrations
  node examples/nodejs/example.js all

  # Run doctor check
  node examples/nodejs/example.js doctor

  # Get current language
  node examples/nodejs/example.js lang

  # Set language to Chinese
  node examples/nodejs/example.js lang --lang zh_CN

  # List available tools
  node examples/nodejs/example.js tools

  # Export configuration
  node examples/nodejs/example.js config

  # Show this help
  node examples/nodejs/example.js help
`);
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const command = args[0] || 'all';
  const options = {};

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--lang' && args[i + 1]) {
      options.lang = args[i + 1];
      i++;
    } else if (args[i] === '--platform' && args[i + 1]) {
      options.platform = args[i + 1];
      i++;
    } else if (args[i] === '--help') {
      showHelp();
      return;
    }
  }

  // Handle help command
  if (command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  console.log('Node.js API Usage Example');
  console.log('=========================');

  try {
    // Run the requested command(s)
    switch (command) {
      case 'doctor':
        await runDoctorCheck(options.platform);
        break;

      case 'lang':
        runLangDemo(options.lang);
        break;

      case 'platform':
        runPlatformDemo(options.platform);
        break;

      case 'tools':
        runToolsDemo();
        break;

      case 'config':
        runConfigDemo();
        break;

      case 'all':
      default:
        // Run all demonstrations
        await runDoctorCheck(options.platform);
        runLangDemo(options.lang);
        runPlatformDemo(options.platform);
        runToolsDemo();
        runConfigDemo();
        break;
    }

    console.log('\n' + '-'.repeat(60));
    console.log('Example completed successfully!');
    console.log('-'.repeat(60));
  } catch (error) {
    console.error('\n[UNHANDLED ERROR]', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
