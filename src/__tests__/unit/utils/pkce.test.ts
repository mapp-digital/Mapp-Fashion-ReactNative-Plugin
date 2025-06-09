import CryptoJS from 'crypto-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pkceChallenge, type PKCEChallenge } from '../../../utils/pkce';

describe('PKCE Utils', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe('pkceChallenge', () => {
    it('should return an object with codeVerifier and codeChallenge properties', () => {
      const result = pkceChallenge();

      expect(result).toHaveProperty('codeVerifier');
      expect(result).toHaveProperty('codeChallenge');
      expect(typeof result.codeVerifier).toBe('string');
      expect(typeof result.codeChallenge).toBe('string');
    });

    it('should generate codeVerifier with correct length (43 characters)', () => {
      const result = pkceChallenge();

      expect(result.codeVerifier).toHaveLength(43);
    });

    it('should generate codeVerifier using only RFC 7636 compliant characters', () => {
      const result = pkceChallenge();
      const allowedChars = /^[A-Za-z0-9\-._~]+$/;

      expect(result.codeVerifier).toMatch(allowedChars);
    });

    it('should generate different codeVerifier on each call', () => {
      const result1 = pkceChallenge();
      const result2 = pkceChallenge();

      expect(result1.codeVerifier).not.toBe(result2.codeVerifier);
    });

    it('should generate different codeChallenge on each call', () => {
      const result1 = pkceChallenge();
      const result2 = pkceChallenge();

      expect(result1.codeChallenge).not.toBe(result2.codeChallenge);
    });

    it('should generate codeChallenge that is base64url encoded (no +/= characters)', () => {
      const result = pkceChallenge();

      // Should not contain +, /, or = characters (base64url encoding)
      expect(result.codeChallenge).not.toMatch(/[\+/=]/);
    });

    it('should generate codeChallenge from SHA256 hash of codeVerifier', () => {
      const result = pkceChallenge();

      // Manually calculate what the challenge should be
      const expectedHash = CryptoJS.SHA256(result.codeVerifier);
      const expectedChallenge = expectedHash
        .toString(CryptoJS.enc.Base64)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      expect(result.codeChallenge).toBe(expectedChallenge);
    });

    it('should generate codeChallenge with expected length for SHA256 base64url', () => {
      const result = pkceChallenge();

      // SHA256 hash is 32 bytes, base64 encoded is 44 chars, base64url removes padding
      // So it should be 43 characters (44 - 1 padding char)
      expect(result.codeChallenge.length).toBe(43);
    });

    it('should convert base64 to base64url encoding correctly', () => {
      // Test the actual conversion by checking for base64url compliance
      const result = pkceChallenge();

      // Base64url should not contain +, /, or = characters
      expect(result.codeChallenge).not.toMatch(/[+/=]/);

      // Should contain only valid base64url characters
      expect(result.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate valid PKCE challenge conforming to RFC 7636', () => {
      const result = pkceChallenge();

      // RFC 7636 requirements:
      // 1. Code verifier: 43-128 characters, using [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
      expect(result.codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(result.codeVerifier.length).toBeLessThanOrEqual(128);
      expect(result.codeVerifier).toMatch(/^[A-Za-z0-9\-._~]+$/);

      // 2. Code challenge: base64url-encoded SHA256 hash
      expect(result.codeChallenge).toMatch(/^[A-Za-z0-9\-_]+$/); // base64url characters only
      expect(result.codeChallenge).not.toMatch(/[+=\/]/); // no base64 padding or special chars
    });
  });

  describe('interface compliance', () => {
    it('should return object matching PKCEChallenge interface', () => {
      const result: PKCEChallenge = pkceChallenge();

      // TypeScript compilation ensures interface compliance
      // Runtime checks for expected structure
      expect(result).toEqual({
        codeVerifier: expect.any(String),
        codeChallenge: expect.any(String),
      });
    });

    it('should be compatible with react-native-pkce-challenge interface', () => {
      const result = pkceChallenge();

      // Should have exact same properties as the original library
      const expectedKeys = ['codeVerifier', 'codeChallenge'];
      const actualKeys = Object.keys(result);

      expect(actualKeys.sort()).toEqual(expectedKeys.sort());
    });
  });

  describe('security considerations', () => {
    it('should generate sufficiently random codeVerifier', () => {
      // Generate multiple challenges and ensure they're all different
      const results = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const result = pkceChallenge();
        results.add(result.codeVerifier);
      }

      // All generated verifiers should be unique
      expect(results.size).toBe(iterations);
    });

    it('should use SHA256 algorithm for code challenge generation', () => {
      // Test that the generated challenge is consistent with SHA256 hashing
      const result1 = pkceChallenge();
      const result2 = pkceChallenge();

      // Different inputs should produce different outputs (indicating hashing is working)
      expect(result1.codeChallenge).not.toBe(result2.codeChallenge);

      // Manual verification that SHA256 is being used
      const manualHash = CryptoJS.SHA256(result1.codeVerifier);
      const manualChallenge = manualHash
        .toString(CryptoJS.enc.Base64)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      expect(result1.codeChallenge).toBe(manualChallenge);
    });

    it('should not leak sensitive data in returned object', () => {
      const result = pkceChallenge();

      // Should only contain the two required properties
      expect(Object.keys(result)).toHaveLength(2);

      // Should not contain any functions or other sensitive data
      expect(typeof result.codeVerifier).toBe('string');
      expect(typeof result.codeChallenge).toBe('string');
    });
  });

  describe('robustness', () => {
    it('should handle edge cases in random generation', () => {
      // Test with various Math.random values to ensure robustness
      const testValues = [0, 0.1, 0.5, 0.9, 0.999999];

      testValues.forEach(value => {
        const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(value);

        const result = pkceChallenge();

        // Should always produce valid results regardless of random input
        expect(result.codeVerifier).toHaveLength(43);
        expect(result.codeVerifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
        expect(result.codeChallenge).toHaveLength(43);
        expect(result.codeChallenge).toMatch(/^[A-Za-z0-9\-_]+$/);

        mockRandom.mockRestore();
      });
    });
  });
});
