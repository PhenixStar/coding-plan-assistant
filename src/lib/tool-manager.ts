import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import type { PlatformId } from '../types/tools.js';
import type { ToolConfig } from '../types/platform.js';
import { toolPlatformConfig } from './tool-platform-config.js';
import { toolRegistry } from './tool-registry.js';
import { toolConfigManager } from './tool-config-manager.js';
import { toolBackupManager } from './tool-backup-manager.js';
import { logger } from './logger.js';
import { secureCredentialManager } from './secure-credential-manager.js';

const CPA_STATE_DIR = path.join(os.homedir(), '.unified-coding-helper');
const TOOL_BACKUP_FILE = path.join(CPA_STATE_DIR, 'tool-backups.json');

const SUPPORTED_TOOLS: Record<string, ToolInfo> = {
  'claude-code': {
    id: 'claude-code',
    name: 'Claude Code',
    command: 'claude',
    installCommand: 'npm install -g @anthropic-ai/claude-code',
    configPath: path.join(os.homedir(), '.claude', 'settings.json'),
    displayName: 'Claude Code',
    supported: true
  },
  'cursor': {
    id: 'cursor',
    name: 'Cursor',
    command: 'cursor',
    installCommand: 'cursor --version || echo "Install from https://cursor.sh"',
    configPath: path.join(os.homedir(), '.cursor', 'settings.json'),
    displayName: 'Cursor',
    supported: true
  },
  'cline': {
    id: 'cline',
    name: 'Cline',
    command: 'code --list-extensions | grep -i cline',
    installCommand: 'code --install-extension abc.cline',
    configPath: '', // VS Code workspace settings.json
    displayName: 'Cline (VS Code)',
    supported: true
  },
  'roo-code': {
    id: 'roo-code',
    name: 'Roo Code',
    command: 'code --list-extensions | grep -i "roo code"',
    installCommand: 'code --install-extension roovetterinc.roo-code',
    configPath: '', // VS Code workspace settings.json
    displayName: 'Roo Code (VS Code)',
    supported: true
  },
  'kilo-code': {
    id: 'kilo-code',
    name: 'Kilo Code',
    command: 'code --list-extensions | grep -i "kilo code"',
    installCommand: 'code --install-extension kilinc.kilo-code',
    configPath: '', // VS Code workspace settings.json
    displayName: 'Kilo Code (VS Code)',
    supported: true
  },
  'opencode': {
    id: 'opencode',
    name: 'OpenCode',
    command: 'opencode --version',
    installCommand: 'npm install -g opencode',
    configPath: path.join(os.homedir(), '.opencode', 'config.json'),
    displayName: 'OpenCode',
    supported: true
  },
  'factory-droid': {
    id: 'factory-droid',
    name: 'Factory Droid',
    command: 'droid --version',
    installCommand: 'curl -fsSL https://app.factory.ai/cli | sh',
    configPath: path.join(os.homedir(), '.factory', 'config.json'),
    displayName: 'Factory Droid',
    supported: true
  }
};

const CPA_STATE_DIR = path.join(os.homedir(), '.unified-coding-helper');
const TOOL_BACKUP_FILE = path.join(CPA_STATE_DIR, 'tool-backups.json');

interface LegacyClaudeBackup {
  env?: Record<string, string>;
}

interface ToolBackups {
  toolConfigs?: Record<string, any>;
}

