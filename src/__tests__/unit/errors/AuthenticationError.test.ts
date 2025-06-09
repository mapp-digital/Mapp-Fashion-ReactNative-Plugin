import { describe, expect, it } from 'vitest';
import { AuthenticationError } from '../../../errors/AuthenticationError';

describe('AuthenticationError', () => {
  describe('constructor', () => {
    it('should create an instance with the provided message', () => {
      const message = 'Authentication failed';
      const error = new AuthenticationError(message);

      expect(error.message).toBe(message);
    });

    it('should set the correct error name', () => {
      const error = new AuthenticationError('test message');

      expect(error.name).toBe('AuthenticationError');
    });

    it('should extend the base Error class', () => {
      const error = new AuthenticationError('test message');

      expect(error).toBeInstanceOf(Error);
    });

    it('should be an instance of AuthenticationError', () => {
      const error = new AuthenticationError('test message');

      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('should handle empty message', () => {
      const error = new AuthenticationError('');

      expect(error.message).toBe('');
      expect(error.name).toBe('AuthenticationError');
    });

    it('should handle special characters in message', () => {
      const message = 'Authentication failed: 401 - Unauthorized @#$%';
      const error = new AuthenticationError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('AuthenticationError');
    });

    it('should handle multiline messages', () => {
      const message =
        'Authentication failed\nInvalid credentials\nPlease try again';
      const error = new AuthenticationError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('AuthenticationError');
    });
  });

  describe('inheritance and prototype chain', () => {
    it('should maintain correct prototype chain', () => {
      const error = new AuthenticationError('test message');

      expect(Object.getPrototypeOf(error)).toBe(AuthenticationError.prototype);
    });

    it('should work with instanceof checks', () => {
      const error = new AuthenticationError('test message');

      expect(error instanceof AuthenticationError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should preserve stack trace', () => {
      const error = new AuthenticationError('test message');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack).toContain('AuthenticationError');
    });
  });

  describe('error handling scenarios', () => {
    it('should be catchable as Error', () => {
      expect(() => {
        throw new AuthenticationError('test error');
      }).toThrow(Error);
    });

    it('should be catchable as AuthenticationError', () => {
      expect(() => {
        throw new AuthenticationError('test error');
      }).toThrow(AuthenticationError);
    });

    it('should preserve message when thrown and caught', () => {
      const message = 'Invalid API key provided';

      try {
        throw new AuthenticationError(message);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError);
        expect((error as AuthenticationError).message).toBe(message);
        expect((error as AuthenticationError).name).toBe('AuthenticationError');
      }
    });

    it('should work in promise rejections', async () => {
      const message = 'Token expired';

      await expect(
        Promise.reject(new AuthenticationError(message))
      ).rejects.toThrow(AuthenticationError);

      await expect(
        Promise.reject(new AuthenticationError(message))
      ).rejects.toThrow(message);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle common authentication error messages', () => {
      const commonMessages = [
        'Invalid credentials',
        'Token has expired',
        'Access denied',
        'API key is invalid',
        'Authentication timeout',
        'User not found',
        'Permission denied',
      ];

      commonMessages.forEach(message => {
        const error = new AuthenticationError(message);
        expect(error.message).toBe(message);
        expect(error.name).toBe('AuthenticationError');
        expect(error).toBeInstanceOf(AuthenticationError);
      });
    });

    it('should handle JSON error messages', () => {
      const jsonMessage = JSON.stringify({
        error: 'authentication_failed',
        description: 'The provided API key is invalid',
        code: 401,
      });

      const error = new AuthenticationError(jsonMessage);

      expect(error.message).toBe(jsonMessage);
      expect(error.name).toBe('AuthenticationError');
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new AuthenticationError(longMessage);

      expect(error.message).toBe(longMessage);
      expect(error.message).toHaveLength(1000);
      expect(error.name).toBe('AuthenticationError');
    });
  });

  describe('comparison with other error types', () => {
    it('should be distinguishable from generic Error', () => {
      const authError = new AuthenticationError('auth failed');
      const genericError = new Error('generic error');

      expect(authError).toBeInstanceOf(AuthenticationError);
      expect(genericError).not.toBeInstanceOf(AuthenticationError);
      expect(authError.name).toBe('AuthenticationError');
      expect(genericError.name).toBe('Error');
    });

    it('should be distinguishable from other custom errors', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const authError = new AuthenticationError('auth failed');
      const customError = new CustomError('custom error');

      expect(authError).not.toBeInstanceOf(CustomError);
      expect(customError).not.toBeInstanceOf(AuthenticationError);
      expect(authError.name).toBe('AuthenticationError');
      expect(customError.name).toBe('CustomError');
    });
  });
});
