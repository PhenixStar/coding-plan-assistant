import fs, { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import yaml from 'js-yaml';
import type { UnifiedConfig, PlatformId, PlanType, Language, PlatformConfig, CredentialStorageConfig, CredentialStorageType } from '../types/config.js';
import { logger } from './logger.js';
import { encrypt, decrypt } from './crypto.js';

const CONFIG_DIR = path.join(os.homedir(), '.unified-coding-helper');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.yaml');

// Supported config file extensions
const SUPPORTED_EXTENSIONS = ['.yaml', '.yml', '.json'];

const DEFAULT_CONFIG: UnifiedConfig = {
  lang: 'en_US',
  platform: 'glm',
  plan: 'global',
  glm: {},
  minimax: {},
  active_platform: 'glm'
};

class ConfigManager {
  private static instance: ConfigManager;
  private config: UnifiedConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private ensureConfigDir(): void {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
    }
  }

  loadConfig(): UnifiedConfig {
    this.ensureConfigDir();
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
        // Use FAILSAFE_SCHEMA to prevent unsafe YAML deserialization (CVE-2023-2251)
        const loaded = yaml.load(content, { schema: (yaml as any).FAILSAFE_SCHEMA }) as UnifiedConfig;
        this.config = { ...DEFAULT_CONFIG, ...loaded };
      } else {
        this.config = { ...DEFAULT_CONFIG };
      }
    } catch (error) {
      logger.warning(`Failed to load config: ${error}`);
      this.config = { ...DEFAULT_CONFIG };
    }
    return this.config;
  }

  saveConfig(config?: Partial<UnifiedConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.ensureConfigDir();
    try {
      const content = yaml.dump(this.config);
      fs.writeFileSync(CONFIG_FILE, content, { encoding: 'utf-8', mode: 0o600 });
    } catch (error) {
      logger.error(`Failed to save config: ${error}`);
    }
  }

  getConfig(): UnifiedConfig {
    return this.config;
  }

  updateConfig(updates: Partial<UnifiedConfig>): void {
    this.saveConfig(updates);
  }

  isFirstRun(): boolean {
    return !fs.existsSync(CONFIG_FILE);
  }

  loadConfigFromFile(configPath: string): UnifiedConfig {
    const resolvedPath = path.resolve(configPath);

    if (!existsSync(resolvedPath)) {
      throw new Error(`Config file not found: ${resolvedPath}`);
    }

    const ext = path.extname(resolvedPath).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      throw new Error(`Unsupported config file format: ${ext}. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`);
    }

    try {
      const content = fs.readFileSync(resolvedPath, 'utf-8');
      let loaded: UnifiedConfig;

      if (ext === '.json') {
        loaded = JSON.parse(content) as UnifiedConfig;
      } else {
        loaded = yaml.load(content) as UnifiedConfig;
      }

      // Merge with default config
      this.config = { ...DEFAULT_CONFIG, ...loaded };
      this.saveConfig();
      logger.info(`Loaded config from: ${resolvedPath}`);
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load config from ${resolvedPath}: ${error}`);
    }
  }

  // Language getters/setters
  getLang(): Language {
    return this.config.lang;
  }

  setLang(lang: Language): void {
    this.config.lang = lang;
    this.saveConfig();
  }

  // Platform getters/setters
  getPlatform(): PlatformId {
    return this.config.platform;
  }

  setPlatform(platform: PlatformId): void {
    this.config.platform = platform;
    this.config.active_platform = platform;
    this.saveConfig();
  }

  getActivePlatform(): PlatformId {
    return this.config.active_platform;
  }

  setActivePlatform(platform: PlatformId): void {
    this.config.active_platform = platform;
    this.saveConfig();
  }

  // Plan getters/setters
  getPlan(): PlanType {
    return this.config.plan;
  }

  setPlan(plan: PlanType): void {
    this.config.plan = plan;
    this.saveConfig();
  }

  // Platform-specific config
  getPlatformConfig(platform: PlatformId): PlatformConfig {
    return this.config[platform] || {};
  }

  setPlatformConfig(platform: PlatformId, config: PlatformConfig): void {
    (this.config[platform] as PlatformConfig) = { ...this.config[platform], ...config };
    this.saveConfig();
  }

  getApiKey(platform?: PlatformId, password?: string): string | undefined {
    const plat = platform || this.config.active_platform;
    // Only return encrypted API key when password is provided
    if (password) {
      const encryptedKey = this.config[plat]?.encrypted_api_key;
      if (encryptedKey) {
        try {
          return decrypt(encryptedKey, password);
        } catch (error) {
          logger.warning(`Failed to decrypt API key: ${error}`);
        }
      }
    }
    // No fallback to plaintext - return undefined if no encrypted key available
    return undefined;
  }

  setApiKey(platform: PlatformId, apiKey: string, password: string): void {
    if (!this.config[platform]) {
      this.config[platform] = {};
    }
    // Always encrypt and store the API key
    const encryptedKey = encrypt(apiKey, password);
    (this.config[platform] as PlatformConfig).encrypted_api_key = encryptedKey;
    this.saveConfig();
  }

  revokeApiKey(platform: PlatformId): void {
    if (this.config[platform]) {
      delete (this.config[platform] as PlatformConfig).api_key;
      delete (this.config[platform] as PlatformConfig).encrypted_api_key;
      this.saveConfig();
    }
  }

  getEndpoint(platform?: PlatformId): string | undefined {
    const plat = platform || this.config.active_platform;
    return this.config[plat]?.endpoint;
  }

  setEndpoint(platform: PlatformId, endpoint: string): void {
    if (!this.config[platform]) {
      this.config[platform] = {};
    }
    (this.config[platform] as PlatformConfig).endpoint = endpoint;
    this.saveConfig();
  }

  // Credential storage getters/setters
  getCredentialStorage(): CredentialStorageConfig | undefined {
    return this.config.credentialStorage;
  }

  setCredentialStorage(config: CredentialStorageConfig): void {
    this.config.credentialStorage = config;
    this.saveConfig();
  }

  getCredentialStorageType(): CredentialStorageType | undefined {
    return this.config.credentialStorage?.type;
  }

  setCredentialStorageType(type: CredentialStorageType): void {
    if (!this.config.credentialStorage) {
      this.config.credentialStorage = { type };
    } else {
      this.config.credentialStorage.type = type;
    }
    this.saveConfig();
  }

  getCredentialStorageEnvPrefix(): string | undefined {
    return this.config.credentialStorage?.envPrefix;
  }

  setCredentialStorageEnvPrefix(prefix: string): void {
    if (!this.config.credentialStorage) {
      this.config.credentialStorage = { type: 'env', envPrefix: prefix };
    } else {
      this.config.credentialStorage.envPrefix = prefix;
    }
    this.saveConfig();
  }

  getCredentialStorageExternalProvider(): string | undefined {
    return this.config.credentialStorage?.externalProvider;
  }

  setCredentialStorageExternalProvider(provider: string): void {
    if (!this.config.credentialStorage) {
      this.config.credentialStorage = { type: 'external', externalProvider: provider };
    } else {
      this.config.credentialStorage.type = 'external';
      this.config.credentialStorage.externalProvider = provider;
    }
    this.saveConfig();
  }
}

export const configManager = ConfigManager.getInstance();
