import * as KeyChain from 'react-native-keychain';
import { AuthCredentials } from '../types/auth';
import { SecureStorageAdapter } from '../types/keychain';
import { generateUsername } from '../utils/keychain';
import { Log } from '../utils/logger';

export class KeyChainAdapter implements SecureStorageAdapter {
  /**
   * Implements the React Native KeyChain functionality to retrieve the
   * Dressipi API credentials securely from the keychain.
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
   * Implements the React Native KeyChain functionality to set the credentials
   * for the Dressipi API securely in the keychain.
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
       * Set the Dressipi credentials to the keychain using the clientId,
       * serverUrl, and token. The username is generated based on the clientId.
       * The security level is set to SECURE_SOFTWARE, which means
       * the credentials will be stored securely in the software keychain.
       */
      await KeyChain.setInternetCredentials(
        serverUrl,
        generateUsername(clientId),
        token,
        {
          securityLevel: KeyChain.SECURITY_LEVEL.SECURE_SOFTWARE,
        }
      );
    } catch (error) {
      /**
       * If we want to be strict about error handling, we can throw a
       * StorageError here. However, for now, we will just log the error.
       * Uncomment the following lines if you want to throw an error:
       */
      Log.warn(
        `Could not set Dressipi credentials to keychain: "${(error as Error).message}". Proceeding without storing credentials...`,
        'KeyChainAdapter.ts'
      );

      // throw new StorageError(
      //   `Could not set Dressipi credentials to keychain: ${(error as Error).message}`
      // );
    }
  }

  /**
   * Deletes the credentials for the Dressipi API from the keychain
   * using the provided serverUrl.
   *
   * @param {string} serverUrl - The server URL for the Dressipi API.
   * @returns {Promise<void>} A promise that resolves when the
   * credentials are removed.
   */
  async removeCredentials(serverUrl: string): Promise<void> {
    /**
     * Deletes the credentials from the keychain using the provided serverUrl.
     * This will remove the credentials associated with the server.
     */
    await KeyChain.resetInternetCredentials({
      server: serverUrl,
    });
  }

  /**
   * Sets a general key-value pair in the keychain using generic password storage.
   *
   * @param {string} key - The key for the data.
   * @param {string} value - The value to store.
   * @returns {Promise<void>} A promise that resolves when the data is set.
   */
  async setItem(key: string, value: string): Promise<void | null> {
    try {
      await KeyChain.setGenericPassword('dressipi', value, { service: key });
    } catch (error) {
      Log.error(
        `Could not set item to keychain: "${(error as Error).message}"`,
        'KeyChainAdapter.ts',
        { key, value }
      );
      return null;
    }
  }

  /**
   * Retrieves a value for a given key from the keychain.
   *
   * @param {string} key - The key for the data.
   * @returns {Promise<string | null>} A promise that resolves to the
   * value if found, or null if not found.
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const credentials = await KeyChain.getGenericPassword({ service: key });
      if (credentials && credentials.password) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      Log.error(
        `Could not get item from keychain: "${(error as Error).message}"`,
        'KeyChainAdapter.ts'
      );
      return null;
    }
  }

  /**
   * Removes a key-value pair from the keychain.
   *
   * @param {string} key - The key for the data to remove.
   * @returns {Promise<void>} A promise that resolves when the data is removed.
   */
  async removeItem(key: string): Promise<void> {
    try {
      await KeyChain.resetGenericPassword({ service: key });
    } catch (error) {
      Log.error(
        `Could not remove item from keychain: "${(error as Error).message}"`,
        'KeyChainAdapter.ts'
      );
      throw error;
    }
  }
}
