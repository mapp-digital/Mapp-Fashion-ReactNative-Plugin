import { useCallback, useEffect, useState } from "react";
import { authenticate, refreshToken } from "../services/auth";
import { AuthCredentials } from "../types/auth";
import { accessTokenHasExpired, getNetworkUserId } from "../utils/jwt";
import { getCredentialsFromKeychain, setCredentialsToKeychain } from "../utils/keychain";

interface AuthError {
  message: string;
  code?: string;
}

interface AuthState {
  credentials: AuthCredentials | null;
  networkUserId: string | null;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
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
   * This state includes:
   * - credentials: The authentication credentials if available.
   * - networkUserId: The user ID from the access token.
   * - isAuthenticating: A boolean indicating if authentication is in progress.
   * - isAuthenticated: A boolean indicating if the user is authenticated.
   * - error: Any error that occurred during authentication.
   */
  const [state, setState] = useState<AuthState>({
    credentials: null,
    networkUserId: null,
    isAuthenticating: false,
    isAuthenticated: false,
    error: null,
  });

  /**
   * Callback to set the authentication state as successful.
   * This function updates the state with the provided credentials,
   * extracts the user ID from the credentials, and resets any error.
   */
  const setAuthenticationSuccess = useCallback(
    (credentials: AuthCredentials) => {
      const userId = getNetworkUserId(credentials);

      setState((prevState) => ({
        ...prevState,
        isAuthenticated: true,
        credentials,
        networkUserId: userId,
        error: null,
      }));
    }, []
  );

  /**
   * Callback to set the authentication state as failed.
   * This function updates the state with the provided error,
   * sets isAuthenticating to false, and resets credentials and user ID.
   */
  const setAuthenticationError = useCallback(
    (error: AuthError) => {
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        error,
      }));
    }, []
  );

  /**
   * Callback to save the authentication credentials to the keychain.
   * This function serializes the credentials and stores them using
   * the provided client ID and domain.
   */
  const saveCredentialsToKeychain = useCallback(
    (authCredentials: AuthCredentials) => {
      setCredentialsToKeychain(
        clientId, 
        domain, 
        JSON.stringify(authCredentials)
      );
    },
    [clientId, domain]
  );

  /**
   * Function to refresh the authentication token.
   * This function checks if credentials are available, attempts to
   * refresh the token using the provided client ID and domain,
   * and updates the state with the refreshed credentials.
   */
  const refresh = useCallback(async() => {
    /**
     * Check if credentials are available before attempting to refresh.
     * If not, set an error indicating that no credentials are available.
     */
    if (!state.credentials) {
      setAuthenticationError({ message: "No credentials available for refresh" });
      return;
    }

    try {
      /**
       * Attempt to refresh the authentication token using the
       * provided client ID and domain. This function is expected to
       * return new credentials if successful.
       */
      const refreshedCredentials = await refreshToken(
        state.credentials, 
        clientId, 
        domain
      );

      /**
       * If the refresh is successful, update the state with the
       * refreshed credentials, and save the credentials to the keychain.
       */
      setAuthenticationSuccess(refreshedCredentials);
      saveCredentialsToKeychain(refreshedCredentials);
    } catch (error) {
      /**
       * If an error occurs during the refresh process, set the
       * authentication error with the error message and code.
       */
      setAuthenticationError({
        message: error instanceof Error 
          ? error.message 
          : "Token refresh failed",
        code: "REFRESH_ERROR",
      });
    } finally {
      /**
       * Regardless of success or failure, set isAuthenticating to false
       * to indicate that the refresh process has completed.
       */
      setState(prev => ({ ...prev, isAuthenticating: false }));
    }
  }, [
    state.credentials, 
    clientId,
    domain,
    setAuthenticationSuccess,
    setAuthenticationError,
    saveCredentialsToKeychain,
  ])

  /**
   * Effect hook to handle the authentication process 
   * when the component mounts.
   */
  useEffect(() => {
    /**
     * Function to handle the authentication process.
     */
    const handleAuthentication = async () => {
      setState(previous => ({ ...previous, isAuthenticating: true }));

      try {
        const existingAuthCredentials = 
          await getCredentialsFromKeychain(clientId, domain);

          if (
            existingAuthCredentials
            && !accessTokenHasExpired(existingAuthCredentials)
          ) {
            setAuthenticationSuccess(existingAuthCredentials);
            return;
          }

          const resultingCredentials = existingAuthCredentials
            ? await refreshToken(existingAuthCredentials, clientId, domain)
            : await authenticate(clientId, domain);

          setAuthenticationSuccess(resultingCredentials);
          saveCredentialsToKeychain(resultingCredentials);
      } catch (error) {
        setAuthenticationError({
          message: error instanceof Error 
            ? error.message
             : "Authentication failed",
          code: "AUTH_ERROR",
        });
      } finally {
        setState(previous => ({ ...previous, isAuthenticating: false }));
      }
    }

    handleAuthentication();
  }, [
    clientId, 
    domain, 
    setAuthenticationSuccess, 
    setAuthenticationError, 
    saveCredentialsToKeychain,
    setState
  ]);

  return {
    isAuthenticating: state.isAuthenticating, 
    isAuthenticated: state.isAuthenticated, 
    credentials: state.credentials, 
    networkUserId: state.networkUserId, 
    error: state.error,
    refresh,
  };
};