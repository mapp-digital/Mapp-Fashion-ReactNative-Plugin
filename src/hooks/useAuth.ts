import { useCallback, useEffect, useState } from "react";
import { authenticate, refreshToken } from "../services/auth";
import { AuthCredentials } from "../types/auth";
import { accessTokenHasExpired, getNetworkUserId } from "../utils/jwt";
import { getCredentialsFromKeychain, setCredentialsToKeychain } from "../utils/keychain";

/**
 * Interface representing the state of authentication.
 * This state includes:
 * - credentials: The authentication credentials if available.
 * - networkUserId: The user ID from the access token.
 * - isAuthenticating: A boolean indicating if authentication is in progress.
 * - isAuthenticated: A boolean indicating if the user is authenticated.
 * - error: Any error that occurred during authentication.
 */
interface AuthState {
  credentials: AuthCredentials | null;
  networkUserId: string | null;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  error: { message: string; code?: string; } | null;
}

/**
 * Custom hook to handle authentication with the Dressipi API.
 *
 * @param {string} clientId - The client ID for the Dressipi API.
 * @param {string} domain - The domain of the Dressipi API.
 */
export const useAuth = (clientId: string, domain: string) => {
  /**
   * State to manage authentication status, credentials, and errors.
   */
  const [state, setState] = useState<AuthState>({
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
  const refresh = useCallback(async() => {
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
       * Save the refreshed credentials to the keychain for future use.
       */
      setCredentialsToKeychain(
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
          message: error instanceof Error 
            ? error.message 
            : "Token refresh failed",
          code: "REFRESH_ERROR",
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
  }, [clientId, domain]);

  /**
   * Effect hook to handle the authentication process 
   * when the component mounts.
   */
  useEffect(() => {
    /**
     * Function to handle the authentication process.
     */
    const handleAuthentication = async () => {
      /**
       * Set the initial state to indicate that authentication is in progress.
       */
      setState(previous => ({ ...previous, isAuthenticating: true, error: null }));

      try {
        /**
         * Attempt to retrieve existing credentials from the keychain.
         */
        const existingAuthCredentials = 
          await getCredentialsFromKeychain(clientId, domain);

        /**
         * If existing credentials are found and its access token 
         * has not expired, update the state to indicate that the user
         * is authenticated.
         */
        if (
          existingAuthCredentials
          && !accessTokenHasExpired(existingAuthCredentials)
        ) {
          setState(previous => ({
            ...previous,
            isAuthenticated: true,
            credentials: existingAuthCredentials,
            networkUserId: getNetworkUserId(existingAuthCredentials),
            error: null,
          }));

          return;
        }

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

        /**
         * Save the resulting credentials to the keychain for future use.
         */
        setCredentialsToKeychain(
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
            message: error instanceof Error ? error.message : "Authentication failed",
            code: "AUTH_ERROR",
          },
        }));
      } finally {
        /**
         * Regardless of success or failure, set isAuthenticating to false
         * to indicate that the authentication process has completed.
         */
        setState(previous => ({ ...previous, isAuthenticating: false }));
      }
    }

    /**
     * Call the function to handle authentication when the component mounts.
     */
    handleAuthentication();
  }, [clientId, domain]);

  return {
    isAuthenticating: state.isAuthenticating, 
    isAuthenticated: state.isAuthenticated, 
    credentials: state.credentials, 
    networkUserId: state.networkUserId, 
    error: state.error,
    refresh,
  };
};