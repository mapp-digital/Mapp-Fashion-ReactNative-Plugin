import * as KeyChain from 'react-native-keychain';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KeyChainAdapter } from '../../../keychain/KeyChainAdapter';
import type { AuthCredentials } from '../../../types/auth';

// Mock react-native-keychain
const mockKeyChain = KeyChain as any;

describe('KeyChainAdapter', () => {
  let adapter: KeyChainAdapter;
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
    adapter = new KeyChainAdapter();
    vi.clearAllMocks();
  });

  describe('getCredentials', () => {
    it('should return credentials when found with matching username', async () => {
      const mockKeychainResponse = {
        username: 'dressipi-test-client-123',
        password: JSON.stringify(mockCredentials),
        service: mockServerUrl,
        storage: 'keychain' as const,
      };

      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse as any
      );

      const result = await adapter.getCredentials(mockClientId, mockServerUrl);

      expect(mockKeyChain.getInternetCredentials).toHaveBeenCalledWith(
        mockServerUrl
      );
      expect(result).toEqual(mockCredentials);
    });

    it('should return null when no credentials found in keychain', async () => {
      mockKeyChain.getInternetCredentials.mockResolvedValue(false);

      const result = await adapter.getCredentials(mockClientId, mockServerUrl);

      expect(mockKeyChain.getInternetCredentials).toHaveBeenCalledWith(
        mockServerUrl
      );
      expect(result).toBeNull();
    });

    it('should return null when username does not match expected format', async () => {
      const mockKeychainResponse = {
        username: 'wrong-username',
        password: JSON.stringify(mockCredentials),
      };

      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse
      );

      const result = await adapter.getCredentials(mockClientId, mockServerUrl);

      expect(result).toBeNull();
    });

    it('should return null when password contains invalid JSON', async () => {
      const mockKeychainResponse = {
        username: 'dressipi-test-client-123',
        password: 'invalid-json-string',
      };

      mockKeyChain.getInternetCredentials.mockResolvedValue(
        mockKeychainResponse
      );

      const result = await adapter.getCredentials(mockClientId, mockServerUrl);

      expect(result).toBeNull();
    });

    it('should return null when keychain throws an error', async () => {
      mockKeyChain.getInternetCredentials.mockRejectedValue(
        new Error('Keychain error')
      );

      const result = await adapter.getCredentials(mockClientId, mockServerUrl);

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

      const result = await adapter.getCredentials('', mockServerUrl);

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

      const result = await adapter.getCredentials(
        specialClientId,
        mockServerUrl
      );

      expect(result).toEqual(mockCredentials);
    });

    it('should handle credentials with additional properties', async () => {
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

      const result = await adapter.getCredentials(mockClientId, mockServerUrl);

      expect(result).toEqual(extendedCredentials);
    });

    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockKeyChain.getInternetCredentials.mockRejectedValue(timeoutError);

      const result = await adapter.getCredentials(mockClientId, mockServerUrl);

      expect(result).toBeNull();
    });

    it('should handle keychain access denied gracefully', async () => {
      const accessError = new Error('Access denied to keychain');
      mockKeyChain.getInternetCredentials.mockRejectedValue(accessError);

      const result = await adapter.getCredentials(mockClientId, mockServerUrl);

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

      const result = await adapter.getCredentials(mockClientId, mockServerUrl);

      expect(result).toBeNull();
    });
  });

  describe('setCredentials', () => {
    it('should successfully set credentials to keychain', async () => {
      mockKeyChain.setInternetCredentials.mockResolvedValue(true);

      await adapter.setCredentials(mockClientId, mockServerUrl, mockToken);

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
      await adapter.setCredentials('', mockServerUrl, mockToken);

      expect(mockKeyChain.setInternetCredentials).not.toHaveBeenCalled();
    });

    it('should not attempt to set credentials when clientId is null/undefined', async () => {
      await adapter.setCredentials(null as any, mockServerUrl, mockToken);
      expect(mockKeyChain.setInternetCredentials).not.toHaveBeenCalled();

      await adapter.setCredentials(undefined as any, mockServerUrl, mockToken);
      expect(mockKeyChain.setInternetCredentials).not.toHaveBeenCalled();
    });

    it('should not attempt to set credentials when serverUrl is empty', async () => {
      await adapter.setCredentials(mockClientId, '', mockToken);

      expect(mockKeyChain.setInternetCredentials).not.toHaveBeenCalled();
    });

    it('should not attempt to set credentials when serverUrl is null/undefined', async () => {
      await adapter.setCredentials(mockClientId, null as any, mockToken);
      expect(mockKeyChain.setInternetCredentials).not.toHaveBeenCalled();

      await adapter.setCredentials(mockClientId, undefined as any, mockToken);
      expect(mockKeyChain.setInternetCredentials).not.toHaveBeenCalled();
    });

    it('should throw error when keychain operation fails', async () => {
      const keychainError = new Error('Keychain access denied');
      mockKeyChain.setInternetCredentials.mockRejectedValue(keychainError);

      await expect(
        adapter.setCredentials(mockClientId, mockServerUrl, mockToken)
      ).rejects.toThrow(
        'Could not set Dressipi credentials to keychain: Keychain access denied'
      );

      expect(mockKeyChain.setInternetCredentials).toHaveBeenCalled();
    });

    it('should handle empty token gracefully', async () => {
      mockKeyChain.setInternetCredentials.mockResolvedValue(true);

      await adapter.setCredentials(mockClientId, mockServerUrl, '');

      expect(mockKeyChain.setInternetCredentials).toHaveBeenCalledWith(
        mockServerUrl,
        'dressipi-test-client-123',
        '',
        {
          securityLevel: KeyChain.SECURITY_LEVEL.SECURE_SOFTWARE,
        }
      );
    });

    it('should handle special characters in clientId during set', async () => {
      const specialClientId = 'client_123@test.com';
      mockKeyChain.setInternetCredentials.mockResolvedValue(true);

      await adapter.setCredentials(specialClientId, mockServerUrl, mockToken);

      expect(mockKeyChain.setInternetCredentials).toHaveBeenCalledWith(
        mockServerUrl,
        'dressipi-client_123@test.com',
        mockToken,
        {
          securityLevel: KeyChain.SECURITY_LEVEL.SECURE_SOFTWARE,
        }
      );
    });
  });

  describe('removeCredentials', () => {
    it('should successfully remove credentials from keychain', async () => {
      mockKeyChain.resetInternetCredentials.mockResolvedValue(true);

      await adapter.removeCredentials(mockServerUrl);

      expect(mockKeyChain.resetInternetCredentials).toHaveBeenCalledWith({
        server: mockServerUrl,
      });
    });

    it('should handle keychain remove errors by propagating them', async () => {
      mockKeyChain.resetInternetCredentials.mockRejectedValue(
        new Error('Could not reset credentials')
      );

      await expect(adapter.removeCredentials(mockServerUrl)).rejects.toThrow(
        'Could not reset credentials'
      );
    });

    it('should handle empty serverUrl gracefully', async () => {
      mockKeyChain.resetInternetCredentials.mockResolvedValue(true);

      await adapter.removeCredentials('');

      expect(mockKeyChain.resetInternetCredentials).toHaveBeenCalledWith({
        server: '',
      });
    });

    it('should handle special server URLs', async () => {
      const specialServerUrl = 'https://api-test.example.com:8080/path';
      mockKeyChain.resetInternetCredentials.mockResolvedValue(true);

      await adapter.removeCredentials(specialServerUrl);

      expect(mockKeyChain.resetInternetCredentials).toHaveBeenCalledWith({
        server: specialServerUrl,
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete flow: set, get, remove', async () => {
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
      await adapter.setCredentials(mockClientId, mockServerUrl, mockToken);
      expect(mockKeyChain.setInternetCredentials).toHaveBeenCalled();

      // 2. Get credentials
      const retrievedCredentials = await adapter.getCredentials(
        mockClientId,
        mockServerUrl
      );
      expect(retrievedCredentials).toEqual(mockCredentials);

      // 3. Remove credentials
      await adapter.removeCredentials(mockServerUrl);
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

      const result1 = await adapter.getCredentials(clientId1, mockServerUrl);
      const result2 = await adapter.getCredentials(clientId2, mockServerUrl);

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

      const result = await adapter.getCredentials(
        'prod-client-456',
        mockServerUrl
      );

      expect(result).toEqual(realWorldCredentials);
    });

    it('should properly isolate different server URLs', async () => {
      const serverUrl1 = 'https://api.dressipi.com';
      const serverUrl2 = 'https://staging-api.dressipi.com';

      mockKeyChain.setInternetCredentials.mockResolvedValue(true);

      // Set credentials for different servers
      await adapter.setCredentials(mockClientId, serverUrl1, 'token1');
      await adapter.setCredentials(mockClientId, serverUrl2, 'token2');

      expect(mockKeyChain.setInternetCredentials).toHaveBeenCalledTimes(2);
      expect(mockKeyChain.setInternetCredentials).toHaveBeenCalledWith(
        serverUrl1,
        'dressipi-test-client-123',
        'token1',
        expect.any(Object)
      );
      expect(mockKeyChain.setInternetCredentials).toHaveBeenCalledWith(
        serverUrl2,
        'dressipi-test-client-123',
        'token2',
        expect.any(Object)
      );
    });
  });
});
