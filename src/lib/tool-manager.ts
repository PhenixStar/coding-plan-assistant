import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { ToolInfo, PlatformId } from '../types/tools.js';
import type { ToolConfig, PlanType } from '../types/platform.js';
import { configManager } from './config.js';
import { platformManager } from './platform-manager.js';
import { toolRegistry } from './tool-registry.js';
import { toolInstaller } from './tool-installer.js';
import { toolConfigManager } from './tool-config-manager.js';
import { logger } from './logger.js';

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
    return toolInstaller.isToolInstalled(toolId);
  }

  async installTool(toolId: string): Promise<boolean> {
    return toolInstaller.installTool(toolId);
  }

  getToolConfig(toolId: string): Record<string, unknown> | undefined {
    const tool = toolRegistry.getTool(toolId);
    if (!tool || !tool.configPath) return undefined;

    return toolConfigManager.readToolConfig(tool.configPath) ?? undefined;
  }

  updateToolConfig(toolId: string, config: Record<string, unknown>): boolean {
    const tool = toolRegistry.getTool(toolId);
    if (!tool || !tool.configPath) return false;

    return toolConfigManager.writeToolConfig(tool.configPath, config);
  }

  private replaceToolConfig(toolId: string, config: Record<string, unknown>): boolean {
    const tool = toolRegistry.getTool(toolId);
    if (!tool || !tool.configPath) return false;

    return toolConfigManager.replaceToolConfig(tool.configPath, config);
  }

  private backupToolConfigIfNeeded(toolId: string): void {
    const tool = toolRegistry.getTool(toolId);
    if (!tool || !tool.configPath) return;

    toolConfigManager.backupToolConfig(toolId, tool.configPath);
  }

  private restoreToolConfigFromBackup(toolId: string): boolean {
    const tool = toolRegistry.getTool(toolId);
    if (!tool || !tool.configPath) return false;

    return toolConfigManager.restoreToolConfig(toolId, tool.configPath);
  }

  loadPlatformConfig(toolId: string, platformId: PlatformId): boolean {
    const tool = toolRegistry.getTool(toolId);
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

    switch (toolId) {
      case 'claude-code':
      case 'cursor':
      case 'opencode':
        this.backupToolConfigIfNeeded(toolId);
        return this.updateToolConfig(toolId, { env: toolConfig.env });
      case 'factory-droid':
        return this.updateFactoryDroidConfig(toolConfig);
      case 'aider':
        return this.updateAiderConfig(toolConfig);
      case 'copilot':
        return this.updateCopilotConfig(toolConfig);
      case 'codeium':
      case 'continue':
      case 'cline':
      case 'roo-code':
      case 'kilo-code':
        this.backupToolConfigIfNeeded(toolId);
        return this.updateVSCodeExtensionConfig(toolId, toolConfig);
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

      let existing: any = { custom_models: [] };
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        existing = JSON.parse(content);
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
      const index = existing.custom_models.findIndex(
        (m: any) => m.model === customModel.model
      );

      if (index >= 0) {
        existing.custom_models[index] = customModel;
      } else {
        existing.custom_models.push(customModel);
      }

      fs.writeFileSync(configPath, JSON.stringify(existing, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to update Factory Droid config: ${error}`);
      return false;
    }
  }

  private updateAiderConfig(toolConfig: ToolConfig): boolean {
    try {
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

      // Update with platform config
      existing['model'] = toolConfig.model;
      existing['api-key'] = toolConfig.apiKey;
      if (toolConfig.baseUrl) {
        existing['endpoint'] = toolConfig.baseUrl;
      }

      fs.writeFileSync(configPath, JSON.stringify(existing, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to update Aider config: ${error}`);
      return false;
    }
  }

  private updateCopilotConfig(toolConfig: ToolConfig): boolean {
    try {
      // Copilot CLI uses environment variables for custom endpoint configuration
      // Create a wrapper script or config file
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

      // Store the configuration for Copilot CLI
      existing['anthropic_api_key'] = toolConfig.apiKey;
      existing['anthropic_endpoint'] = toolConfig.baseUrl || 'https://api.anthropic.com';
      existing['model'] = toolConfig.model;

      fs.writeFileSync(configPath, JSON.stringify(existing, null, 2));

      // Also backup current env config if exists
      const envConfigPath = path.join(os.homedir(), '.github-copilot', 'env.json');
      let envExisting: any = {};
      if (fs.existsSync(envConfigPath)) {
        const content = fs.readFileSync(envConfigPath, 'utf-8');
        envExisting = JSON.parse(content);
      }

      // Store environment variables for CLI usage
      envExisting['ANTHROPIC_API_KEY'] = toolConfig.apiKey;
      if (toolConfig.baseUrl) {
        envExisting['ANTHROPIC_API_BASE_URL'] = toolConfig.baseUrl;
      }

      fs.writeFileSync(envConfigPath, JSON.stringify(envExisting, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to update Copilot config: ${error}`);
      return false;
    }
  }

  private updateVSCodeExtensionConfig(toolId: string, toolConfig: ToolConfig): boolean {
    try {
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

      // Extension-specific config keys
      const extensionConfig = this.getExtensionConfig(toolId, toolConfig);

      // Merge with existing settings
      const merged = { ...existing, ...extensionConfig };
      fs.writeFileSync(vscodeSettingsPath, JSON.stringify(merged, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to update VS Code extension config for ${toolId}: ${error}`);
      return false;
    }
  }

  private getVSCodeSettingsPath(): string | null {
    // Try multiple possible VS Code settings locations
    const possiblePaths = [
      path.join(os.homedir(), '.config', 'Code', 'User', 'settings.json'),
      path.join(os.homedir(), '.config', 'Cursor', 'User', 'settings.json'),
      path.join(os.homedir(), '.vscode', 'settings.json'),
      path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'settings.json'),
      path.join(os.homedir(), 'AppData', 'Roaming', 'Cursor', 'User', 'settings.json')
    ];

    for (const settingsPath of possiblePaths) {
      if (fs.existsSync(settingsPath)) {
        return settingsPath;
      }
    }

    // Return the most common one as default
    return possiblePaths[0];
  }

  private getExtensionConfig(toolId: string, toolConfig: ToolConfig): any {
    switch (toolId) {
      case 'codeium':
        return {
          'codeium.enable': true,
          'codeium.anthropicApiKey': toolConfig.apiKey,
          'codeium.model': toolConfig.model
        };
      case 'continue':
        return {
          'continue.enable': true,
          'continue.anthropicApiKey': toolConfig.apiKey,
          'continue.model': toolConfig.model,
          'continue.baseUrl': toolConfig.baseUrl || 'https://api.anthropic.com'
        };
      case 'cline':
        return {
          'cline.enable': true,
          'cline.anthropicApiKey': toolConfig.apiKey,
          'cline.model': toolConfig.model,
          'cline.apiUrl': toolConfig.baseUrl || 'https://api.anthropic.com'
        };
      case 'roo-code':
        return {
          'rooCode.enable': true,
          'rooCode.anthropicApiKey': toolConfig.apiKey,
          'rooCode.model': toolConfig.model
        };
      case 'kilo-code':
        return {
          'kiloCode.enable': true,
          'kiloCode.anthropicApiKey': toolConfig.apiKey,
          'kiloCode.model': toolConfig.model
        };
      default:
        return {};
    }
  }

  private removeVSCodeExtensionConfig(toolId: string): boolean {
    try {
      const vscodeSettingsPath = this.getVSCodeSettingsPath();
      if (!vscodeSettingsPath || !fs.existsSync(vscodeSettingsPath)) {
        return true;
      }

      const content = fs.readFileSync(vscodeSettingsPath, 'utf-8');
      const settings: any = JSON.parse(content);

      const keysToRemove = this.getExtensionConfigKeys(toolId);

      for (const key of keysToRemove) {
        delete settings[key];
      }

      fs.writeFileSync(vscodeSettingsPath, JSON.stringify(settings, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to remove VS Code extension config for ${toolId}: ${error}`);
      return false;
    }
  }

  private getExtensionConfigKeys(toolId: string): string[] {
    switch (toolId) {
      case 'codeium':
        return ['codeium.enable', 'codeium.anthropicApiKey', 'codeium.model'];
      case 'continue':
        return ['continue.enable', 'continue.anthropicApiKey', 'continue.model', 'continue.baseUrl'];
      case 'cline':
        return ['cline.enable', 'cline.anthropicApiKey', 'cline.model', 'cline.apiUrl'];
      case 'roo-code':
        return ['rooCode.enable', 'rooCode.anthropicApiKey', 'rooCode.model'];
      case 'kilo-code':
        return ['kiloCode.enable', 'kiloCode.anthropicApiKey', 'kiloCode.model'];
      default:
        return [];
    }
  }

  unloadPlatformConfig(toolId: string, platformId: PlatformId): boolean {
    const tool = toolRegistry.getTool(toolId);
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
      case 'aider':
        return this.removeAiderConfig();
      case 'copilot':
        return this.removeCopilotConfig();
      case 'codeium':
      case 'continue':
      case 'cline':
      case 'roo-code':
      case 'kilo-code':
        return this.removeVSCodeExtensionConfig(toolId);
      default:
        return false;
    }
  }

  private removeAiderConfig(): boolean {
    try {
      const configPath = path.join(os.homedir(), '.aider.conf.json');
      if (!fs.existsSync(configPath)) return true;

      const content = fs.readFileSync(configPath, 'utf-8');
      const config: any = JSON.parse(content);

      // Remove platform-specific keys
      delete config['model'];
      delete config['api-key'];
      delete config['endpoint'];

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to remove Aider config: ${error}`);
      return false;
    }
  }

  private removeCopilotConfig(): boolean {
    try {
      const configPath = path.join(os.homedir(), '.github-copilot', 'config.json');
      const envConfigPath = path.join(os.homedir(), '.github-copilot', 'env.json');

      // Remove config.json entries
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config: any = JSON.parse(content);

        delete config['anthropic_api_key'];
        delete config['anthropic_endpoint'];
        delete config['model'];

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      }

      // Remove env.json entries
      if (fs.existsSync(envConfigPath)) {
        const content = fs.readFileSync(envConfigPath, 'utf-8');
        const envConfig: any = JSON.parse(content);

        delete envConfig['ANTHROPIC_API_KEY'];
        delete envConfig['ANTHROPIC_API_BASE_URL'];

        fs.writeFileSync(envConfigPath, JSON.stringify(envConfig, null, 2));
      }

      return true;
    } catch (error) {
      logger.error(`Failed to remove Copilot config: ${error}`);
      return false;
    }
  }

  private removeFactoryDroidModel(model: string): boolean {
    try {
      const configPath = path.join(os.homedir(), '.factory', 'config.json');
      if (!fs.existsSync(configPath)) return true;

      const content = fs.readFileSync(configPath, 'utf-8');
      const config: any = JSON.parse(content);

      if (config.custom_models && Array.isArray(config.custom_models)) {
        config.custom_models = config.custom_models.filter((m: any) => m.model !== model);
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to remove Factory Droid model: ${error}`);
      return false;
    }
  }

  getInstalledTools(): string[] {
    return toolInstaller.getInstalledTools();
  }

  isGitInstalled(): boolean {
    return toolInstaller.isGitInstalled();
  }
}

export const toolManager = ToolManager.getInstance();
