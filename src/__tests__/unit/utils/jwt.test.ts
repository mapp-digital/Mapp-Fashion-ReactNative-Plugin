import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthCredentials } from '../../../types/auth';
import { accessTokenHasExpired, getNetworkUserId } from '../../../utils/jwt';

describe('JWT Utils', () => {
  // Mock the current time for consistent testing
  const mockCurrentTime = 1640995200000; // January 1, 2022 00:00:00 UTC
  const mockCurrentTimeInSeconds = mockCurrentTime / 1000;

  beforeEach(() => {
    // Mock Date.now() to return a consistent time
    vi.spyOn(Date, 'now').mockReturnValue(mockCurrentTime);
  });

  describe('accessTokenHasExpired', () => {
    it('should return true when credentials are null', () => {
      const result = accessTokenHasExpired(null as any);
      expect(result).toBe(true);
    });

    it('should return true when credentials are undefined', () => {
      const result = accessTokenHasExpired(undefined as any);
      expect(result).toBe(true);
    });

    it('should return true when access_token is missing', () => {
      const credentials: Partial<AuthCredentials> = {
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const result = accessTokenHasExpired(credentials as AuthCredentials);
      expect(result).toBe(true);
    });

    it('should return true when access_token is empty string', () => {
      const credentials: AuthCredentials = {
        access_token: '',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const result = accessTokenHasExpired(credentials);
      expect(result).toBe(true);
    });

    it('should return true when token has invalid format (not 3 parts)', () => {
      const credentials: AuthCredentials = {
        access_token: 'invalid.token', // Only 2 parts
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const result = accessTokenHasExpired(credentials);
      expect(result).toBe(true);
    });

    it('should return true when token has invalid base64 encoding', () => {
      const credentials: AuthCredentials = {
        access_token: 'header.invalid-base64-payload.signature',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const result = accessTokenHasExpired(credentials);
      expect(result).toBe(true);
    });

    it('should return true when token has expired', () => {
      // Create a token that expired 1 hour ago
      const expiredTime = mockCurrentTimeInSeconds - 3600; // 1 hour ago
      const payload = {
        exp: expiredTime,
        iat: expiredTime - 3600,
        iss: 'dressipi',
        sub: 'user123',
        subn: 'network-user-id',
      };

      const base64Payload = btoa(JSON.stringify(payload));
      const expiredToken = `header.${base64Payload}.signature`;

      const credentials: AuthCredentials = {
        access_token: expiredToken,
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const result = accessTokenHasExpired(credentials);
      expect(result).toBe(true);
    });

    it('should return false when token is still valid', () => {
      // Create a token that expires in 1 hour
      const futureTime = mockCurrentTimeInSeconds + 3600; // 1 hour from now
      const payload = {
        exp: futureTime,
        iat: mockCurrentTimeInSeconds,
        iss: 'dressipi',
        sub: 'user123',
        subn: 'network-user-id',
      };

      const base64Payload = btoa(JSON.stringify(payload));
      const validToken = `header.${base64Payload}.signature`;

      const credentials: AuthCredentials = {
        access_token: validToken,
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const result = accessTokenHasExpired(credentials);
      expect(result).toBe(false);
    });
  });

  describe('getNetworkUserId', () => {
    it('should return null when credentials are null', () => {
      const result = getNetworkUserId(null as any);
      expect(result).toBeNull();
    });

    it('should return null when credentials are undefined', () => {
      const result = getNetworkUserId(undefined as any);
      expect(result).toBeNull();
    });

    it('should return null when access_token is missing', () => {
      const credentials: Partial<AuthCredentials> = {
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const result = getNetworkUserId(credentials as AuthCredentials);
      expect(result).toBeNull();
    });

    it('should return null when access_token is empty string', () => {
      const credentials: AuthCredentials = {
        access_token: '',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const result = getNetworkUserId(credentials);
      expect(result).toBeNull();
    });

    it('should return null when token has invalid format', () => {
      const credentials: AuthCredentials = {
        access_token: 'invalid.token', // Only 2 parts
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const result = getNetworkUserId(credentials);
      expect(result).toBeNull();
    });

    it('should return null when token has invalid base64 encoding', () => {
      const credentials: AuthCredentials = {
        access_token: 'header.invalid-base64-payload.signature',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const result = getNetworkUserId(credentials);
      expect(result).toBeNull();
    });

    it('should return network user ID when token is valid and subn exists', () => {
      const payload = {
        exp: mockCurrentTimeInSeconds + 3600,
        iat: mockCurrentTimeInSeconds,
        iss: 'dressipi',
        sub: 'user123',
        subn: 'network-user-id-456',
      };

      const base64Payload = btoa(JSON.stringify(payload));
      const validToken = `header.${base64Payload}.signature`;

      const credentials: AuthCredentials = {
        access_token: validToken,
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const result = getNetworkUserId(credentials);
      expect(result).toBe('network-user-id-456');
    });

    it('should return null when token is valid but subn is missing', () => {
      const payload = {
        exp: mockCurrentTimeInSeconds + 3600,
        iat: mockCurrentTimeInSeconds,
        iss: 'dressipi',
        sub: 'user123',
        // No subn field
      };

      const base64Payload = btoa(JSON.stringify(payload));
      const validToken = `header.${base64Payload}.signature`;

      const credentials: AuthCredentials = {
        access_token: validToken,
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const result = getNetworkUserId(credentials);
      expect(result).toBeNull();
    });

    it('should return null when token is valid but subn is empty string', () => {
      const payload = {
        exp: mockCurrentTimeInSeconds + 3600,
        iat: mockCurrentTimeInSeconds,
        iss: 'dressipi',
        sub: 'user123',
        subn: '',
      };

      const base64Payload = btoa(JSON.stringify(payload));
      const validToken = `header.${base64Payload}.signature`;

      const credentials: AuthCredentials = {
        access_token: validToken,
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const result = getNetworkUserId(credentials);
      expect(result).toBeNull();
    });

    it('should handle token with special characters in subn', () => {
      const payload = {
        exp: mockCurrentTimeInSeconds + 3600,
        iat: mockCurrentTimeInSeconds,
        iss: 'dressipi',
        sub: 'user123',
        subn: 'network-user-id_with-special.chars@domain.com',
      };

      const base64Payload = btoa(JSON.stringify(payload));
      const validToken = `header.${base64Payload}.signature`;

      const credentials: AuthCredentials = {
        access_token: validToken,
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const result = getNetworkUserId(credentials);
      expect(result).toBe('network-user-id_with-special.chars@domain.com');
    });
  });

  describe('integration scenarios', () => {
    it('should handle real-world JWT token structure', () => {
      // Simulate a more realistic JWT payload
      const payload = {
        exp: mockCurrentTimeInSeconds + 1800, // 30 minutes from now
        iat: mockCurrentTimeInSeconds - 300, // Issued 5 minutes ago
        iss: 'https://auth.dressipi.com',
        sub: 'user_abcdef123456',
        subn: 'snowplow_network_user_789xyz',
        aud: 'dressipi-api',
        jti: 'unique-token-id-123',
      };

      const base64Payload = btoa(JSON.stringify(payload));
      const realisticToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${base64Payload}.signature`;

      const credentials: AuthCredentials = {
        access_token: realisticToken,
        refresh_token: 'refresh_token_abc123xyz',
        token_type: 'Bearer',
        expires_in: 1800,
      };

      // Test expiration check
      expect(accessTokenHasExpired(credentials)).toBe(false);

      // Test network user ID extraction
      expect(getNetworkUserId(credentials)).toBe(
        'snowplow_network_user_789xyz'
      );
    });

    it('should handle malformed JSON in token payload gracefully', () => {
      // Create a token with malformed JSON payload
      const malformedPayload = btoa('{"exp": 123, "iat": invalid json}');
      const malformedToken = `header.${malformedPayload}.signature`;

      const credentials: AuthCredentials = {
        access_token: malformedToken,
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      expect(accessTokenHasExpired(credentials)).toBe(true);
      expect(getNetworkUserId(credentials)).toBeNull();
    });
  });
});
