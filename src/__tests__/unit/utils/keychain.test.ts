import * as KeyChain from 'react-native-keychain';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthCredentials } from '../../../types/auth';
import {
  getCredentialsFromKeychain,
  resetCredentialsFromKeychain,
  setCredentialsToKeychain,
} from '../../../utils/keychain';

// Mock react-native-keychain - already mocked in setup.ts but we'll type it properly
const mockKeyChain = KeyChain as any;

describe('Keychain Utils', () => {
  const mockClientId = 'test-client-123';
  const mockServerUrl = 'https://api.dressipi.com';
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';

  const mockCredentials: AuthCredentials = {
    access_token: mockToken,
    refresh_token: 'refresh-token-123',
    token_type: 'Bearer',
    expires_in: 3600,
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe('getCredentialsFromKeychain', () => {
    it('should return credentials when found with matching username', async () => {
      // Mock successful keychain retrieval
      const mockKeychainResponse = {
        username: 'dressipi-test-client-123',
        password: JSON.stringify(mockCredentials),
        service: mockServerUrl,
        storage: 'keychain' as const,
      };

      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse as any
      );

      const result = await getCredentialsFromKeychain(
        mockClientId,
        mockServerUrl
      );

      expect(mockKeyChain.getInternetCredentials).toHaveBeenCalledWith(
        mockServerUrl
      );
      expect(result).toEqual(mockCredentials);
    });

    it('should return null when no credentials found in keychain', async () => {
      // Mock keychain returning false (no credentials found)
      mockKeyChain.getInternetCredentials.mockResolvedValue(false);

      const result = await getCredentialsFromKeychain(
        mockClientId,
        mockServerUrl
      );

      expect(mockKeyChain.getInternetCredentials).toHaveBeenCalledWith(
        mockServerUrl
      );
      expect(result).toBeNull();
    });

    it('should return null when username does not match expected format', async () => {
      // Mock credentials with wrong username
      const mockKeychainResponse = {
        username: 'wrong-username',
        password: JSON.stringify(mockCredentials),
      };

      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse
      );

      const result = await getCredentialsFromKeychain(
        mockClientId,
        mockServerUrl
      );

      expect(result).toBeNull();
    });

    it('should return null when password contains invalid JSON', async () => {
      // Mock credentials with malformed JSON password
      const mockKeychainResponse = {
        username: 'dressipi-test-client-123',
        password: 'invalid-json-string',
      };

      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse
      );

      const result = await getCredentialsFromKeychain(
        mockClientId,
        mockServerUrl
      );

      expect(result).toBeNull();
    });

    it('should return null when keychain throws an error', async () => {
      // Mock keychain throwing an error
      mockKeyChain.getInternetCredentials.mockRejectedValue(
        new Error('Keychain error')
      );

      const result = await getCredentialsFromKeychain(
        mockClientId,
        mockServerUrl
      );

      expect(result).toBeNull();
    });

    it('should handle empty clientId gracefully', async () => {
      const mockKeychainResponse = {
        username: 'dressipi-',
        password: JSON.stringify(mockCredentials),
      };

      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse
      );

      const result = await getCredentialsFromKeychain('', mockServerUrl);

      expect(result).toEqual(mockCredentials);
    });

    it('should handle special characters in clientId', async () => {
      const specialClientId = 'client-123_test@domain.com';
      const mockKeychainResponse = {
        username: `dressipi-${specialClientId}`,
        password: JSON.stringify(mockCredentials),
      };

      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse
      );

      const result = await getCredentialsFromKeychain(
        specialClientId,
        mockServerUrl
      );

      expect(result).toEqual(mockCredentials);
    });

    it('should handle credentials with additional properties', async () => {
      // Mock credentials with extra properties (should still work)
      const extendedCredentials = {
        ...mockCredentials,
        scope: 'read write',
        extra_field: 'should be preserved',
      };

      const mockKeychainResponse = {
        username: 'dressipi-test-client-123',
        password: JSON.stringify(extendedCredentials),
      };

      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse
      );

      const result = await getCredentialsFromKeychain(
        mockClientId,
        mockServerUrl
      );

      expect(result).toEqual(extendedCredentials);
    });
  });

  describe('setCredentialsToKeychain', () => {
    it('should successfully set credentials to keychain', async () => {
      mockKeyChain.setInternetCredentials.mockResolvedValue(true);

      await setCredentialsToKeychain(mockClientId, mockServerUrl, mockToken);

      expect(mockKeyChain.setInternetCredentials).toHaveBeenCalledWith(
        mockServerUrl,
        'dressipi-test-client-123',
        mockToken,
        {
          securityLevel: KeyChain.SECURITY_LEVEL.SECURE_SOFTWARE,
        }
      );
    });

    it('should not attempt to set credentials when clientId is empty', async () => {
      await setCredentialsToKeychain('', mockServerUrl, mockToken);

      expect(mockKeyChain.setInternetCredentials).not.toHaveBeenCalled();
    });

    it('should not attempt to set credentials when clientId is null/undefined', async () => {
      await setCredentialsToKeychain(null as any, mockServerUrl, mockToken);
      expect(mockKeyChain.setInternetCredentials).not.toHaveBeenCalled();

      await setCredentialsToKeychain(
        undefined as any,
        mockServerUrl,
        mockToken
      );
      expect(mockKeyChain.setInternetCredentials).not.toHaveBeenCalled();
    });

    it('should not attempt to set credentials when serverUrl is empty', async () => {
      await setCredentialsToKeychain(mockClientId, '', mockToken);

      expect(mockKeyChain.setInternetCredentials).not.toHaveBeenCalled();
    });

    it('should not attempt to set credentials when serverUrl is null/undefined', async () => {
      await setCredentialsToKeychain(mockClientId, null as any, mockToken);
      expect(mockKeyChain.setInternetCredentials).not.toHaveBeenCalled();

      await setCredentialsToKeychain(mockClientId, undefined as any, mockToken);
      expect(mockKeyChain.setInternetCredentials).not.toHaveBeenCalled();
    });

    it('should throw error when keychain operation fails', async () => {
      const keychainError = new Error('Keychain access denied');
      mockKeyChain.setInternetCredentials.mockRejectedValue(keychainError);

      await expect(
        setCredentialsToKeychain(mockClientId, mockServerUrl, mockToken)
      ).rejects.toThrow(
        'Could not set Dressipi credentials to keychain: Keychain access denied'
      );

      expect(mockKeyChain.setInternetCredentials).toHaveBeenCalled();
    });

    it('should handle empty token gracefully', async () => {
      mockKeyChain.setInternetCredentials.mockResolvedValue(true);

      await setCredentialsToKeychain(mockClientId, mockServerUrl, '');

      expect(mockKeyChain.setInternetCredentials).toHaveBeenCalledWith(
        mockServerUrl,
        'dressipi-test-client-123',
        '',
        {
          securityLevel: KeyChain.SECURITY_LEVEL.SECURE_SOFTWARE,
        }
      );
    });

    it('should handle very long tokens', async () => {
      const longToken = 'a'.repeat(10000); // Very long token
      mockKeyChain.setInternetCredentials.mockResolvedValue(true);

      await setCredentialsToKeychain(mockClientId, mockServerUrl, longToken);

      expect(mockKeyChain.setInternetCredentials).toHaveBeenCalledWith(
        mockServerUrl,
        'dressipi-test-client-123',
        longToken,
        {
          securityLevel: KeyChain.SECURITY_LEVEL.SECURE_SOFTWARE,
        }
      );
    });

    it('should use SECURE_SOFTWARE security level', async () => {
      mockKeyChain.setInternetCredentials.mockResolvedValue(true);

      await setCredentialsToKeychain(mockClientId, mockServerUrl, mockToken);

      const callArgs = mockKeyChain.setInternetCredentials.mock.calls[0];
      const options = callArgs[3];

      expect(options).toEqual({
        securityLevel: KeyChain.SECURITY_LEVEL.SECURE_SOFTWARE,
      });
    });
  });

  describe('resetCredentialsFromKeychain', () => {
    it('should successfully reset credentials from keychain', async () => {
      mockKeyChain.resetInternetCredentials.mockResolvedValue(true);

      await resetCredentialsFromKeychain(mockServerUrl);

      expect(mockKeyChain.resetInternetCredentials).toHaveBeenCalledWith({
        server: mockServerUrl,
      });
    });

    it('should handle keychain reset errors gracefully', async () => {
      // Mock keychain throwing an error during reset
      mockKeyChain.resetInternetCredentials.mockRejectedValue(
        new Error('Could not reset credentials')
      );

      // Should not throw - the function doesn't have error handling, so error will propagate
      await expect(resetCredentialsFromKeychain(mockServerUrl)).rejects.toThrow(
        'Could not reset credentials'
      );
    });

    it('should handle empty serverUrl', async () => {
      mockKeyChain.resetInternetCredentials.mockResolvedValue(true);

      await resetCredentialsFromKeychain('');

      expect(mockKeyChain.resetInternetCredentials).toHaveBeenCalledWith({
        server: '',
      });
    });

    it('should handle special characters in serverUrl', async () => {
      const specialServerUrl =
        'https://api-test.dressipi.com/v1/auth?client=123';
      mockKeyChain.resetInternetCredentials.mockResolvedValue(true);

      await resetCredentialsFromKeychain(specialServerUrl);

      expect(mockKeyChain.resetInternetCredentials).toHaveBeenCalledWith({
        server: specialServerUrl,
      });
    });
  });

  describe('generateUsername (internal function behavior)', () => {
    it('should generate correct username format through getCredentialsFromKeychain', async () => {
      const testClientId = 'my-test-client';
      const expectedUsername = 'dressipi-my-test-client';

      const mockKeychainResponse = {
        username: expectedUsername,
        password: JSON.stringify(mockCredentials),
      };

      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse
      );

      const result = await getCredentialsFromKeychain(
        testClientId,
        mockServerUrl
      );

      expect(result).toEqual(mockCredentials);
    });

    it('should handle empty clientId in username generation', async () => {
      const mockKeychainResponse = {
        username: 'dressipi-',
        password: JSON.stringify(mockCredentials),
      };

      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse
      );

      const result = await getCredentialsFromKeychain('', mockServerUrl);

      expect(result).toEqual(mockCredentials);
    });

    it('should handle clientId with special characters in username', async () => {
      const specialClientId = 'client_123@test.com';
      const expectedUsername = 'dressipi-client_123@test.com';

      const mockKeychainResponse = {
        username: expectedUsername,
        password: JSON.stringify(mockCredentials),
      };

      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse
      );

      const result = await getCredentialsFromKeychain(
        specialClientId,
        mockServerUrl
      );

      expect(result).toEqual(mockCredentials);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete flow: set, get, reset', async () => {
      // Setup mocks for complete flow
      mockKeyChain.setInternetCredentials.mockResolvedValue(true);

      const mockKeychainResponse = {
        username: 'dressipi-test-client-123',
        password: JSON.stringify(mockCredentials),
      };
      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse
      );
      mockKeyChain.resetInternetCredentials.mockResolvedValue(true);

      // 1. Set credentials
      await setCredentialsToKeychain(mockClientId, mockServerUrl, mockToken);
      expect(mockKeyChain.setInternetCredentials).toHaveBeenCalled();

      // 2. Get credentials
      const retrievedCredentials = await getCredentialsFromKeychain(
        mockClientId,
        mockServerUrl
      );
      expect(retrievedCredentials).toEqual(mockCredentials);

      // 3. Reset credentials
      await resetCredentialsFromKeychain(mockServerUrl);
      expect(mockKeyChain.resetInternetCredentials).toHaveBeenCalled();
    });

    it('should handle multiple client IDs with same server', async () => {
      const clientId1 = 'client-1';
      const clientId2 = 'client-2';
      const credentials1 = { ...mockCredentials, access_token: 'token-1' };
      const credentials2 = { ...mockCredentials, access_token: 'token-2' };

      // Mock responses for different clients
      mockKeyChain.getInternetCredentials
        .mockResolvedValueOnce({
          username: 'dressipi-client-1',
          password: JSON.stringify(credentials1),
        })
        .mockResolvedValueOnce({
          username: 'dressipi-client-2',
          password: JSON.stringify(credentials2),
        });

      const result1 = await getCredentialsFromKeychain(
        clientId1,
        mockServerUrl
      );
      const result2 = await getCredentialsFromKeychain(
        clientId2,
        mockServerUrl
      );

      expect(result1).toEqual(credentials1);
      expect(result2).toEqual(credentials2);
    });

    it('should handle real-world credential structure', async () => {
      const realWorldCredentials = {
        access_token:
          'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsInN1Ym4iOiJ0ZXN0LW5ldHdvcmsiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTkxNjIzOTAyMn0.test',
        refresh_token: 'refresh_token_abc123def456',
        token_type: 'Bearer',
        expires_in: 7200,
        scope: 'read write admin',
        issued_at: 1516239022,
      };

      const mockKeychainResponse = {
        username: 'dressipi-prod-client-456',
        password: JSON.stringify(realWorldCredentials),
      };

      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse
      );

      const result = await getCredentialsFromKeychain(
        'prod-client-456',
        mockServerUrl
      );

      expect(result).toEqual(realWorldCredentials);
    });
  });

  describe('error edge cases', () => {
    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockKeyChain.getInternetCredentials.mockRejectedValue(timeoutError);

      const result = await getCredentialsFromKeychain(
        mockClientId,
        mockServerUrl
      );

      expect(result).toBeNull();
    });

    it('should handle keychain access denied gracefully', async () => {
      const accessError = new Error('Access denied to keychain');
      mockKeyChain.getInternetCredentials.mockRejectedValue(accessError);

      const result = await getCredentialsFromKeychain(
        mockClientId,
        mockServerUrl
      );

      expect(result).toBeNull();
    });

    it('should handle corrupted keychain data gracefully', async () => {
      const mockKeychainResponse = {
        username: 'dressipi-test-client-123',
        password: '{"access_token": "incomplete_json"', // Malformed JSON
      };

      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse
      );

      const result = await getCredentialsFromKeychain(
        mockClientId,
        mockServerUrl
      );

      expect(result).toBeNull();
    });
  });
});
