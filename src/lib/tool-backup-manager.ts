import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { logger } from './logger.js';

const CPA_STATE_DIR = path.join(os.homedir(), '.unified-coding-helper');
const TOOL_BACKUP_FILE = path.join(CPA_STATE_DIR, 'tool-backups.json');

interface ToolBackups {
  toolConfigs?: Record<string, Record<string, unknown>>;
  timestamp?: string;
}

class ToolBackupManager {
  private static instance: ToolBackupManager;

  private constructor() {}

  static getInstance(): ToolBackupManager {
    if (!ToolBackupManager.instance) {
      ToolBackupManager.instance = new ToolBackupManager();
    }
    return ToolBackupManager.instance;
  }

  private ensureBackupDir(): void {
    if (!fs.existsSync(CPA_STATE_DIR)) {
      fs.mkdirSync(CPA_STATE_DIR, { recursive: true });
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
    this.ensureBackupDir();
    backups.timestamp = new Date().toISOString();
    fs.writeFileSync(TOOL_BACKUP_FILE, JSON.stringify(backups, null, 2));
  }

  backupToolConfig(toolId: string, configPath: string): boolean {
    try {
      if (!toolId || !configPath) {
        logger.warning(`Invalid parameters for backup: toolId=${toolId}, configPath=${configPath}`);
        return false;
      }

      const backups = this.readBackups();
      backups.toolConfigs = backups.toolConfigs || {};

      // Skip if already backed up
      if (Object.prototype.hasOwnProperty.call(backups.toolConfigs, toolId)) {
        return true;
      }

      // Read current config
      let currentConfig: Record<string, unknown> = {};
      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, 'utf-8');
          currentConfig = JSON.parse(content);
        } catch {
          logger.warning(`Failed to parse existing config for ${toolId}, backing up empty object`);
        }
      }

      backups.toolConfigs[toolId] = currentConfig;
      this.writeBackups(backups);
      logger.info(`Backed up config for ${toolId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to backup tool config for ${toolId}: ${error}`);
      return false;
    }
  }

  restoreToolConfig(toolId: string, configPath: string): boolean {
    try {
      if (!toolId || !configPath) {
        logger.warning(`Invalid parameters for restore: toolId=${toolId}, configPath=${configPath}`);
        return false;
      }

      const backups = this.readBackups();
      const backupConfig = backups.toolConfigs?.[toolId];

      // If no backup exists, write empty config
      if (backupConfig === undefined) {
        logger.info(`No backup found for ${toolId}, writing empty config`);
        return this.replaceConfig(configPath, {});
      }

      // Restore from backup
      const restored = this.replaceConfig(configPath, backupConfig);
      if (!restored) {
        return false;
      }

      // Remove backup after successful restore
      if (backups.toolConfigs) {
        delete backups.toolConfigs[toolId];
        this.writeBackups(backups);
      }

      logger.info(`Restored config for ${toolId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to restore tool config for ${toolId}: ${error}`);
      return false;
    }
  }

  private replaceConfig(configPath: string, config: Record<string, unknown>): boolean {
    try {
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to replace config at ${configPath}: ${error}`);
      return false;
    }
  }

  hasBackup(toolId: string): boolean {
    const backups = this.readBackups();
    return !!backups.toolConfigs?.[toolId];
  }

  getBackup(toolId: string): Record<string, unknown> | null {
    const backups = this.readBackups();
    return backups.toolConfigs?.[toolId] ?? null;
  }

  listBackups(): string[] {
    const backups = this.readBackups();
    return backups.toolConfigs ? Object.keys(backups.toolConfigs) : [];
  }

  deleteBackup(toolId: string): boolean {
    try {
      const backups = this.readBackups();
      if (backups.toolConfigs && backups.toolConfigs[toolId]) {
        delete backups.toolConfigs[toolId];
        this.writeBackups(backups);
        logger.info(`Deleted backup for ${toolId}`);
      }
      return true;
    } catch (error) {
      logger.error(`Failed to delete backup for ${toolId}: ${error}`);
      return false;
    }
  }

  clearAllBackups(): boolean {
    try {
      this.writeBackups({});
      logger.info('Cleared all tool config backups');
      return true;
    } catch (error) {
      logger.error(`Failed to clear all backups: ${error}`);
      return false;
    }
  }

  getBackupDir(): string {
    return CPA_STATE_DIR;
  }

  getBackupFilePath(): string {
    return TOOL_BACKUP_FILE;
  }

  backupExists(): boolean {
    return fs.existsSync(TOOL_BACKUP_FILE);
  }
}

export const toolBackupManager = ToolBackupManager.getInstance();
export { ToolBackupManager };
