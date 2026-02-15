import { execSync, execFileSync } from 'node:child_process';
import { toolRegistry } from './tool-registry.js';
import { logger } from './logger.js';

// Shell metacharacters that require shell interpretation
const SHELL_METACHARACTERS = /[;&|`$(){}[\]<>\\!#*?"'\n\r]/;

// Allowed command patterns for shell commands (whitelist approach)
const ALLOWED_SHELL_COMMANDS = [
  /^code --list-extensions \| grep -i /,
  /^echo /,
  /^curl -[a-zA-Z]+ /,
  /^pip install /,
  /^npm install /,
  /^gh (extension )?install /,
];

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
 * Validate shell commands against allowed patterns
 */
function isShellCommandAllowed(command: string): boolean {
  return ALLOWED_SHELL_COMMANDS.some(pattern => pattern.test(command));
}

/**
 * Execute a command safely - uses execFileSync for simple commands,
 * validated execSync for shell commands
 */
function safeExecSync(command: string, options: { stdio?: 'ignore' | 'inherit' } = {}): void {
  const parsed = parseSimpleCommand(command);

  if (parsed) {
    // Safe: execFileSync doesn't use shell, args are passed directly
    execFileSync(parsed.program, parsed.args, { stdio: options.stdio });
  } else {
    // Shell command - validate before execution
    if (!isShellCommandAllowed(command)) {
      throw new Error(`Command not allowed: ${command}`);
    }
    // Execute validated shell command with explicit shell
    execSync(command, { stdio: options.stdio, shell: '/bin/sh' });
  }
}

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
      safeExecSync(tool.command, { stdio: 'ignore' });
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
      safeExecSync(tool.installCommand, { stdio: 'inherit' });
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
      safeExecSync('git --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

export const toolInstaller = ToolInstaller.getInstance();
export { ToolInstaller };
