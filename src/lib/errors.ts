import { logger } from './logger.js';

/**
 * Error codes for the CLI application.
 * Organized by category for easy troubleshooting.
 */
export enum ErrorCode {
  // Configuration errors (1000-1099)
  CONFIG_LOAD_FAILED = 'CONFIG_1001',
  CONFIG_SAVE_FAILED = 'CONFIG_1002',
  CONFIG_INVALID = 'CONFIG_1003',
  CONFIG_DIR_CREATE_FAILED = 'CONFIG_1004',

  // Platform errors (2000-2099)
  PLATFORM_INVALID = 'PLATFORM_2001',
  PLATFORM_NOT_CONFIGURED = 'PLATFORM_2002',
  PLATFORM_API_KEY_MISSING = 'PLATFORM_2003',
  PLATFORM_API_KEY_INVALID = 'PLATFORM_2004',
  PLATFORM_ENDPOINT_INVALID = 'PLATFORM_2005',
  PLATFORM_AUTH_FAILED = 'PLATFORM_2006',
  PLATFORM_REQUEST_FAILED = 'PLATFORM_2007',

  // Tool errors (3000-3099)
  TOOL_NOT_FOUND = 'TOOL_3001',
  TOOL_NOT_INSTALLED = 'TOOL_3002',
  TOOL_INSTALL_FAILED = 'TOOL_3003',
  TOOL_CONFIG_FAILED = 'TOOL_3004',
  TOOL_VALIDATION_FAILED = 'TOOL_3005',
  TOOL_EXECUTION_FAILED = 'TOOL_3006',

  // MCP Server errors (4000-4099)
  MCP_SERVER_NOT_FOUND = 'MCP_4001',
  MCP_SERVER_START_FAILED = 'MCP_4002',
  MCP_SERVER_STOP_FAILED = 'MCP_4003',
  MCP_CONFIG_INVALID = 'MCP_4004',
  MCP_CONNECTION_FAILED = 'MCP_4005',
  MCP_TIMEOUT = 'MCP_4006',

  // Authentication errors (5000-5099)
  AUTH_FAILED = 'AUTH_5001',
  AUTH_TOKEN_INVALID = 'AUTH_5002',
  AUTH_TOKEN_EXPIRED = 'AUTH_5003',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_5004',

  // File system errors (6000-6099)
  FILE_NOT_FOUND = 'FS_6001',
  FILE_READ_FAILED = 'FS_6002',
  FILE_WRITE_FAILED = 'FS_6003',
  FILE_PERMISSION_DENIED = 'FS_6004',
  DIRECTORY_NOT_FOUND = 'FS_6005',

  // Validation errors (7000-7099)
  VALIDATION_FAILED = 'VALIDATION_7001',
  INVALID_INPUT = 'VALIDATION_7002',
  MISSING_REQUIRED_FIELD = 'VALIDATION_7003',

  // Internal errors (8000-8099)
  INTERNAL_ERROR = 'INTERNAL_8001',
  NOT_IMPLEMENTED = 'INTERNAL_8002',
  UNEXPECTED_STATE = 'INTERNAL_8003',

  // Network errors (9000-9099)
  NETWORK_ERROR = 'NETWORK_9001',
  NETWORK_TIMEOUT = 'NETWORK_9002',
  NETWORK_OFFLINE = 'NETWORK_9003'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Base interface for error context
 */
export interface ErrorContext {
  /** Additional details about the error */
  details?: Record<string, unknown>;
  /** The operation that was being performed when the error occurred */
  operation?: string;
  /** File path related to the error, if applicable */
  filePath?: string;
  /** Platform related to the error, if applicable */
  platform?: string;
  /** Tool name related to the error, if applicable */
  tool?: string;
  /** Original error that was caught and wrapped */
  originalError?: Error;
}

/**
 * Application error class with enhanced error information
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly suggestedActions: string[];
  public readonly timestamp: Date;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: ErrorContext;
      suggestedActions?: string[];
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = options?.severity ?? ErrorSeverity.MEDIUM;
    this.context = options?.context ?? {};
    this.suggestedActions = options?.suggestedActions ?? [];
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Get a user-friendly error message with context
   */
  getUserMessage(): string {
    let msg = `[${this.code}] ${this.message}`;

    if (this.context.operation) {
      msg += `\n  Operation: ${this.context.operation}`;
    }

    if (this.context.filePath) {
      msg += `\n  File: ${this.context.filePath}`;
    }

    if (this.context.platform) {
      msg += `\n  Platform: ${this.context.platform}`;
    }

    if (this.context.tool) {
      msg += `\n  Tool: ${this.context.tool}`;
    }

    if (this.suggestedActions.length > 0) {
      msg += '\n  Suggested actions:';
      for (const action of this.suggestedActions) {
        msg += `\n    - ${action}`;
      }
    }

    return msg;
  }

