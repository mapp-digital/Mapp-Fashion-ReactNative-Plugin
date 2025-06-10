import axios from 'axios';
import uuid from 'react-native-uuid';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticate, refreshToken } from '../../../services/auth';
import { AuthCredentials, AuthorizationResponse } from '../../../types/auth';
import { pkceChallenge } from '../../../utils/pkce';

// Mock dependencies
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('react-native-uuid', () => ({
  default: {
    v4: vi.fn(),
  },
}));

vi.mock('../../../utils/pkce', () => ({
  pkceChallenge: vi.fn(),
}));

const mockedAxios = axios as any;
const mockedUuid = uuid as any;
const mockedPkceChallenge = pkceChallenge as any;

describe('auth service', () => {
  const mockClientId = 'test-client-id';
  const mockDomain = 'test.dressipi.com';
  const mockStateUuid = 'mock-uuid-1234';
  const mockPkce = {
    codeVerifier: 'mock-code-verifier',
    codeChallenge: 'mock-code-challenge',
  };

  const mockAuthorizationResponse: AuthorizationResponse = {
    code: 'auth-code-123',
    state: mockStateUuid,
  };

  const mockAuthCredentials: AuthCredentials = {
    access_token: 'access-token-123',
    refresh_token: 'refresh-token-123',
    token_type: 'Bearer',
    expires_in: 3600,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUuid.v4.mockReturnValue(mockStateUuid);
    mockedPkceChallenge.mockReturnValue(mockPkce);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('authenticate', () => {
    describe('successful authentication flow', () => {
      beforeEach(() => {
        mockedAxios.get.mockResolvedValueOnce({
          data: mockAuthorizationResponse,
        });
        mockedAxios.post.mockResolvedValueOnce({
          data: mockAuthCredentials,
        });
      });

      it('should complete full authentication flow successfully', async () => {
        const result = await authenticate(mockClientId, mockDomain);
        expect(result).toEqual(mockAuthCredentials);
      });

      it('should call PKCE challenge generator and UUID generator', async () => {
        await authenticate(mockClientId, mockDomain);

        expect(mockedPkceChallenge).toHaveBeenCalledOnce();
        expect(mockedUuid.v4).toHaveBeenCalledOnce();
      });

      it('should make correct authorization and token requests', async () => {
        await authenticate(mockClientId, mockDomain);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          `https://${mockDomain}/api/oauth/authorize?redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob%3Aauto&response_type=code&client_id=${mockClientId}&state=${mockStateUuid}&code_challenge_method=S256&code_challenge=${mockPkce.codeChallenge}`
        );

        expect(mockedAxios.post).toHaveBeenCalledWith(
          `https://${mockDomain}/api/oauth/token?redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob%3Aauto&grant_type=authorization_code&client_id=${mockClientId}&code=${mockAuthorizationResponse.code}&code_verifier=${mockPkce.codeVerifier}`
        );
      });
    });

    describe('error handling', () => {
      it('should throw error when authorization request fails', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

        await expect(authenticate(mockClientId, mockDomain)).rejects.toThrow(
          'There was an error authenticating with Dressipi: Network error'
        );
      });

      it('should throw error when token request fails', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: mockAuthorizationResponse,
        });
        mockedAxios.post.mockRejectedValueOnce(new Error('Token error'));

        await expect(authenticate(mockClientId, mockDomain)).rejects.toThrow(
          'There was an error authenticating with Dressipi: Token error'
        );
      });

      it('should throw error when state mismatch occurs', async () => {
        const mismatchedResponse = {
          ...mockAuthorizationResponse,
          state: 'different-state',
        };

        mockedAxios.get.mockResolvedValueOnce({
          data: mismatchedResponse,
        });

        await expect(authenticate(mockClientId, mockDomain)).rejects.toThrow(
          'State mismatch in Dressipi authentication'
        );
      });

      it('should handle non-Error objects in failures', async () => {
        mockedAxios.get.mockRejectedValueOnce('String error');

        await expect(authenticate(mockClientId, mockDomain)).rejects.toThrow(
          'There was an error authenticating with Dressipi: undefined'
        );
      });
    });

    describe('parameter handling', () => {
      beforeEach(() => {
        mockedAxios.get.mockResolvedValue({ data: mockAuthorizationResponse });
        mockedAxios.post.mockResolvedValue({ data: mockAuthCredentials });
      });

      it('should handle special characters in clientId', async () => {
        const specialClientId = 'client-with-special@chars.test';
        await authenticate(specialClientId, mockDomain);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining(
            `client_id=${encodeURIComponent(specialClientId)}`
          )
        );
      });

      it('should work with different domains', async () => {
        const customDomain = 'custom-api.example.com';
        await authenticate(mockClientId, customDomain);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining(`https://${customDomain}/api/oauth/authorize`)
        );
      });
    });
  });

  describe('refreshToken', () => {
    const mockOutdatedCredentials: AuthCredentials = {
      access_token: 'old-access-token',
      refresh_token: 'old-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    const mockNewCredentials: AuthCredentials = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    describe('successful token refresh', () => {
      beforeEach(() => {
        mockedAxios.post.mockResolvedValueOnce({
          data: mockNewCredentials,
        });
      });

      it('should refresh token successfully', async () => {
        const result = await refreshToken(
          mockOutdatedCredentials,
          mockClientId,
          mockDomain
        );

        expect(result).toEqual(mockNewCredentials);
      });

      it('should make correct refresh request', async () => {
        await refreshToken(mockOutdatedCredentials, mockClientId, mockDomain);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          `https://${mockDomain}/api/oauth/token?redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob%3Aauto&grant_type=refresh_token&client_id=${mockClientId}&refresh_token=${mockOutdatedCredentials.refresh_token}`
        );
      });

      it('should handle special characters in refresh token', async () => {
        const specialCredentials = {
          ...mockOutdatedCredentials,
          refresh_token: 'refresh+token/with=special&chars',
        };

        await refreshToken(specialCredentials, mockClientId, mockDomain);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining(
            `refresh_token=${encodeURIComponent(specialCredentials.refresh_token)}`
          )
        );
      });
    });

    describe('error handling', () => {
      it('should throw error when refresh request fails', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Refresh failed'));

        await expect(
          refreshToken(mockOutdatedCredentials, mockClientId, mockDomain)
        ).rejects.toThrow(
          'There was an error authenticating with Dressipi: Refresh failed'
        );
      });

      it('should handle non-Error objects in refresh failure', async () => {
        mockedAxios.post.mockRejectedValueOnce('String refresh error');

        await expect(
          refreshToken(mockOutdatedCredentials, mockClientId, mockDomain)
        ).rejects.toThrow(
          'There was an error authenticating with Dressipi: undefined'
        );
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete authentication and refresh cycle', async () => {
      // Setup authentication mocks
      mockedAxios.get.mockResolvedValueOnce({
        data: mockAuthorizationResponse,
      });
      mockedAxios.post.mockResolvedValueOnce({ data: mockAuthCredentials });

      // Authenticate first
      const authResult = await authenticate(mockClientId, mockDomain);
      expect(authResult).toEqual(mockAuthCredentials);

      // Setup refresh mock
      const newCredentials = {
        ...mockAuthCredentials,
        access_token: 'refreshed-token',
      };
      mockedAxios.post.mockResolvedValueOnce({ data: newCredentials });

      // Refresh token
      const refreshResult = await refreshToken(
        authResult,
        mockClientId,
        mockDomain
      );
      expect(refreshResult).toEqual(newCredentials);

      // Verify correct number of calls
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2); // token + refresh
    });

    it('should work with real-world credential formats', async () => {
      const realWorldCredentials: AuthCredentials = {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        refresh_token:
          'def50200a8f5b7e8c9d0e1f2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4',
        token_type: 'Bearer',
        expires_in: 7200,
      };

      mockedAxios.post.mockResolvedValueOnce({ data: realWorldCredentials });

      const result = await refreshToken(
        mockAuthCredentials,
        mockClientId,
        mockDomain
      );
      expect(result).toEqual(realWorldCredentials);
    });
  });
});
