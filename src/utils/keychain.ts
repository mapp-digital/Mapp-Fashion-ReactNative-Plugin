import * as KeyChain from 'react-native-keychain';
import { AuthCredentials } from '../types/auth';

/**
 * Retrieves the Dressipi credentials from the keychain.
 * 
 * @param clientId - The client ID for the Dressipi API.
 * @param serverUrl - The server URL for the Dressipi API.
 * @return {Promise<AuthCredentials | null>} - A promise that resolves to the
 * Dressipi credentials or null if not found.
 */
export const getCredentialsFromKeychain = async (
  clientId: string, 
  serverUrl: string
): Promise<AuthCredentials | null> => {
  try {
    /**
     * Retrieve the Dressipi credentials from the keychain using the provided
     * serverUrl.
     */
    const credentials: KeyChain.UserCredentials | false = 
      await KeyChain.getInternetCredentials(serverUrl);

    /**
     * If the credentials are not found or the username does not match the
     * generated username based on the clientId, return null.
     */
    if (!credentials || generateUsername(clientId) !== credentials.username) {
      return null;
    }

    /**
     * If the credentials are found, return them as an AuthCredentials object.
     * The password is expected to be a JSON string that can be parsed
     * into the AuthCredentials type.
     */
    return JSON.parse(credentials.password) as AuthCredentials;
  } catch {
    /**
     * If there was an error retrieving the credentials from the keychain,
     * return null.
     */
    return null;
  }
}

/**
 * Sets the Dressipi credentials to the keychain.
 * 
 * @param clientId - The client ID for the Dressipi API.
 * @param serverUrl - The server URL for the Dressipi API.
 * @param token - The access token for the Dressipi API.
 * @return {Promise<void>} - A promise that resolves when the 
 * credentials are set.
 */
export const setCredentialsToKeychain = async (
  clientId: string, 
  serverUrl: string, 
  token: string
): Promise<void> => {
  /**
   * If the clientId or serverUrl is not provided, stop the function execution.
   */
  if (!clientId || !serverUrl) {
    return;
  }

  try {
    /**
     * Set the Dressipi credentials to the keychain using the provided clientId,
     * serverUrl, and token. The username is generated based on the clientId. 
     * The security level is set to SECURE_SOFTWARE, which means the credentials
     * will be stored securely in the software keychain.
     */
    await KeyChain.setInternetCredentials(
      serverUrl,
      generateUsername(clientId),
      token,
      {
        securityLevel: KeyChain.SECURITY_LEVEL.SECURE_SOFTWARE,
      }
    )
  } catch (error) {
    /**
     * If there was an error setting the credentials to the keychain, throw it.
     */
    throw new Error(
      `Could not set Dressipi credentials to keychain: ${(error as Error).message}`
    );
  }
}

/**
 * Deletes the Dressipi credentials from the keychain using 
 * the provided serverUrl.
 * 
 * @param serverUrl - The server URL for the Dressipi API.
 * @return {Promise<void>} - A promise that resolves when the 
 * credentials are deleted.
 */
export const resetCredentialsFromKeychain = async (
  serverUrl: string
): Promise<void> => {
  /**
   * Deletes the credentials from the keychain using the provided serverUrl. 
   * This will remove the credentials associated with the server.
   */
  await KeyChain.resetInternetCredentials({
    server: serverUrl,
  });
}

/**
 * Generates a username for the Dressipi API based on the client ID.
 * 
 * @param clientId - The client ID for the Dressipi API.
 * @return {string} - The generated username.
 */
const generateUsername = (clientId: string): string => `dressipi-${clientId}`;
