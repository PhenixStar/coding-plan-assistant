import { describe, it, expect, beforeEach, vi } from 'vitest';
import { commandValidator, CommandValidator } from '../lib/command-validator.js';

describe('Command Injection Prevention', () => {
  describe('CommandValidator', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Shell Metacharacter Detection', () => {
      it('should detect semicolon in command', () => {
        const result = commandValidator.validate('ls; rm -rf /');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });

      it('should detect ampersand in command', () => {
        const result = commandValidator.validate('ls & cat /etc/passwd');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });

      it('should detect pipe in command', () => {
        const result = commandValidator.validate('ls | grep test');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });

      it('should detect backtick command substitution', () => {
        const result = commandValidator.validate('ls `whoami`');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });

      it('should detect $() command substitution', () => {
        const result = commandValidator.validate('ls $(whoami)');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });

      it('should detect dollar sign in command', () => {
        const result = commandValidator.validate('echo $HOME');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });

      it('should detect null byte in command', () => {
        const result = commandValidator.validate('ls\x00');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });
    });

    describe('Command Chaining Detection', () => {
      it('should detect && command chaining', () => {
        const result = commandValidator.validate('ls && rm -rf /');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });

      it('should detect || command chaining', () => {
        const result = commandValidator.validate('ls || cat /etc/passwd');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });

      it('should detect ; command chaining', () => {
        const result = commandValidator.validate('ls; cat /etc/passwd');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });
    });

    describe('Output Redirection Detection', () => {
      it('should detect >> output redirection', () => {
        const result = commandValidator.validate('echo hello >> /etc/passwd');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });

      it('should detect > output redirection', () => {
        const result = commandValidator.validate('echo hello > /tmp/file');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });

      it('should detect < input redirection', () => {
        const result = commandValidator.validate('cat < /etc/passwd');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });
    });

    describe('Safe Commands', () => {
      it('should accept simple command without arguments', () => {
        const result = commandValidator.validate('ls');
        expect(result.isValid).toBe(true);
        expect(result.command).toBe('ls');
        expect(result.args).toEqual([]);
      });

      it('should accept command with safe arguments', () => {
        const result = commandValidator.validate('git status');
        expect(result.isValid).toBe(true);
        expect(result.command).toBe('git');
        expect(result.args).toEqual(['status']);
      });

      it('should accept command with path arguments', () => {
        const result = commandValidator.validate('code /path/to/file');
        expect(result.isValid).toBe(true);
        expect(result.command).toBe('code');
        expect(result.args).toEqual(['/path/to/file']);
      });

      it('should accept command with dotted path', () => {
        const result = commandValidator.validate('./node_modules/.bin/tsc');
        expect(result.isValid).toBe(true);
        expect(result.command).toBe('./node_modules/.bin/tsc');
        expect(result.args).toEqual([]);
      });

      it('should accept command with dash arguments', () => {
        const result = commandValidator.validate('npm install -g package-name');
        expect(result.isValid).toBe(true);
        expect(result.command).toBe('npm');
        expect(result.args).toEqual(['install', '-g', 'package-name']);
      });
    });

    describe('Edge Cases', () => {
      it('should reject empty command', () => {
        const result = commandValidator.validate('');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('empty');
      });

      it('should reject null command', () => {
        const result = commandValidator.validate(null as unknown as string);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('empty');
      });

      it('should reject undefined command', () => {
        const result = commandValidator.validate(undefined as unknown as string);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('empty');
      });

      it('should reject whitespace-only command', () => {
        const result = commandValidator.validate('   ');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('empty');
      });
    });

    describe('makeSafe method', () => {
      it('should return safe command object for valid commands', () => {
        const safe = commandValidator.makeSafe('git status');
        expect(safe).not.toBeNull();
        expect(safe?.cmd).toBe('git');
        expect(safe?.args).toEqual(['status']);
      });

      it('should return null for invalid commands', () => {
        const safe = commandValidator.makeSafe('ls; rm -rf /');
        expect(safe).toBeNull();
      });
    });

    describe('parseCommand method', () => {
      it('should parse simple command correctly', () => {
        const parsed = commandValidator.parseCommand('git commit -m "message"');
        expect(parsed.command).toBe('git');
        expect(parsed.args).toEqual(['commit', '-m', 'message']);
      });

      it('should handle quoted arguments with spaces', () => {
        const parsed = commandValidator.parseCommand('echo "hello world"');
        expect(parsed.command).toBe('echo');
        expect(parsed.args).toEqual(['hello world']);
      });

      it('should handle single quoted arguments', () => {
        const parsed = commandValidator.parseCommand("echo 'hello world'");
        expect(parsed.command).toBe('echo');
        expect(parsed.args).toEqual(['hello world']);
      });

      it('should return empty for empty input', () => {
        const parsed = commandValidator.parseCommand('');
        expect(parsed.command).toBe('');
        expect(parsed.args).toEqual([]);
      });
    });
  });

  describe('Command Execution Safety', () => {
    it('should not execute commands with shell injection attempts', async () => {
      const dangerousCommands = [
        'echo hello; rm -rf /',
        'echo hello && cat /etc/passwd',
        'echo hello || whoami',
        'echo `whoami`',
        'echo $(whoami)',
        'echo $PATH',
        'echo test > /tmp/file',
        'echo test >> /tmp/file',
      ];

      for (const cmd of dangerousCommands) {
        const result = commandValidator.validate(cmd);
        expect(result.isValid).toBe(false);
      }
    });

    it('should allow safe package manager commands', () => {
      const safeCommands = [
        'npm install',
        'npm install typescript',
        'pip install requests',
        'git status',
        'git commit',
      ];

      for (const cmd of safeCommands) {
        const result = commandValidator.validate(cmd);
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should allow relative paths in arguments', () => {
      const result = commandValidator.validate('code ./src/index.ts');
      expect(result.isValid).toBe(true);
      expect(result.args).toContain('./src/index.ts');
    });

    it('should allow absolute paths in arguments', () => {
      const result = commandValidator.validate('code /usr/local/bin/script');
      expect(result.isValid).toBe(true);
      expect(result.args).toContain('/usr/local/bin/script');
    });

    it('should reject paths with null bytes', () => {
      const result = commandValidator.validate('code /path/to\x00file');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Validator Singleton', () => {
    it('should return the same instance', () => {
      const instance1 = CommandValidator.getInstance();
      const instance2 = CommandValidator.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});
