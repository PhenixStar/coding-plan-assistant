import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { McpServiceInfo, PlatformId } from '../types/tools.js';
import { logger } from './logger.js';

interface McpService {
  id: string;
  name: string;
  description: string;
  category: string;
  platform?: PlatformId;
  path: string;
}

// Built-in MCP services for GLM
const GLM_MCP_SERVICES: McpService[] = [
  {
    id: 'glm-usage-query',
    name: 'GLM Usage Query',
    description: 'Query GLM coding plan usage statistics',
    category: 'glm',
    platform: 'glm',
    path: path.join(os.homedir(), '.claude', 'skills', 'glm-plan-usage')
  },
  {
    id: 'glm-case-feedback',
    name: 'GLM Case Feedback',
    description: 'Submit feedback for GLM coding plan issues',
    category: 'glm',
    platform: 'glm',
    path: path.join(os.homedir(), '.claude', 'skills', 'glm-plan-bug')
  }
];

// MCP services for MiniMax (can be added later)
const MINIMAX_MCP_SERVICES: McpService[] = [];

// Common MCP services (platform-agnostic)
const COMMON_MCP_SERVICES: McpService[] = [
  {
    id: 'vision-mcp',
    name: 'Vision MCP Server',
    description: 'Image and vision analysis capabilities',
    category: 'common',
    path: path.join(os.homedir(), '.claude', 'servers', 'vision-mcp')
  },
  {
    id: 'web-search-mcp',
    name: 'Web Search MCP Server',
    description: 'Web search capabilities',
    category: 'common',
    path: path.join(os.homedir(), '.claude', 'servers', 'web-search-mcp')
  },
  {
    id: 'web-reader-mcp',
    name: 'Web Reader MCP Server',
    description: 'Web content reader and scraper',
    category: 'common',
    path: path.join(os.homedir(), '.claude', 'servers', 'web-reader-mcp')
  }
];

class McpManager {
  private static instance: McpManager;
  private servicesDir: string;

  private constructor() {
    this.servicesDir = path.join(os.homedir(), '.claude', 'servers');
  }

  static getInstance(): McpManager {
    if (!McpManager.instance) {
      McpManager.instance = new McpManager();
    }
    return McpManager.instance;
  }

  getAllServices(platformFilter?: PlatformId): McpServiceInfo[] {
    const allServices = [
      ...GLM_MCP_SERVICES,
      ...MINIMAX_MCP_SERVICES,
      ...COMMON_MCP_SERVICES
    ];

    return allServices
      .filter(s => !platformFilter || s.platform === undefined || s.platform === platformFilter)
      .map(s => this.mapServiceInfo(s));
  }

  private mapServiceInfo(service: McpService): McpServiceInfo {
    const installed = this.isServiceInstalled(service.id);
    const pluginPath = path.join(os.homedir(), '.claude', 'skills', service.id);
    const enabled = installed && fs.existsSync(pluginPath);

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      platform: service.platform,
      installed,
      enabled
    };
  }

  isServiceInstalled(serviceId: string): boolean {
    const allServices = [...GLM_MCP_SERVICES, ...MINIMAX_MCP_SERVICES, ...COMMON_MCP_SERVICES];
    const service = allServices.find(s => s.id === serviceId);

    if (!service) return false;
    return fs.existsSync(service.path);
  }

  async installService(serviceId: string): Promise<boolean> {
    const allServices = [...GLM_MCP_SERVICES, ...MINIMAX_MCP_SERVICES, ...COMMON_MCP_SERVICES];
    const service = allServices.find(s => s.id === serviceId);

    if (!service) {
      logger.error(`MCP service not found: ${serviceId}`);
      return false;
    }

    try {
      logger.info(`Installing ${service.name}...`);

      // Create directory if needed
      if (!fs.existsSync(service.path)) {
        fs.mkdirSync(service.path, { recursive: true });
      }

      // For skills, create a basic plugin.json
      if (service.category === 'glm' || service.category === 'common') {
        const pluginPath = path.join(os.homedir(), '.claude', 'skills', service.id);
        if (!fs.existsSync(pluginPath)) {
          fs.mkdirSync(pluginPath, { recursive: true });
        }

        const pluginJson = path.join(pluginPath, '.claude-plugin', 'plugin.json');
        if (!fs.existsSync(pluginJson)) {
          fs.mkdirSync(path.dirname(pluginJson), { recursive: true });
          fs.writeFileSync(
            pluginJson,
            JSON.stringify({
              name: service.name,
              description: service.description,
              version: '1.0.0',
              author: 'Unified Coding Helper',
              commands: []
            }, null, 2)
          );
        }
      }

      logger.success(`${service.name} installed successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to install ${service.name}: ${error}`);
      return false;
    }
  }

  async uninstallService(serviceId: string): Promise<boolean> {
    const allServices = [...GLM_MCP_SERVICES, ...MINIMAX_MCP_SERVICES, ...COMMON_MCP_SERVICES];
    const service = allServices.find(s => s.id === serviceId);

    if (!service) {
      logger.error(`MCP service not found: ${serviceId}`);
      return false;
    }

    try {
      logger.info(`Uninstalling ${service.name}...`);

      // Remove service directory
      if (fs.existsSync(service.path)) {
        fs.rmSync(service.path, { recursive: true, force: true });
      }

      // Remove plugin directory if exists
      const pluginPath = path.join(os.homedir(), '.claude', 'skills', service.id);
      if (fs.existsSync(pluginPath)) {
        fs.rmSync(pluginPath, { recursive: true, force: true });
      }

      logger.success(`${service.name} uninstalled successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to uninstall ${service.name}: ${error}`);
      return false;
    }
  }

  async installAllBuiltInServices(platform: PlatformId): Promise<boolean> {
    const glmServices = [...GLM_MCP_SERVICES, ...COMMON_MCP_SERVICES];
    const minimaxServices = [...MINIMAX_MCP_SERVICES, ...COMMON_MCP_SERVICES];
    const services = platform === 'glm' ? glmServices : minimaxServices;

    let allSuccess = true;
    for (const service of services) {
      const success = await this.installService(service.id);
      if (!success) {
        allSuccess = false;
      }
    }

    return allSuccess;
  }
}

export const mcpManager = McpManager.getInstance();
