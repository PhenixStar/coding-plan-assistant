import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { ToolConfig } from '../types/config.js';
import { logger } from './logger.js';

const CPA_STATE_DIR = path.join(os.homedir(), '.unified-coding-helper');
const TOOL_BACKUP_FILE = path.join(CPA_STATE_DIR, 'tool-backups.json');

interface ToolBackups {
  toolConfigs?: Record<string, Record<string, unknown>>;
}

class ToolConfigManager {
  private static instance: ToolConfigManager;

  private constructor() {}

  static getInstance(): ToolConfigManager {
    if (!ToolConfigManager.instance) {
      ToolConfigManager.instance = new ToolConfigManager();
    }
    return ToolConfigManager.instance;
  }

  private ensureConfigDir(): void {
    if (!fs.existsSync(CPA_STATE_DIR)) {
      fs.mkdirSync(CPA_STATE_DIR, { recursive: true });
    }
  }

  readToolConfig(configPath: string): Record<string, unknown> | null {
    try {
      if (!configPath || !fs.existsSync(configPath)) {
        return null;
      }
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content) as Record<string, unknown>;
    } catch (error) {
      logger.warning(`Failed to read tool config from ${configPath}: ${error}`);
      return null;
    }
  }

  writeToolConfig(configPath: string, config: Record<string, unknown>): boolean {
    try {
      if (!configPath) {
        return false;
      }

      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      const existing: Record<string, unknown> = {};
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        Object.assign(existing, JSON.parse(content));
      }

      const merged = { ...existing, ...config };
      fs.writeFileSync(configPath, JSON.stringify(merged, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to write tool config to ${configPath}: ${error}`);
      return false;
    }
  }

  replaceToolConfig(configPath: string, config: Record<string, unknown>): boolean {
    try {
      if (!configPath) {
        return false;
      }

      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to replace tool config at ${configPath}: ${error}`);
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
    this.ensureConfigDir();
    fs.writeFileSync(TOOL_BACKUP_FILE, JSON.stringify(backups, null, 2));
  }

  backupToolConfig(toolId: string, configPath: string): boolean {
    try {
      const backups = this.readBackups();
      backups.toolConfigs = backups.toolConfigs || {};

      if (Object.prototype.hasOwnProperty.call(backups.toolConfigs, toolId)) {
        return true;
      }

      const current = this.readToolConfig(configPath);
      backups.toolConfigs[toolId] = current || {};
      this.writeBackups(backups);
      return true;
    } catch (error) {
      logger.error(`Failed to backup tool config for ${toolId}: ${error}`);
      return false;
    }
  }

  restoreToolConfig(toolId: string, configPath: string): boolean {
    try {
      const backups = this.readBackups();
      const backupConfig = backups.toolConfigs?.[toolId];

      if (backupConfig === undefined) {
        return this.replaceToolConfig(configPath, {});
      }

      const restored = this.replaceToolConfig(configPath, backupConfig);
      if (!restored) {
        return false;
      }

      if (backups.toolConfigs) {
        delete backups.toolConfigs[toolId];
      }
      this.writeBackups(backups);
      return true;
    } catch (error) {
      logger.error(`Failed to restore tool config for ${toolId}: ${error}`);
      return false;
    }
  }

  hasBackup(toolId: string): boolean {
    const backups = this.readBackups();
    return !!backups.toolConfigs?.[toolId];
  }

  deleteBackup(toolId: string): boolean {
    try {
      const backups = this.readBackups();
      if (backups.toolConfigs && backups.toolConfigs[toolId]) {
        delete backups.toolConfigs[toolId];
        this.writeBackups(backups);
      }
      return true;
    } catch (error) {
      logger.error(`Failed to delete backup for ${toolId}: ${error}`);
      return false;
    }
  }

  getBackupDir(): string {
    return CPA_STATE_DIR;
  }

  getBackupFilePath(): string {
    return TOOL_BACKUP_FILE;
  }
}

export const toolConfigManager = ToolConfigManager.getInstance();
export { ToolConfigManager };
