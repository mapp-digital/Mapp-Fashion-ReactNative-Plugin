import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../../hooks/useAuth';
import * as authService from '../../../services/auth';
import { AuthCredentials } from '../../../types/auth';
import { SecureStorageAdapter } from '../../../types/keychain';
import * as jwtUtils from '../../../utils/jwt';

// Mock all dependencies
vi.mock('../../../services/auth');
vi.mock('../../../utils/jwt');

const mockedAuthService = vi.mocked(authService);
const mockedJwtUtils = vi.mocked(jwtUtils);

describe('useAuth hook', () => {
  const mockClientId = 'test-client-id';
  const mockDomain = 'api.dressipi.com';

  const mockCredentials: AuthCredentials = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'Bearer',
    expires_in: 3600,
  };

  const mockNetworkUserId = 'user123';
  let mockStorageAdapter: SecureStorageAdapter;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock storage adapter
    mockStorageAdapter = {
      getCredentials: vi.fn(),
      setCredentials: vi.fn(),
      removeCredentials: vi.fn(),
    };

    // Default mock returns
    mockedJwtUtils.accessTokenHasExpired.mockReturnValue(false);
    mockedJwtUtils.getNetworkUserId.mockReturnValue(mockNetworkUserId);
    mockStorageAdapter.getCredentials = vi.fn().mockResolvedValue(null);
    mockStorageAdapter.setCredentials = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial authentication flow', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() =>
        useAuth(mockClientId, mockDomain, mockStorageAdapter)
      );

      expect(result.current.isAuthenticating).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.credentials).toBe(null);
      expect(result.current.networkUserId).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should authenticate successfully when no existing credentials', async () => {
      mockedAuthService.authenticate.mockResolvedValue(mockCredentials);

      const { result } = renderHook(() =>
        useAuth(mockClientId, mockDomain, mockStorageAdapter)
      );

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.credentials).toEqual(mockCredentials);
      expect(result.current.networkUserId).toBe(mockNetworkUserId);
      expect(result.current.error).toBe(null);

      expect(mockStorageAdapter.getCredentials).toHaveBeenCalledWith(
        mockClientId,
        mockDomain
      );
      expect(mockedAuthService.authenticate).toHaveBeenCalledWith(
        mockClientId,
        mockDomain
      );
      expect(mockStorageAdapter.setCredentials).toHaveBeenCalledWith(
        mockClientId,
        mockDomain,
        JSON.stringify(mockCredentials)
      );
    });

    it('should use existing valid credentials from keychain', async () => {
      mockStorageAdapter.getCredentials = vi
        .fn()
        .mockResolvedValue(mockCredentials);
      mockedJwtUtils.accessTokenHasExpired.mockReturnValue(false);

      const { result } = renderHook(() =>
        useAuth(mockClientId, mockDomain, mockStorageAdapter)
      );

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.credentials).toEqual(mockCredentials);
      expect(result.current.networkUserId).toBe(mockNetworkUserId);

      expect(mockedAuthService.authenticate).not.toHaveBeenCalled();
      expect(mockedJwtUtils.accessTokenHasExpired).toHaveBeenCalledWith(
        mockCredentials
      );
    });

    it('should refresh expired credentials from keychain', async () => {
      const expiredCredentials = { ...mockCredentials, expires_in: 0 };
      const refreshedCredentials = {
        ...mockCredentials,
        access_token: 'refreshed-token',
      };

      mockStorageAdapter.getCredentials = vi
        .fn()
        .mockResolvedValue(expiredCredentials);
      mockedJwtUtils.accessTokenHasExpired.mockReturnValue(true);
      mockedAuthService.refreshToken.mockResolvedValue(refreshedCredentials);

      const { result } = renderHook(() =>
        useAuth(mockClientId, mockDomain, mockStorageAdapter)
      );

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.credentials).toEqual(refreshedCredentials);

      expect(mockedAuthService.refreshToken).toHaveBeenCalledWith(
        expiredCredentials,
        mockClientId,
        mockDomain
      );
      expect(mockStorageAdapter.setCredentials).toHaveBeenCalledWith(
        mockClientId,
        mockDomain,
        JSON.stringify(refreshedCredentials)
      );
    });
  });

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed');
      mockedAuthService.authenticate.mockRejectedValue(authError);

      const { result } = renderHook(() =>
        useAuth(mockClientId, mockDomain, mockStorageAdapter)
      );

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.credentials).toBe(null);
      expect(result.current.networkUserId).toBe(null);
      expect(result.current.error).toEqual({
        message: 'Authentication failed',
        code: 'AUTH_ERROR',
      });
    });

    it('should handle non-Error objects in authentication', async () => {
      mockedAuthService.authenticate.mockRejectedValue('String error');

      const { result } = renderHook(() =>
        useAuth(mockClientId, mockDomain, mockStorageAdapter)
      );

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      expect(result.current.error).toEqual({
        message: 'Authentication failed',
        code: 'AUTH_ERROR',
      });
    });

    it('should handle refresh token errors during initial load', async () => {
      const expiredCredentials = { ...mockCredentials, expires_in: 0 };
      const refreshError = new Error('Refresh failed');

      mockStorageAdapter.getCredentials = vi
        .fn()
        .mockResolvedValue(expiredCredentials);
      mockedJwtUtils.accessTokenHasExpired.mockReturnValue(true);
      mockedAuthService.refreshToken.mockRejectedValue(refreshError);

      const { result } = renderHook(() =>
        useAuth(mockClientId, mockDomain, mockStorageAdapter)
      );

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toEqual({
        message: 'Refresh failed',
        code: 'AUTH_ERROR',
      });
    });

    it('should handle keychain errors gracefully', async () => {
      mockStorageAdapter.getCredentials = vi
        .fn()
        .mockRejectedValue(new Error('Keychain error'));

      const { result } = renderHook(() =>
        useAuth(mockClientId, mockDomain, mockStorageAdapter)
      );

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      expect(result.current.error).toEqual({
        message: 'Keychain error',
        code: 'AUTH_ERROR',
      });
    });
  });

  describe('refresh function', () => {
    it('should not refresh when already authenticating', async () => {
      mockStorageAdapter.getCredentials = vi
        .fn()
        .mockResolvedValue(mockCredentials);

      const { result } = renderHook(() =>
        useAuth(mockClientId, mockDomain, mockStorageAdapter)
      );

      // Call refresh while still loading
      await act(async () => {
        await result.current.refresh();
      });

      expect(mockedAuthService.refreshToken).not.toHaveBeenCalled();
    });

    it('should not refresh when no credentials available', async () => {
      // Setup hook with no credentials
      mockedAuthService.authenticate.mockRejectedValue(
        new Error('Auth failed')
      );

      const { result } = renderHook(() =>
        useAuth(mockClientId, mockDomain, mockStorageAdapter)
      );

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      // Try to refresh when no credentials
      await act(async () => {
        await result.current.refresh();
      });

      expect(mockedAuthService.refreshToken).not.toHaveBeenCalled();
    });

    it('should return refresh function', async () => {
      const { result } = renderHook(() =>
        useAuth(mockClientId, mockDomain, mockStorageAdapter)
      );

      expect(typeof result.current.refresh).toBe('function');
    });
  });

  describe('hook dependencies and effects', () => {
    it('should re-authenticate when clientId changes', async () => {
      mockedAuthService.authenticate.mockResolvedValue(mockCredentials);

      const { result, rerender } = renderHook(
        ({ clientId, domain, storageAdapter }) =>
          useAuth(clientId, domain, storageAdapter),
        {
          initialProps: {
            clientId: mockClientId,
            domain: mockDomain,
            storageAdapter: mockStorageAdapter,
          },
        }
      );

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      expect(mockedAuthService.authenticate).toHaveBeenCalledTimes(1);

      // Change clientId
      rerender({
        clientId: 'new-client-id',
        domain: mockDomain,
        storageAdapter: mockStorageAdapter,
      });

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      expect(mockedAuthService.authenticate).toHaveBeenCalledTimes(2);
      expect(mockedAuthService.authenticate).toHaveBeenLastCalledWith(
        'new-client-id',
        mockDomain
      );
    });

    it('should re-authenticate when domain changes', async () => {
      mockedAuthService.authenticate.mockResolvedValue(mockCredentials);

      const { result, rerender } = renderHook(
        ({ clientId, domain, storageAdapter }) =>
          useAuth(clientId, domain, storageAdapter),
        {
          initialProps: {
            clientId: mockClientId,
            domain: mockDomain,
            storageAdapter: mockStorageAdapter,
          },
        }
      );

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      expect(mockedAuthService.authenticate).toHaveBeenCalledTimes(1);

      // Change domain
      rerender({
        clientId: mockClientId,
        domain: 'new-api.dressipi.com',
        storageAdapter: mockStorageAdapter,
      });

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      expect(mockedAuthService.authenticate).toHaveBeenCalledTimes(2);
      expect(mockedAuthService.authenticate).toHaveBeenLastCalledWith(
        mockClientId,
        'new-api.dressipi.com'
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete authentication lifecycle', async () => {
      // Start with no credentials and authenticate successfully
      mockedAuthService.authenticate.mockResolvedValue(mockCredentials);

      const { result } = renderHook(() =>
        useAuth(mockClientId, mockDomain, mockStorageAdapter)
      );

      // Initial authentication
      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.credentials).toEqual(mockCredentials);
      expect(result.current.networkUserId).toBe(mockNetworkUserId);
      expect(result.current.error).toBe(null);

      // Verify all expected service calls were made
      expect(mockedAuthService.authenticate).toHaveBeenCalledWith(
        mockClientId,
        mockDomain
      );
      expect(mockStorageAdapter.setCredentials).toHaveBeenCalledWith(
        mockClientId,
        mockDomain,
        JSON.stringify(mockCredentials)
      );
    });

    it('should work with real JWT token structure', async () => {
      const realCredentials: AuthCredentials = {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwic3VibiciOiJ1c2VyMTIzIiwiaWF0IjoxNTE2MjM5MDIyfQ.example',
        refresh_token: 'real-refresh-token',
        token_type: 'Bearer',
        expires_in: 7200,
      };

      mockStorageAdapter.getCredentials = vi
        .fn()
        .mockResolvedValue(realCredentials);
      mockedJwtUtils.getNetworkUserId.mockReturnValue('user123');

      const { result } = renderHook(() =>
        useAuth(mockClientId, mockDomain, mockStorageAdapter)
      );

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false);
      });

      expect(result.current.credentials).toEqual(realCredentials);
      expect(result.current.networkUserId).toBe('user123');
      expect(mockedJwtUtils.getNetworkUserId).toHaveBeenCalledWith(
        realCredentials
      );
    });

    it('should handle concurrent authentication attempts correctly', async () => {
      mockedAuthService.authenticate.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve(mockCredentials), 100)
          )
      );

      // Create separate storage adapters for each test
      const storageAdapter1 = {
        getCredentials: vi.fn().mockResolvedValue(null),
        setCredentials: vi.fn().mockResolvedValue(undefined),
        removeCredentials: vi.fn().mockResolvedValue(undefined),
      };

      const storageAdapter2 = {
        getCredentials: vi.fn().mockResolvedValue(null),
        setCredentials: vi.fn().mockResolvedValue(undefined),
        removeCredentials: vi.fn().mockResolvedValue(undefined),
      };

      // Render multiple hooks simultaneously
      const { result: result1 } = renderHook(() =>
        useAuth(mockClientId, mockDomain, storageAdapter1)
      );
      const { result: result2 } = renderHook(() =>
        useAuth(mockClientId, mockDomain, storageAdapter2)
      );

      await waitFor(() => {
        expect(result1.current.isAuthenticating).toBe(false);
        expect(result2.current.isAuthenticating).toBe(false);
      });

      // Both should have authenticated independently
      expect(result1.current.isAuthenticated).toBe(true);
      expect(result2.current.isAuthenticated).toBe(true);
      expect(mockedAuthService.authenticate).toHaveBeenCalledTimes(2);
    });
  });
});
