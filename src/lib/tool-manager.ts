import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import type { ToolInfo, PlatformId } from '../types/tools.js';
import type { ToolConfig, PlanType } from '../types/platform.js';
import { configManager } from './config.js';
import { platformManager } from './platform-manager.js';
import { logger } from './logger.js';

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

interface ToolBackups {
  claudeCode?: {
    env?: Record<string, string>;
  };
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
    } catch {
      return false;
    }
  }

  async installTool(toolId: string): Promise<boolean> {
    const tool = SUPPORTED_TOOLS[toolId];
    if (!tool) {
      logger.error(`Tool not found: ${toolId}`);
      return false;
    }

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

  private backupClaudeCodeEnvIfNeeded(): void {
    const backups = this.readBackups();
    if (backups.claudeCode?.env !== undefined) {
      return;
    }

    const current = this.getToolConfig('claude-code') || {};
    const currentEnv = current?.env;

    backups.claudeCode = {
      env: currentEnv && typeof currentEnv === 'object' ? { ...currentEnv } : {}
    };
    this.writeBackups(backups);
  }

  private restoreClaudeCodeEnvFromBackup(): boolean {
    const backups = this.readBackups();
    const backupEnv = backups.claudeCode?.env;

    if (backupEnv === undefined) {
      return this.updateToolConfig('claude-code', { env: {} });
    }

    const restored = this.updateToolConfig('claude-code', { env: backupEnv });
    if (!restored) {
      return false;
    }

    delete backups.claudeCode;
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

    switch (toolId) {
      case 'claude-code':
        this.backupClaudeCodeEnvIfNeeded();
        return this.updateToolConfig(toolId, { env: toolConfig.env });
      case 'factory-droid':
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

  unloadPlatformConfig(toolId: string, platformId: PlatformId): boolean {
    const tool = SUPPORTED_TOOLS[toolId];
    if (!tool) return false;

    const toolConfig = platformManager.getToolConfig(platformId, 'global', '', '');
    if (!toolConfig) return false;

    switch (toolId) {
      case 'claude-code':
        return this.restoreClaudeCodeEnvFromBackup();
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
