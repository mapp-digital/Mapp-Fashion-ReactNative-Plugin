import { useCallback, useEffect, useState } from 'react';
import { authenticate, refreshToken } from '../services/auth';
import { AuthInternalState, AuthState } from '../types/auth';
import { SecureStorageAdapter } from '../types/keychain';
import { accessTokenHasExpired, getNetworkUserId } from '../utils/jwt';
import { Log } from '../utils/logger';

/**
 * Custom hook to handle authentication with the Dressipi API.
 *
 * @param {string} clientId - The client ID for the Dressipi API.
 * @param {string} domain - The domain of the Dressipi API.
 * @param {SecureStorageAdapter} storageAdapter - The storage adapter to use for credentials.
 * @param {boolean} shouldAuthenticate - Whether authentication should be performed. Defaults to true.
 * @return {AuthState} An object containing the authentication state.
 */
export const useAuth = (
  clientId: string,
  domain: string,
  storageAdapter: SecureStorageAdapter,
  shouldAuthenticate: boolean = true
): AuthState => {
  /**
   * State to manage authentication status, credentials, and errors.
   */
  const [state, setState] = useState<AuthInternalState>({
    credentials: null,
    networkUserId: null,
    isAuthenticating: false,
    isAuthenticated: false,
    error: null,
  });

  /**
   * Function to refresh the authentication token.
   * This function checks if credentials are available, attempts to
   * refresh the token using the provided client ID and domain,
   * and updates the state with the refreshed credentials.
   */
  const refresh = useCallback(async () => {
    /**
     * Exit early if authentication is disabled
     */
    if (!shouldAuthenticate) {
      return;
    }

    /**
     * Check if an user is already authenticating or if credentials are not set.
     * If either condition is true, exit the function early to avoid
     * unnecessary refresh attempts.
     */
    if (state.isAuthenticating || !state.credentials) {
      return;
    }

    try {
      /**
       * Attempt to refresh the authentication token using the
       * provided client ID and domain.
       */
      const refreshedCredentials = await refreshToken(
        state.credentials,
        clientId,
        domain
      );

      /**
       * If the refresh is successful, update the state with the
       * new credentials.
       */
      setState(previous => ({
        ...previous,
        isAuthenticated: true,
        credentials: refreshedCredentials,
        networkUserId: getNetworkUserId(refreshedCredentials),
        error: null,
      }));

      /**
       * Save the refreshed credentials using the storage adapter for future use.
       */
      await storageAdapter.setCredentials(
        clientId,
        domain,
        JSON.stringify(refreshedCredentials)
      );
    } catch (error) {
      /**
       * If an error occurs during the refresh process, set the
       * authentication error with the error message and code.
       */
      setState(previous => ({
        ...previous,
        isAuthenticated: false,
        credentials: null,
        networkUserId: null,
        error: {
          message:
            error instanceof Error ? error.message : 'Token refresh failed',
          code: 'REFRESH_ERROR',
        },
      }));
    } finally {
      /**
       * Regardless of success or failure, set isAuthenticating to false
       * to indicate that the refresh process has completed.
       */
      setState(previous => ({ ...previous, isAuthenticating: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, domain, storageAdapter, shouldAuthenticate]);

  /**
   * Effect hook to handle the authentication process
   * when the component mounts.
   */
  useEffect(() => {
    /**
     * Skip authentication if shouldAuthenticate is false
     */
    if (!shouldAuthenticate) {
      Log.info(
        'Authentication skipped - user consent not provided',
        'useAuth.ts'
      );
      return;
    }

    /**
     * Function to handle the authentication process.
     */
    const handleAuthentication = async () => {
      /**
       * Set the initial state to indicate that authentication is in progress.
       */
      setState(previous => ({
        ...previous,
        isAuthenticating: true,
        error: null,
      }));

      try {
        /**
         * Attempt to retrieve existing credentials using the storage adapter.
         */
        const existingAuthCredentials = await storageAdapter.getCredentials(
          clientId,
          domain
        );

        /**
         * If existing credentials are found and its access token
         * has not expired, update the state to indicate that the user
         * is authenticated.
         */
        if (
          existingAuthCredentials &&
          !accessTokenHasExpired(existingAuthCredentials)
        ) {
          Log.info(
            `Existing credentials found for clientId: ${clientId}, domain: ${domain}.`,
            'useAuth.ts',
            {
              access_token: existingAuthCredentials.access_token,
            }
          );

          setState(previous => ({
            ...previous,
            isAuthenticated: true,
            credentials: existingAuthCredentials,
            networkUserId: getNetworkUserId(existingAuthCredentials),
            error: null,
          }));

          return;
        }

        Log.info(
          `No credentials found for clientId: ${clientId}, domain: ${domain}. Authenticating...`,
          'useAuth.ts'
        );

        /**
         * If no existing credentials are found or the access token has expired,
         * attempt to authenticate the user using the provided
         * client ID and domain.
         */
        const resultingCredentials = existingAuthCredentials
          ? await refreshToken(existingAuthCredentials, clientId, domain)
          : await authenticate(clientId, domain);

        /**
         * If authentication is successful, update the state
         * with the new credentials and user ID.
         */
        setState(previous => ({
          ...previous,
          isAuthenticated: true,
          credentials: resultingCredentials,
          networkUserId: getNetworkUserId(resultingCredentials),
          error: null,
        }));

        Log.info(
          `Setting credentials to storage for clientId: ${clientId}, domain: ${domain}.`,
          'useAuth.ts'
        );

        /**
         * Save the resulting credentials using the storage adapter for future use.
         */
        await storageAdapter.setCredentials(
          clientId,
          domain,
          JSON.stringify(resultingCredentials)
        );
      } catch (error) {
        /**
         * If an error occurs during authentication, set the
         * authentication error with the error message and code.
         */
        setState(previous => ({
          ...previous,
          isAuthenticated: false,
          credentials: null,
          networkUserId: null,
          error: {
            message:
              error instanceof Error ? error.message : 'Authentication failed',
            code: 'AUTH_ERROR',
          },
        }));
      } finally {
        /**
         * Regardless of success or failure, set isAuthenticating to false
         * to indicate that the authentication process has completed.
         */
        setState(previous => ({ ...previous, isAuthenticating: false }));
      }
    };

    /**
     * Call the function to handle authentication when the component mounts.
     */
    handleAuthentication();
  }, [clientId, domain, storageAdapter, shouldAuthenticate]);

  return {
    isAuthenticating: state.isAuthenticating,
    isAuthenticated: state.isAuthenticated,
    credentials: state.credentials,
    networkUserId: state.networkUserId,
    error: state.error,
    refresh,
  };
};
