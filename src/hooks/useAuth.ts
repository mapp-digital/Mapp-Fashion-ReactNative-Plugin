import { useCallback, useEffect, useState } from "react";
import { authenticate, refreshToken } from "../services/auth";
import { AuthCredentials } from "../types/auth";
import { accessTokenHasExpired, getNetworkUserId } from "../utils/jwt";
import { getCredentialsFromKeychain, setCredentialsToKeychain } from "../utils/keychain";

/**
 * Custom hook to handle authentication with the Dressipi API.
 *
 * @param {string} clientId - The client ID for the Dressipi API.
 * @param {string} domain - The domain of the Dressipi API.
 */
export const useAuth = (clientId: string, domain: string) => {
  /**
   * State variables to manage authentication status and credentials.
   * - `credentials`: Stores the authentication credentials.
   * - `networkUserId`: Stores the user ID from the access token.
   * - `isAuthenticating`: Indicates whether the authentication process is ongoing.
   * - `isAuthenticated`: Indicates whether the user is authenticated.
   */
  const [credentials, setCredentials] = useState<AuthCredentials | null>(null);
  const [networkUserId, setNetworkUserId] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const refreshTokenCallback = useCallback(() => {
    /**
     * Function to handle the refresh token process.
     */
    const handleRefreshTokenProcess = async () => {
      if (!credentials) {
        return;
      }

      /**
       * Fetch the refreshed authentication credentials using the
       * existing credentials, client ID, and domain.
       */
      const refreshedAuthCredentials = 
        await refreshToken(credentials, clientId, domain);

      /**
       * Set the state to indicate that the user is authenticated,
       * update the credentials and user ID, and store the refreshed
       * credentials in the keychain.
       */
      setIsAuthenticated(true);
      setCredentials(refreshedAuthCredentials);
      setNetworkUserId(getNetworkUserId(refreshedAuthCredentials));
      setCredentialsToKeychain(
        clientId,
        domain,
        JSON.stringify(refreshedAuthCredentials)
      );
    };

    /**
     * Call the function to handle the refresh token process.
     */
    handleRefreshTokenProcess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentials])

  /**
   * This effect will run when the clientId or domain changes.
   */
  useEffect(() => {
    setIsAuthenticating(true);
    
    /**
     * Create an function to handle the async authentication process inside
     * the useEffect hook.
     */
    const handleAuthenticationProcess = async () => {
      if (isAuthenticating) {
        return;
      }

      /**
       * Retrieve existing credentials from the keychain.
       */
      const existingAuthCredentials: AuthCredentials | null = 
        await getCredentialsFromKeychain(clientId, domain);

      /**
       * If existing credentials are found and the access token has not expired,
       * set the credentials and user ID and mark as authenticated, 
       * finishing the authentication process early.
       */
      if (
        existingAuthCredentials 
        && !accessTokenHasExpired(existingAuthCredentials)
      ) {
        /**
         * Set the state to indicate that the user is authenticated
         * and store the existing credentials and user ID.
         */
        setIsAuthenticated(true);
        setCredentials(existingAuthCredentials);
        setNetworkUserId(getNetworkUserId(existingAuthCredentials));

        return existingAuthCredentials;
      }
      
      /**
       * This block will run if no existing credentials are found or if the
       * access token has expired.
       * In case there are existing credentials, we will refresh the token,
       * otherwise we will authenticate the user.
       */
      const resultingAuthCredentials: AuthCredentials = existingAuthCredentials
        ? await refreshToken(existingAuthCredentials, clientId, domain)
        : await authenticate(clientId, domain);

      /**
       * Set the resulting credentials and user ID, mark as authenticated,
       * and store the credentials in the keychain.
       */
      setIsAuthenticated(true);
      setCredentials(resultingAuthCredentials);
      setNetworkUserId(getNetworkUserId(resultingAuthCredentials));
      setCredentialsToKeychain(
        clientId, 
        domain, 
        JSON.stringify(resultingAuthCredentials)
      );
    };

    /**
     * Call the async function to handle the authentication process.
     */
    handleAuthenticationProcess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, domain]);

  return {
    isAuthenticating, 
    isAuthenticated, 
    credentials, 
    networkUserId, 
    refresh: refreshTokenCallback,
  };
};