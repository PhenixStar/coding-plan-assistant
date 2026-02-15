import { execSync } from 'node:child_process';
import { toolRegistry } from './tool-registry.js';
import { logger } from './logger.js';

class ToolInstaller {
  private static instance: ToolInstaller;

  private constructor() {}

  static getInstance(): ToolInstaller {
    if (!ToolInstaller.instance) {
      ToolInstaller.instance = new ToolInstaller();
    }
    return ToolInstaller.instance;
  }

  isToolInstalled(toolId: string): boolean {
    const tool = toolRegistry.getTool(toolId);
    if (!tool) return false;

    try {
      execSync(tool.command, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  async installTool(toolId: string): Promise<boolean> {
    const tool = toolRegistry.getTool(toolId);
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
    } catch {
      logger.error(`Failed to install ${tool.displayName}`);
      return false;
    }
  }

  getInstalledTools(): string[] {
    return toolRegistry.getToolIds().filter(id => this.isToolInstalled(id));
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

export const toolInstaller = ToolInstaller.getInstance();
export { ToolInstaller };
