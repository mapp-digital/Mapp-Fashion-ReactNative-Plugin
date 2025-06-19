import * as SecureStore from 'expo-secure-store';
import { AuthCredentials } from '../types/auth';
import { SecureStorageAdapter } from '../types/keychain';
import { generateUsername } from '../utils/keychain';

export class SecureStoreAdapter implements SecureStorageAdapter {
  /**
   * Implements the Expo SecureStore functionality to retrieve the
   * Dressipi API credentials securely from the secure store.
   *
   * @param {string} clientId - The client ID for the Dressipi API.
   * @param {string} serverUrl - The server URL for the Dressipi API.
   * @returns {Promise<AuthCredentials | null>} A promise that resolves to the
   * Dressipi credentials if found, or null if not found.
   */
  async getCredentials(
    clientId: string,
    serverUrl: string
  ): Promise<AuthCredentials | null> {
    try {
      /**
       * Retrieve the Dressipi credentials from the secure store using the provided
       * serverUrl as the key.
       */
      const credentialsString: string | null =
        await SecureStore.getItemAsync(serverUrl);

      /**
       * If the credentials are not found, return null.
       */
      if (!credentialsString) {
        return null;
      }

      /**
       * Parse the credentials string to get the stored credentials object.
       */
      const credentials = JSON.parse(credentialsString) as {
        username: string;
        password: string;
      };

      /**
       * If the username does not match the generated username based on the clientId,
       * return null.
       */
      if (generateUsername(clientId) !== credentials.username) {
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
       * If there was an error retrieving the credentials from the secure store,
       * return null.
       */
      return null;
    }
  }

  /**
   * Implements the Expo SecureStore functionality to set the credentials
   * for the Dressipi API securely in the secure store.
   *
   * @param {string} clientId - The client ID for the Dressipi API.
   * @param {string} serverUrl - The server URL for the Dressipi API.
   * @param {string} token - The access token for the Dressipi API.
   * @returns {Promise<void>} A promise that resolves when the
   * credentials are set.
   */
  async setCredentials(
    clientId: string,
    serverUrl: string,
    token: string
  ): Promise<void> {
    /**
     * If the clientId or serverUrl is not provided,
     * stop the function execution.
     */
    if (!clientId || !serverUrl) {
      return;
    }

    try {
      /**
       * Set the Dressipi credentials to the secure store using the serverUrl as the key.
       * The username is generated based on the clientId.
       * The credentials are stored as a JSON string containing both username and token.
       */
      const credentials = {
        username: generateUsername(clientId),
        password: token,
      };

      await SecureStore.setItemAsync(serverUrl, JSON.stringify(credentials), {
        requireAuthentication: false,
      });
    } catch (error) {
      /**
       * If there was an error setting the credentials to the secure store,
       * throw it.
       */
      throw new Error(
        `Could not set Dressipi credentials to secure store: ${(error as Error).message}`
      );
    }
  }

  /**
   * Deletes the credentials for the Dressipi API from the secure store
   * using the provided serverUrl.
   *
   * @param {string} serverUrl - The server URL for the Dressipi API.
   * @returns {Promise<void>} A promise that resolves when the
   * credentials are removed.
   */
  async removeCredentials(serverUrl: string): Promise<void> {
    /**
     * Deletes the credentials from the secure store using the provided serverUrl as the key.
     * This will remove the credentials associated with the server.
     */
    await SecureStore.deleteItemAsync(serverUrl);
  }
}
