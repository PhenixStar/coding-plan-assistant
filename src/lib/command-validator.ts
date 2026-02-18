import { logger } from './logger.js';

/**
 * Result of command validation
 */
export interface ValidationResult {
  isValid: boolean;
  command: string;
  args: string[];
  error?: string;
  warnings?: string[];
}

/**
 * Options for command execution
 */
export interface SafeExecOptions {
  /**
   * Working directory for command execution
   */
  cwd?: string;
  /**
   * Environment variables
   */
  env?: NodeJS.ProcessEnv;
  /**
   * Timeout in milliseconds
   */
  timeout?: number;
}

/**
 * Command validator for safe command execution
 * Prevents command injection by validating and sanitizing commands
 */
class CommandValidator {
  private static instance: CommandValidator;

  // Dangerous patterns that indicate potential command injection
  private readonly DANGEROUS_PATTERNS: RegExp[] = [
    /[;&|`$]/,                    // Shell metacharacters
    /\x00/,                        // Null bytes
    /\s*&&\s*/,                  // Command chaining
    /\s*\|\s*/,                  // Pipe chaining
    /\s*;\s*/,                   // Semicolon chaining
    /\s*`.*`/,                   // Backtick command substitution
    /\$\(/,                       // $() command substitution
    />>/                         // Output redirection
  ];

  // Allowed characters for command arguments
  private readonly SAFE_ARG_PATTERN = /^[a-zA-Z0-9._\-\/]+$/;

  private constructor() {}

  static getInstance(): CommandValidator {
    if (!CommandValidator.instance) {
      CommandValidator.instance = new CommandValidator();
    }
    return CommandValidator.instance;
  }

  /**
   * Parse a command string into command and arguments
   * Uses shell parsing to properly split command and args
   * @param commandString - The full command string to parse
   * @returns Object with command and args separated
   */
  parseCommand(commandString: string): { command: string; args: string[] } {
    if (!commandString || typeof commandString !== 'string') {
      return { command: '', args: [] };
    }

    const trimmed = commandString.trim();
    if (!trimmed) {
      return { command: '', args: [] };
    }

    // Simple parsing - split on whitespace but respect quotes
    const parts = this.tokenizeCommand(trimmed);
    if (parts.length === 0) {
      return { command: '', args: [] };
    }

    const command = parts[0];
    const args = parts.slice(1);

    return { command, args };
  }

  /**
   * Tokenize a command string while respecting quoted arguments
   */
  private tokenizeCommand(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      if (!inQuote && (char === '"' || char === "'")) {
        inQuote = true;
        quoteChar = char;
      } else if (inQuote && char === quoteChar) {
        inQuote = false;
        quoteChar = '';
      } else if (!inQuote && char === ' ') {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.length > 0) {
      tokens.push(current);
    }

    return tokens;
  }

  /**
   * Validate a command string for potential command injection
   * @param commandString - The command to validate
   * @returns Validation result with details
   */
  validate(commandString: string): ValidationResult {
    const result: ValidationResult = {
      isValid: false,
      command: '',
      args: [],
      warnings: []
    };

    if (!commandString || typeof commandString !== 'string') {
      result.error = 'Command is empty or invalid';
      return result;
    }

    const trimmed = commandString.trim();
    if (!trimmed) {
      result.error = 'Command is empty';
      return result;
    }

    // Parse command
    const { command, args } = this.parseCommand(trimmed);
    result.command = command;
    result.args = args;

    if (!command) {
      result.error = 'No command specified';
      return result;
    }

    // Check for dangerous patterns in the original command string
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(trimmed)) {
        result.warnings = result.warnings || [];
        result.warnings.push(`Potentially dangerous pattern detected: ${pattern.source}`);
      }
    }

    // Validate command name (should be a simple path or command)
    if (!this.isSafeCommandName(command)) {
      result.error = `Command contains invalid characters: ${command}`;
      return result;
    }

    // Validate arguments
    for (const arg of args) {
      if (!this.isSafeArgument(arg)) {
        result.error = `Argument contains invalid characters: ${arg}`;
        return result;
      }
    }

    result.isValid = true;
    return result;
  }

  /**
   * Check if a command name is safe
   */
  private isSafeCommandName(command: string): boolean {
    // Allow absolute paths, relative paths, and simple command names
    // Command names can contain: letters, numbers, dots, dashes, underscores, forward slashes
    const safeCommandPattern = /^[a-zA-Z0-9._\-\/]+$/;
    return safeCommandPattern.test(command);
  }

  /**
   * Check if an argument is safe
   */
  private isSafeArgument(arg: string): boolean {
    // Empty strings are allowed (they might be intentional)
    if (arg.length === 0) {
      return true;
    }

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(arg)) {
        return false;
      }
    }

    // If it passes dangerous patterns, check if it's alphanumeric/safe
    return this.SAFE_ARG_PATTERN.test(arg);
  }

  /**
   * Create a safe execution object from a command string
   * Returns null if the command is invalid
   * @param commandString - The command to make safe
   * @returns Safe execution object or null
   */
  makeSafe(commandString: string): { cmd: string; args: string[] } | null {
    const validation = this.validate(commandString);

    if (!validation.isValid) {
      logger.debug(`Command validation failed: ${validation.error}`);
      return null;
    }

    if (validation.warnings && validation.warnings.length > 0) {
      logger.warning(`Command has warnings: ${validation.warnings.join(', ')}`);
    }

    return {
      cmd: validation.command,
      args: validation.args
    };
  }

  /**
   * Execute a command safely using execFile (not execSync)
   * This prevents shell injection by passing args separately
   * @param commandString - The command to execute
   * @param options - Execution options
   * @returns Object with success status and output/error
   */
  async exec(commandString: string, options: SafeExecOptions = {}): Promise<{
    success: boolean;
    stdout?: string;
    stderr?: string;
    error?: string;
  }> {
    const safe = this.makeSafe(commandString);

    if (!safe) {
      return {
        success: false,
        error: 'Invalid command - validation failed'
      };
    }

    const { execFile } = await import('node:child_process');

    return new Promise((resolve) => {
      const child = execFile(safe.cmd, safe.args, {
        cwd: options.cwd,
        env: options.env,
        timeout: options.timeout
      }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            stderr,
            error: error.message
          });
        } else {
          resolve({
            success: true,
            stdout,
            stderr
          });
        }
      });
    });
  }
}

export const commandValidator = CommandValidator.getInstance();
export { CommandValidator };
