import type { PlatformId } from './config.js';

export type { PlatformId };

export interface ToolInfo {
  id: string;
  name: string;
  command: string;
  installCommand: string;
  configPath: string;
  displayName: string;
  hidden?: boolean;
  supported: boolean;
}

export interface McpServiceInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  platform?: PlatformId;
  installed: boolean;
  enabled: boolean;
}
