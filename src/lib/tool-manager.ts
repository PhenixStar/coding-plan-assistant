import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { PlatformId } from '../types/tools.js';
import type { ToolConfig } from '../types/platform.js';
import { toolPlatformConfig } from './tool-platform-config.js';
import { toolRegistry } from './tool-registry.js';
import { toolConfigManager } from './tool-config-manager.js';
import { toolBackupManager } from './tool-backup-manager.js';
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
    return SUPPORTED_TOOLS[toolId];
  }

  getSupportedTools(): ToolInfo[] {
    return Object.values(SUPPORTED_TOOLS).filter(t => t.supported);
  }

  isToolInstalled(toolId: string): boolean {
    const tool = SUPPORTED_TOOLS[toolId];
    if (!tool) return false;

    try {
      execSync(tool.command, { stdio: 'ignore' });
      return true;
    } catch (error) {
      logger.debug(`Tool installation check failed for ${toolId}: ${(error as Error).message}`);
      return false;
    }

    const toolConfig = toolPlatformConfig.getToolConfig(platformId);
    if (!toolConfig) {
      logger.error(`Failed to get tool config for ${platformId}`);
      return false;
    }

    switch (toolId) {
      case 'claude-code':
      case 'cursor':
      case 'opencode':
        if (tool.configPath) {
          toolBackupManager.backupToolConfig(toolId, tool.configPath);
          return toolConfigManager.writeToolConfig(tool.configPath, { env: toolConfig.env });
        }
        return false;
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
        if (tool.configPath) {
          toolBackupManager.backupToolConfig(toolId, tool.configPath);
          return this.updateVSCodeExtensionConfig(toolId, toolConfig);
        }
        return false;
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
      const errorMessage = (error as Error).message;
      logger.error(`Failed to install ${tool.displayName}`);
      logger.debug(`Tool installation failed for ${toolId}: ${errorMessage}, command: ${tool.installCommand}`);
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
      const errorMessage = (error as Error).message;
      logger.warning(`Failed to read config for ${tool.name}`);
      logger.debug(`Tool config read failed for ${toolId}, path: ${tool.configPath}, error: ${errorMessage}`);
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
      const errorMessage = (error as Error).message;
      logger.error(`Failed to update config for ${tool.name}`);
      logger.debug(`Tool config update failed for ${toolId}, path: ${tool.configPath}, error: ${errorMessage}`);
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
      const errorMessage = (error as Error).message;
      logger.error(`Failed to replace config for ${tool.name}`);
      logger.debug(`Tool config replace failed for ${toolId}, path: ${tool.configPath}, error: ${errorMessage}`);
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
      const content = fs.readFileSync(TOOL_BACKUP_FILE, 'utf-8');
      return JSON.parse(content) as ToolBackups;
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.debug(`Failed to read tool backups, path: ${TOOL_BACKUP_FILE}, error: ${errorMessage}`);
      return {};
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

  loadPlatformConfig(toolId: string, platformId: PlatformId): boolean {
    const tool = SUPPORTED_TOOLS[toolId];
    if (!tool) {
      logger.error(`Tool not found: ${toolId}`);
      logger.debug(`Attempted to load config for unknown tool: ${toolId}, platform: ${platformId}`);
      return false;
    }
  }

    const apiKey = configManager.getApiKey(platformId);
    const plan = configManager.getPlan();
    const endpoint = configManager.getEndpoint(platformId);

    if (!apiKey) {
      logger.error(`API key not set for ${platformId}`);
      logger.debug(`Cannot load tool config: API key missing for platform ${platformId}, tool: ${toolId}`);
      return false;
    }

    const toolConfig = platformManager.getToolConfig(platformId, plan, apiKey, endpoint || '');
    if (!toolConfig) {
      logger.error(`Failed to get tool config for ${platformId}`);
      logger.debug(`Tool config retrieval failed for tool: ${toolId}, platform: ${platformId}, plan: ${plan}`);
      return false;
    }

    switch (toolId) {
      case 'claude-code':
      case 'cursor':
      case 'opencode':
        if (tool.configPath) {
          return toolBackupManager.restoreToolConfig(toolId, tool.configPath);
        }
        return false;
      case 'factory-droid':
        return this.removeFactoryDroidModel(defaultModel || '');
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
      const errorMessage = (error as Error).message;
      const configPath = path.join(os.homedir(), '.factory', 'config.json');
      logger.error(`Failed to update Factory Droid config`);
      logger.debug(`Factory Droid config update failed, path: ${configPath}, model: ${toolConfig.model}, error: ${errorMessage}`);
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
        logger.warning(`Unload config not implemented for ${tool.name}`);
        logger.debug(`Unload config not supported for tool: ${toolId}, platform: ${platformId}`);
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
      const errorMessage = (error as Error).message;
      logger.error(`Failed to remove Factory Droid model`);
      logger.debug(`Factory Droid model removal failed, model: ${model}, error: ${errorMessage}`);
      return false;
    }
  }
}

export const toolManager = ToolManager.getInstance();
