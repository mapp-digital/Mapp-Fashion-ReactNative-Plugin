import axios from 'axios';
import uuid from 'react-native-uuid';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticate, refreshToken } from '../../../services/auth';
import { AuthCredentials, AuthorizationResponse } from '../../../types/auth';
import { getNetworkUserId } from '../../../utils/jwt';
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

  const credentialsFor = (
    claims: { sub?: string; subn?: string },
    refresh = 'refresh-token'
  ): AuthCredentials => ({
    ...mockAuthCredentials,
    access_token: `header.${btoa(JSON.stringify({ exp: 9999999999, ...claims }))}.signature`,
    refresh_token: refresh,
  });

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
    it('keeps the issued tracking ID through refreshes and secure-storage round trips when subn is omitted', async () => {
      const issued = credentialsFor({ sub: 'profile-1', subn: 'network-1' });
      const firstResponse = credentialsFor({ sub: 'profile-1' }, 'rotated-1');
      const secondResponse = credentialsFor({ sub: 'profile-1' }, 'rotated-2');
      mockedAxios.get.mockResolvedValueOnce({
        data: mockAuthorizationResponse,
      });
      mockedAxios.post
        .mockResolvedValueOnce({ data: issued })
        .mockResolvedValueOnce({ data: firstResponse })
        .mockResolvedValueOnce({ data: secondResponse });

      const authenticated = await authenticate(mockClientId, mockDomain);
      expect(authenticated.trackingIdentity).toEqual({
        profileId: 'profile-1',
        networkUserId: 'network-1',
      });
      const refreshed = await refreshToken(
        authenticated,
        mockClientId,
        mockDomain
      );
      const reloaded = JSON.parse(JSON.stringify(refreshed));
      expect(reloaded.access_token).toBe(firstResponse.access_token);
      expect(getNetworkUserId(reloaded)).toBe('network-1');
      const refreshedAgain = await refreshToken(
        reloaded,
        mockClientId,
        mockDomain
      );
      expect(getNetworkUserId(JSON.parse(JSON.stringify(refreshedAgain)))).toBe(
        'network-1'
      );
      expect(refreshedAgain.refresh_token).toBe('rotated-2');
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.stringContaining('refresh_token=rotated-1')
      );
      expect(mockedAxios.get).toHaveBeenCalledOnce();
      expect(firstResponse).not.toHaveProperty('trackingIdentity');
    });

    it('retains subn from credentials stored by an earlier SDK version', async () => {
      const original = credentialsFor({ sub: 'profile-1', subn: 'network-1' });
      mockedAxios.post.mockResolvedValueOnce({
        data: credentialsFor({ sub: 'profile-1' }),
      });
      const result = await refreshToken(original, mockClientId, mockDomain);
      expect(getNetworkUserId(result)).toBe('network-1');
      expect(original).not.toHaveProperty('trackingIdentity');
    });

    it('uses a newly issued subn when the refresh supplies one', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: credentialsFor({ sub: 'profile-1', subn: 'network-2' }),
      });
      const result = await refreshToken(
        credentialsFor({ sub: 'profile-1', subn: 'network-1' }),
        mockClientId,
        mockDomain
      );
      expect(getNetworkUserId(result)).toBe('network-2');
      expect(result.trackingIdentity?.networkUserId).toBe('network-2');
    });

    it.each([
      ['different profile', { sub: 'profile-2' }],
      ['missing profile', {}],
      ['empty profile', { sub: '' }],
    ])('does not carry the tracking ID into a %s', async (_, claims) => {
      mockedAxios.post.mockResolvedValueOnce({ data: credentialsFor(claims) });
      const result = await refreshToken(
        credentialsFor({ sub: 'profile-1', subn: 'network-1' }),
        mockClientId,
        mockDomain
      );
      expect(getNetworkUserId(result)).toBeNull();
      expect(result).not.toHaveProperty('trackingIdentity');
    });

    it('leaves tracking unavailable when the profile has never supplied subn', async () => {
      const credentials = credentialsFor({ sub: 'profile-1' });
      mockedAxios.post.mockResolvedValueOnce({ data: credentials });
      const result = await refreshToken(credentials, mockClientId, mockDomain);
      expect(getNetworkUserId(result)).toBeNull();
      expect(result).not.toHaveProperty('trackingIdentity');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

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
