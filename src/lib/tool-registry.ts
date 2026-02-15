import path from 'node:path';
import os from 'node:os';
import type { ToolInfo } from '../types/tools.js';

// Tool metadata definitions
const TOOL_DEFINITIONS: Record<string, ToolInfo> = {
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
    configPath: '',
    displayName: 'Cline (VS Code)',
    supported: true
  },
  'roo-code': {
    id: 'roo-code',
    name: 'Roo Code',
    command: 'code --list-extensions | grep -i "roo code"',
    installCommand: 'code --install-extension roovetterinc.roo-code',
    configPath: '',
    displayName: 'Roo Code (VS Code)',
    supported: true
  },
  'kilo-code': {
    id: 'kilo-code',
    name: 'Kilo Code',
    command: 'code --list-extensions | grep -i "kilo code"',
    installCommand: 'code --install-extension kilinc.kilo-code',
    configPath: '',
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
  },
  'windsurf': {
    id: 'windsurf',
    name: 'Windsurf',
    command: 'windsurf --version',
    installCommand: 'echo "Install from https://windsurf.com"',
    configPath: path.join(os.homedir(), '.windsurf', 'config.json'),
    displayName: 'Windsurf',
    supported: true
  },
  'zed-ai': {
    id: 'zed-ai',
    name: 'Zed AI',
    command: 'zed --version',
    installCommand: 'curl -fsSL https://zed.dev/install | sh',
    configPath: path.join(os.homedir(), '.config', 'zed', 'settings.json'),
    displayName: 'Zed AI',
    supported: true
  },
  'copilot': {
    id: 'copilot',
    name: 'GitHub Copilot',
    command: 'gh copilot --version',
    installCommand: 'gh extension install github/copilot-cli',
    configPath: path.join(os.homedir(), '.github-copilot'),
    displayName: 'GitHub Copilot',
    supported: true
  },
  'aider': {
    id: 'aider',
    name: 'Aider',
    command: 'aider --version',
    installCommand: 'pip install aider',
    configPath: path.join(os.homedir(), '.aider.conf.json'),
    displayName: 'Aider',
    supported: true
  },
  'codeium': {
    id: 'codeium',
    name: 'Codeium',
    command: 'code --list-extensions | grep -i codeium',
    installCommand: 'code --install-extension codeium.codeium',
    configPath: '',
    displayName: 'Codeium (VS Code)',
    supported: true
  },
  'continue': {
    id: 'continue',
    name: 'Continue',
    command: 'code --list-extensions | grep -i continue',
    installCommand: 'code --install-extension continue.continue',
    configPath: '',
    displayName: 'Continue (VS Code)',
    supported: true
  },
  'bolt-new': {
    id: 'bolt-new',
    name: 'Bolt.new',
    command: 'echo "Bolt.new is browser-based"',
    installCommand: 'echo "Open https://bolt.new in your browser"',
    configPath: '',
    displayName: 'Bolt.new',
    supported: true
  },
  'lovable': {
    id: 'lovable',
    name: 'Lovable',
    command: 'echo "Lovable is browser-based"',
    installCommand: 'echo "Open https://lovable.dev in your browser"',
    configPath: '',
    displayName: 'Lovable',
    supported: true
  }
};

class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolInfo> = new Map();

  private constructor() {
    // Initialize with predefined tool definitions
    for (const [id, tool] of Object.entries(TOOL_DEFINITIONS)) {
      this.tools.set(id, tool);
    }
  }

  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  getTool(id: string): ToolInfo | undefined {
    return this.tools.get(id);
  }

  getAllTools(): ToolInfo[] {
    return Array.from(this.tools.values());
  }

  getSupportedTools(): ToolInfo[] {
    return Array.from(this.tools.values()).filter(tool => tool.supported);
  }

  getToolIds(): string[] {
    return Array.from(this.tools.keys());
  }

  isToolSupported(id: string): boolean {
    const tool = this.tools.get(id);
    return tool?.supported ?? false;
  }

  hasTool(id: string): boolean {
    return this.tools.has(id);
  }
}

export const toolRegistry = ToolRegistry.getInstance();
export { ToolRegistry };