  /**
   * Get a detailed error message for debugging
   */
  getDebugMessage(): string {
    let msg = `Error: ${this.message}\n`;
    msg += `Code: ${this.code}\n`;
    msg += `Severity: ${this.severity}\n`;
    msg += `Timestamp: ${this.timestamp.toISOString()}\n`;

    if (Object.keys(this.context).length > 0) {
      msg += `Context: ${JSON.stringify(this.context, null, 2)}\n`;
    }

    if (this.context.originalError) {
      msg += `Original Error: ${this.context.originalError.message}\n`;
      msg += `Original Stack: ${this.context.originalError.stack}\n`;
    }

    return msg;
  }

  /**
   * Log the error using the logger
   */
  log(): void {
    logger.error(this.getUserMessage());

    // Also log debug info in verbose mode
    logger.debug(this.getDebugMessage());
  }
}

/**
 * Configuration error
 */
export class ConfigError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: ErrorContext;
      suggestedActions?: string[];
    }
  ) {
    super(code, message, options);
    this.name = 'ConfigError';
  }
}

/**
 * Platform error
 */
export class PlatformError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: ErrorContext;
      suggestedActions?: string[];
    }
  ) {
    super(code, message, options);
    this.name = 'PlatformError';
  }
}

/**
 * Tool error
 */
export class ToolError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: ErrorContext;
      suggestedActions?: string[];
    }
  ) {
    super(code, message, options);
    this.name = 'ToolError';
  }
}

/**
 * MCP Server error
 */
export class MCPServerError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: ErrorContext;
      suggestedActions?: string[];
    }
  ) {
    super(code, message, options);
    this.name = 'MCPServerError';
  }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: ErrorContext;
      suggestedActions?: string[];
    }
  ) {
    super(code, message, options);
    this.name = 'AuthError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: ErrorContext;
      suggestedActions?: string[];
    }
  ) {
    super(code, message, options);
    this.name = 'ValidationError';
  }
}

/**
 * Network error
 */
export class NetworkError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: ErrorContext;
      suggestedActions?: string[];
    }
  ) {
    super(code, message, options);
    this.name = 'NetworkError';
  }
}

/**
 * Helper function to wrap errors with context
 */
export function wrapError(
  error: Error,
  code: ErrorCode,
  message: string,
  options?: {
    severity?: ErrorSeverity;
    context?: ErrorContext;
    suggestedActions?: string[];
  }
): AppError {
  return new AppError(code, message, {
    ...options,
    context: {
      ...options?.context,
      originalError: error
    }
  });
}

/**
 * Get suggested actions based on error code
 */
export function getSuggestedActions(code: ErrorCode): string[] {
  const suggestions: Partial<Record<ErrorCode, string[]>> = {
    [ErrorCode.CONFIG_LOAD_FAILED]: [
      'Check if config file exists and is valid YAML format',
      'Run the configuration wizard: npx unified-coding-helper config'
    ],
    [ErrorCode.CONFIG_SAVE_FAILED]: [
      'Check file permissions in the config directory',
      'Ensure the directory ~/.unified-coding-helper exists'
    ],
    [ErrorCode.PLATFORM_NOT_CONFIGURED]: [
      'Configure the platform: npx unified-coding-helper platform set <platform>',
      'Run the setup wizard: npx unified-coding-helper wizard'
    ],
    [ErrorCode.PLATFORM_API_KEY_MISSING]: [
      'Set the API key: npx unified-coding-helper auth set-key <platform> <api-key>',
      'Check platform configuration: npx unified-coding-helper platform show'
    ],
    [ErrorCode.TOOL_NOT_FOUND]: [
      'Install the tool or check if it is in your PATH',
      'Run: npx unified-coding-helper tool list'
    ],
    [ErrorCode.TOOL_NOT_INSTALLED]: [
      'Install the tool manually or use the install command',
      'Run: npx unified-coding-helper tool install <tool-name>'
    ],
    [ErrorCode.MCP_SERVER_NOT_FOUND]: [
      'Check MCP server configuration in config file',
      'Run: npx unified-coding-helper doctor'
    ],
    [ErrorCode.MCP_CONNECTION_FAILED]: [
      'Ensure the MCP server is running',
      'Check server logs for more details'
    ],
    [ErrorCode.AUTH_FAILED]: [
      'Verify your credentials are correct',
      'Re-authenticate: npx unified-coding-helper auth login'
    ],
    [ErrorCode.NETWORK_ERROR]: [
      'Check your internet connection',
      'Verify the endpoint URL is correct'
    ],
    [ErrorCode.NETWORK_TIMEOUT]: [
      'Try again later',
      'Check if the service is experiencing issues'
    ]
  };

  return suggestions[code] ?? [];
}

export { logger };