// Shell metacharacters that require shell interpretation
const SHELL_METACHARACTERS = /[;&|`$(){}[\]<>\\!#*?"'\n\r]/;

/**
 * Check if a command contains shell metacharacters
 */
function hasShellMetacharacters(command: string): boolean {
  return SHELL_METACHARACTERS.test(command);
}

/**
 * Parse a simple command into [program, args]
 * Returns null if command contains shell metacharacters
 */
function parseSimpleCommand(command: string): { program: string; args: string[] } | null {
  if (hasShellMetacharacters(command)) {
    return null;
  }

  const parts = command.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) {
    return null;
  }

  return {
    program: parts[0],
    args: parts.slice(1)
  };
}

/**
 * Execute a command safely - uses execFileSync for simple commands
 * Returns true if command succeeds, false otherwise
 */
function safeExecSync(command: string): boolean {
  try {
    const parsed = parseSimpleCommand(command);

    if (parsed) {
      // Safe: execFileSync doesn't use shell, args are passed directly
      execFileSync(parsed.program, parsed.args, { stdio: 'ignore' });
    } else {
      // Shell command detected - reject for safety
      logger.debug(`Shell command rejected for safety: ${command}`);
      return false;
    }
    return true;
  } catch (error) {
    logger.debug(`Safe command execution failed for ${command}: ${(error as Error).message}`);
    return false;
  }
}

class ToolManager {
  private static instance: ToolManager;

  private constructor() {}

  static getInstance(): ToolManager {
    if (!ToolManager.instance) {
      ToolManager.instance = new ToolManager();
    }
    return ToolManager.instance;
  }

  getTool(toolId: string): ToolInfo | undefined {
    return toolRegistry.getTool(toolId);
  }

  getSupportedTools(): ToolInfo[] {
    return toolRegistry.getSupportedTools();
  }

  isToolInstalled(toolId: string): boolean {
    const tool = toolRegistry.getTool(toolId);
    if (!tool) return false;

    return safeExecSync(tool.command);

    if (this.isToolInstalled(toolId)) {
      logger.info(`${tool.displayName} is already installed`);
      return true;
    }

    try {
      logger.info(`Installing ${tool.displayName}...`);
      execSync(tool.installCommand, { stdio: 'inherit' });
      logger.success(`${tool.displayName} installed successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to install ${tool.displayName}`);
      return false;
    }
  }

  getToolConfig(toolId: string): any | undefined {
    const tool = SUPPORTED_TOOLS[toolId];
    if (!tool || !tool.configPath) return undefined;

    try {
      if (fs.existsSync(tool.configPath)) {
        const content = fs.readFileSync(tool.configPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      logger.warning(`Failed to read config for ${tool.name}`);
    }
    return undefined;
  }

  updateToolConfig(toolId: string, config: any): boolean {
    const tool = SUPPORTED_TOOLS[toolId];
    if (!tool || !tool.configPath) return false;

    try {
      const configDir = path.dirname(tool.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      const existing: any = {};
      if (fs.existsSync(tool.configPath)) {
        const content = fs.readFileSync(tool.configPath, 'utf-8');
        Object.assign(existing, JSON.parse(content));
      }

      const merged = { ...existing, ...config };
      fs.writeFileSync(tool.configPath, JSON.stringify(merged, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to update config for ${tool.name}: ${error}`);
      return false;
    }
  }

  private replaceToolConfig(toolId: string, config: any): boolean {
    const tool = SUPPORTED_TOOLS[toolId];
    if (!tool || !tool.configPath) return false;

    try {
      const configDir = path.dirname(tool.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(tool.configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to replace config for ${tool.name}: ${error}`);
      return false;
    }
  }

  private readBackups(): ToolBackups {
    try {
      if (!fs.existsSync(TOOL_BACKUP_FILE)) {
        return {};
      }
      const content = fs.readFileSync(TOOL_BACKUP_FILE, 'utf-8');
      return JSON.parse(content) as ToolBackups;
    } catch {
      return {};
    }
  }

  private writeBackups(backups: ToolBackups): void {
    if (!fs.existsSync(CPA_STATE_DIR)) {
      fs.mkdirSync(CPA_STATE_DIR, { recursive: true });
    }
    fs.writeFileSync(TOOL_BACKUP_FILE, JSON.stringify(backups, null, 2));
  }

  private backupToolConfigIfNeeded(toolId: string): void {
    const backups = this.readBackups();
    backups.toolConfigs = backups.toolConfigs || {};

    if (Object.prototype.hasOwnProperty.call(backups.toolConfigs, toolId)) {
      return;
    }

    const current = this.getToolConfig(toolId) || {};
    backups.toolConfigs[toolId] = current;
    this.writeBackups(backups);
  }

  private restoreToolConfigFromBackup(toolId: string): boolean {
    const backups = this.readBackups();
    const backupConfig = backups.toolConfigs && backups.toolConfigs[toolId];

    if (backupConfig === undefined) {
      return this.replaceToolConfig(toolId, {});
    }

    const restored = this.replaceToolConfig(toolId, backupConfig);
    if (!restored) {
      return false;
    }

    if (backups.toolConfigs) {
      delete backups.toolConfigs[toolId];
    }
    this.writeBackups(backups);
    return true;
  }

  loadPlatformConfig(toolId: string, platformId: PlatformId): boolean {
    const tool = SUPPORTED_TOOLS[toolId];
    if (!tool) {
      logger.error(`Tool not found: ${toolId}`);
      return false;
    }

    const apiKey = configManager.getApiKey(platformId);
    const plan = configManager.getPlan();
    const endpoint = configManager.getEndpoint(platformId);

    if (!apiKey) {
      logger.error(`API key not set for ${platformId}`);
      return false;
    }

    const toolConfig = platformManager.getToolConfig(platformId, plan, apiKey, endpoint || '');
    if (!toolConfig) {
      logger.error(`Failed to get tool config for ${platformId}`);
      return false;
    }
  }

  getToolConfig(toolId: string): any | undefined {
    const tool = SUPPORTED_TOOLS[toolId];
    if (!tool || !tool.configPath) return undefined;

    try {
      if (fs.existsSync(tool.configPath)) {
        const content = fs.readFileSync(tool.configPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      logger.warning(`Failed to read config for ${tool.name}`);
    }
    return undefined;
  }

  updateToolConfig(toolId: string, config: any): boolean {
    const tool = SUPPORTED_TOOLS[toolId];
    if (!tool || !tool.configPath) return false;

    try {
      const configDir = path.dirname(tool.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      const existing: any = {};
      if (fs.existsSync(tool.configPath)) {
        const content = fs.readFileSync(tool.configPath, 'utf-8');
        Object.assign(existing, JSON.parse(content));
      }

      const merged = { ...existing, ...config };
      fs.writeFileSync(tool.configPath, JSON.stringify(merged, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to update config for ${tool.name}: ${error}`);
      return false;
    }
  }

  private replaceToolConfig(toolId: string, config: any): boolean {
    const tool = SUPPORTED_TOOLS[toolId];
    if (!tool || !tool.configPath) return false;

    try {
      const configDir = path.dirname(tool.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(tool.configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to replace config for ${tool.name}: ${error}`);
      return false;
    }
  }

  private setupSecureEnvConfig(
    toolId: string,
    platformId: PlatformId,
    toolConfig: ToolConfig,
    envPrefix: string
  ): boolean {
    try {
      // Store credentials securely using secure-credential-manager
      const envVars = toolConfig.env || {};

      // Store each env var as a secure credential
      for (const [key, value] of Object.entries(envVars)) {
        if (value && typeof value === 'string') {
          secureCredentialManager.setCredential(
            platformId,
            toolId,
            key,
            value,
            'env'
          );
        }
      }

      // Create wrapper script for the tool
      secureCredentialManager.createWrapperScript(platformId, toolId);

      // Create config with environment variable references instead of plaintext values
      const envRefConfig: Record<string, string> = {};
      for (const key of Object.keys(envVars)) {
        const envVarName = this.getSecureEnvVarName(envPrefix, key);
        envRefConfig[key] = `\${${envVarName}}`;
      }

      // Write config with env var references
      const updated = this.updateToolConfig(toolId, { env: envRefConfig });

      if (updated) {
        logger.success(`Secure env-based config set up for ${toolId}`);
      }

      return updated;
    } catch (error) {
      logger.error(`Failed to setup secure env config for ${toolId}: ${error}`);
      return false;
    }
  }

  private getSecureEnvVarName(prefix: string, key: string): string {
    // Convert key like ANTHROPIC_AUTH_TOKEN to ANTHROPIC_AUTH_TOKEN
    // Remove any existing prefix to avoid duplication
    const normalizedKey = key.replace(/^ANTHROPIC_/i, '');
    return `${prefix}_${normalizedKey}`.toUpperCase().replace(/-/g, '_');
  }

  private setupAiderSecureConfig(
    platformId: PlatformId,
    toolConfig: ToolConfig,
    envPrefix: string
  ): boolean {
    try {
      // Store credentials securely using secure-credential-manager
      const toolId = 'aider';

      // Store API key as secure credential
      if (toolConfig.apiKey) {
        secureCredentialManager.setCredential(
          platformId,
          toolId,
          'api-key',
          toolConfig.apiKey,
          'env'
        );
      }

      // Store endpoint as secure credential if provided
      if (toolConfig.baseUrl) {
        secureCredentialManager.setCredential(
          platformId,
          toolId,
          'endpoint',
          toolConfig.baseUrl,
          'env'
        );
      }

      // Create wrapper script for the tool
      secureCredentialManager.createWrapperScript(platformId, toolId);

      // Create config with environment variable references instead of plaintext values
      const apiKeyEnvVar = this.getSecureEnvVarName(envPrefix, 'API_KEY');
      const endpointEnvVar = this.getSecureEnvVarName(envPrefix, 'ENDPOINT');

      const configPath = path.join(os.homedir(), '.aider.conf.json');
      const configDir = path.dirname(configPath);

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      let existing: any = {};
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        existing = JSON.parse(content);
      }

      // Update with environment variable references
      existing['model'] = toolConfig.model;
      existing['api-key'] = `\${${apiKeyEnvVar}}`;
      if (toolConfig.baseUrl) {
        existing['endpoint'] = `\${${endpointEnvVar}}`;
      }

      fs.writeFileSync(configPath, JSON.stringify(existing, null, 2));

      logger.success(`Secure config set up for Aider`);
      return true;
    } catch (error) {
      logger.error(`Failed to setup secure config for Aider: ${error}`);
      return false;
    }
  }

  private setupCopilotSecureConfig(
    platformId: PlatformId,
    toolConfig: ToolConfig,
    envPrefix: string
  ): boolean {
    try {
      // Store credentials securely using secure-credential-manager
      const toolId = 'copilot';

      // Store API key as secure credential
      if (toolConfig.apiKey) {
        secureCredentialManager.setCredential(
          platformId,
          toolId,
          'api-key',
          toolConfig.apiKey,
          'env'
        );
      }

      // Store endpoint as secure credential if provided
      if (toolConfig.baseUrl) {
        secureCredentialManager.setCredential(
          platformId,
          toolId,
          'endpoint',
          toolConfig.baseUrl,
          'env'
        );
      }

      // Create wrapper script for the tool
      secureCredentialManager.createWrapperScript(platformId, toolId);

      // Create config with environment variable references instead of plaintext values
      const apiKeyEnvVar = this.getSecureEnvVarName(envPrefix, 'API_KEY');
      const endpointEnvVar = this.getSecureEnvVarName(envPrefix, 'ENDPOINT');

      const configPath = path.join(os.homedir(), '.github-copilot', 'config.json');
      const configDir = path.dirname(configPath);

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      let existing: any = {};
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        existing = JSON.parse(content);
      }

      // Update with environment variable references
      existing['anthropic_api_key'] = `\${${apiKeyEnvVar}}`;
      existing['anthropic_endpoint'] = toolConfig.baseUrl ? `\${${endpointEnvVar}}` : 'https://api.anthropic.com';
      existing['model'] = toolConfig.model;

      fs.writeFileSync(configPath, JSON.stringify(existing, null, 2));

      // Also update env.json with references
      const envConfigPath = path.join(os.homedir(), '.github-copilot', 'env.json');
      let envExisting: any = {};
      if (fs.existsSync(envConfigPath)) {
        const content = fs.readFileSync(envConfigPath, 'utf-8');
        envExisting = JSON.parse(content);
      }

      envExisting['ANTHROPIC_API_KEY'] = `\${${apiKeyEnvVar}}`;
      if (toolConfig.baseUrl) {
        envExisting['ANTHROPIC_API_BASE_URL'] = `\${${endpointEnvVar}}`;
      }

      fs.writeFileSync(envConfigPath, JSON.stringify(envExisting, null, 2));

      logger.success(`Secure config set up for Copilot`);
      return true;
    } catch (error) {
      logger.error(`Failed to setup secure config for Copilot: ${error}`);
      return false;
    }
  }

  private setupVSCodeExtensionSecureConfig(
    toolId: string,
    platformId: PlatformId,
    toolConfig: ToolConfig,
    envPrefix: string
  ): boolean {
    try {
      // Store API key securely using secure-credential-manager
      if (toolConfig.apiKey) {
        secureCredentialManager.setCredential(
          platformId,
          toolId,
          'api-key',
          toolConfig.apiKey,
          'env'
        );
      }

      // Store base URL as secure credential if provided
      if (toolConfig.baseUrl) {
        secureCredentialManager.setCredential(
          platformId,
          toolId,
          'base-url',
          toolConfig.baseUrl,
          'env'
        );
      }

      // Create wrapper script for the tool
      secureCredentialManager.createWrapperScript(platformId, toolId);

      // Create config with environment variable references instead of plaintext values
      const apiKeyEnvVar = this.getSecureEnvVarName(envPrefix, 'API_KEY');
      const baseUrlEnvVar = this.getSecureEnvVarName(envPrefix, 'BASE_URL');

      const vscodeSettingsPath = this.getVSCodeSettingsPath();
      if (!vscodeSettingsPath) {
        logger.error('Could not find VS Code settings path');
        return false;
      }

      let existing: any = {};
      if (fs.existsSync(vscodeSettingsPath)) {
        const content = fs.readFileSync(vscodeSettingsPath, 'utf-8');
        existing = JSON.parse(content);
      }

      // Get extension-specific config keys and use env var references
      const extensionConfig = this.getExtensionConfigWithEnvRefs(toolId, toolConfig, apiKeyEnvVar, baseUrlEnvVar);

      // Merge with existing settings
      const merged = { ...existing, ...extensionConfig };
      fs.writeFileSync(vscodeSettingsPath, JSON.stringify(merged, null, 2));

      logger.success(`Secure config set up for ${SUPPORTED_TOOLS[toolId]?.displayName || toolId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to setup secure config for VSCode extension ${toolId}: ${error}`);
      return false;
    }
  }

  private getExtensionConfigWithEnvRefs(
    toolId: string,
    toolConfig: ToolConfig,
    apiKeyEnvVar: string,
    baseUrlEnvVar: string
  ): any {
    switch (toolId) {
      case 'codeium':
        return {
          'codeium.enable': true,
          'codeium.anthropicApiKey': `\${env:${apiKeyEnvVar}}`,
          'codeium.model': toolConfig.model
        };
      case 'continue':
        return {
          'continue.enable': true,
          'continue.anthropicApiKey': `\${env:${apiKeyEnvVar}}`,
          'continue.model': toolConfig.model,
          'continue.baseUrl': toolConfig.baseUrl ? `\${env:${baseUrlEnvVar}}` : 'https://api.anthropic.com'
        };
      case 'cline':
        return {
          'cline.enable': true,
          'cline.anthropicApiKey': `\${env:${apiKeyEnvVar}}`,
          'cline.model': toolConfig.model,
          'cline.apiUrl': toolConfig.baseUrl ? `\${env:${baseUrlEnvVar}}` : 'https://api.anthropic.com'
        };
      case 'roo-code':
        return {
          'rooCode.enable': true,
          'rooCode.anthropicApiKey': `\${env:${apiKeyEnvVar}}`,
          'rooCode.model': toolConfig.model
        };
      case 'kilo-code':
        return {
          'kiloCode.enable': true,
          'kiloCode.anthropicApiKey': `\${env:${apiKeyEnvVar}}`,
          'kiloCode.model': toolConfig.model
        };
      default:
        return {};
    }
  }

  private readBackups(): ToolBackups {
    try {
      if (!fs.existsSync(TOOL_BACKUP_FILE)) {
        return {};
      }
      const content = fs.readFileSync(TOOL_BACKUP_FILE, 'utf-8');
      return JSON.parse(content) as ToolBackups;
    } catch {
      return {};
    }
  }

  private writeBackups(backups: ToolBackups): void {
    if (!fs.existsSync(CPA_STATE_DIR)) {
      fs.mkdirSync(CPA_STATE_DIR, { recursive: true });
    }
    fs.writeFileSync(TOOL_BACKUP_FILE, JSON.stringify(backups, null, 2));
  }

  private backupToolConfigIfNeeded(toolId: string): void {
    const backups = this.readBackups();
    backups.toolConfigs = backups.toolConfigs || {};

    if (Object.prototype.hasOwnProperty.call(backups.toolConfigs, toolId)) {
      return;
    }

    const current = this.getToolConfig(toolId) || {};
    backups.toolConfigs[toolId] = current;
    this.writeBackups(backups);
  }

  private restoreToolConfigFromBackup(toolId: string): boolean {
    const backups = this.readBackups();
    const backupConfig = backups.toolConfigs && backups.toolConfigs[toolId];

    if (backupConfig === undefined) {
      return this.replaceToolConfig(toolId, {});
    }

    const restored = this.replaceToolConfig(toolId, backupConfig);
    if (!restored) {
      return false;
    }

    if (backups.toolConfigs) {
      delete backups.toolConfigs[toolId];
    }
    this.writeBackups(backups);
    return true;
  }

  loadPlatformConfig(toolId: string, platformId: PlatformId): boolean {
    const tool = SUPPORTED_TOOLS[toolId];
    if (!tool) {
      logger.error(`Tool not found: ${toolId}`);
      return false;
    }

    const apiKey = configManager.getApiKey(platformId);
    const plan = configManager.getPlan();
    const endpoint = configManager.getEndpoint(platformId);

    if (!apiKey) {
      logger.error(`API key not set for ${platformId}`);
      return false;
    }

    const toolConfig = platformManager.getToolConfig(platformId, plan, apiKey, endpoint || '');
    if (!toolConfig) {
      logger.error(`Failed to get tool config for ${platformId}`);
      logger.debug(`Tool config retrieval failed for tool: ${toolId}, platform: ${platformId}`);
      return false;
    }

    // Check if secure env-based storage is preferred
    const useSecureStorage = configManager.getCredentialStorageType() === 'env';
    const envPrefix = configManager.getCredentialStorageEnvPrefix() || 'ANTHROPIC';

    switch (toolId) {
      case 'claude-code':
      case 'cursor':
      case 'opencode':
        this.backupToolConfigIfNeeded(toolId);
        return this.updateToolConfig(toolId, { env: toolConfig.env });
      case 'factory-droid':
        this.backupToolConfigIfNeeded(toolId);

        if (useSecureStorage) {
          // Use secure credential manager for env-based storage
          return this.setupSecureEnvConfig(toolId, platformId, toolConfig, envPrefix);
        }

        // Fallback to direct config (legacy behavior)
        return this.updateFactoryDroidConfig(toolConfig);
      default:
        logger.warning(`Load config not implemented for ${tool.name}`);
        return false;
    }
  }

  private updateFactoryDroidConfig(toolConfig: ToolConfig): boolean {
    try {
      const configPath = path.join(os.homedir(), '.factory', 'config.json');
      const configDir = path.dirname(configPath);

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      let existing: Record<string, unknown> = { custom_models: [] };
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        existing = JSON.parse(content) as Record<string, unknown>;
      }

      const customModel = {
        model_display_name: toolConfig.model,
        model: toolConfig.model,
        base_url: toolConfig.baseUrl,
        api_key: toolConfig.apiKey,
        provider: 'anthropic',
        max_tokens: 64000
      };

      // Check if model already exists
      const customModels = (existing.custom_models as Array<Record<string, unknown>>) || [];
      const index = customModels.findIndex(
        (m: Record<string, unknown>) => m.model === customModel.model
      );

      if (index >= 0) {
        customModels[index] = customModel;
      } else {
        customModels.push(customModel);
      }

      existing.custom_models = customModels;
      fs.writeFileSync(configPath, JSON.stringify(existing, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to update Factory Droid config: ${error}`);
      return false;
    }
  }

  unloadPlatformConfig(toolId: string, platformId: PlatformId): boolean {
    const tool = SUPPORTED_TOOLS[toolId];
    if (!tool) return false;

    const toolConfig = platformManager.getToolConfig(platformId, 'global', '', '');
    if (!toolConfig) return false;

    switch (toolId) {
      case 'claude-code':
      case 'cursor':
      case 'opencode':
        return this.restoreToolConfigFromBackup(toolId);
      case 'factory-droid':
        return this.removeFactoryDroidModel(toolConfig?.model || '');
      default:
        return false;
    }
  }

  private removeFactoryDroidModel(model: string): boolean {
    try {
      const configPath = path.join(os.homedir(), '.factory', 'config.json');
      if (!fs.existsSync(configPath)) return true;

      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content) as Record<string, unknown>;

      if (config.custom_models && Array.isArray(config.custom_models)) {
        config.custom_models = (config.custom_models as Array<Record<string, unknown>>).filter(
          (m: Record<string, unknown>) => m.model !== model
        );
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to remove Factory Droid model: ${error}`);
      return false;
    }
  }

  getInstalledTools(): string[] {
    return Object.keys(SUPPORTED_TOOLS).filter(id => this.isToolInstalled(id));
  }

  isGitInstalled(): boolean {
    try {
      execSync('git --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

export const toolManager = ToolManager.getInstance();
