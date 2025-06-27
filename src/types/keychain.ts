import { AuthCredentials } from './auth';

/**
 * Represents a secure storage adapter for managing credentials and general data.
 * This interface defines methods for setting, getting, and removing
 * credentials and general key-value pairs securely.
 */
export interface SecureStorageAdapter {
  /**
   * Sets the credentials (token) for a given serverUrl and clientId.
   *
   * @param {string} clientId - The client ID for the credentials.
   * @param {string} serverUrl - The server URL for the credentials.
   * @param {string} token - The access token for the credentials.
   * @returns {Promise<void>} A promise that resolves when
   * the credentials are set.
   */
  setCredentials(
    clientId: string,
    serverUrl: string,
    token: string
  ): Promise<void>;

  /**
   * Retrieves the credentials for a given clientId and serverUrl.
   *
   * @param {string} clientId - The client ID for the credentials.
   * @param {string} serverUrl - The server URL for the credentials.
   * @returns {Promise<AuthCredentials | null>} A promise that resolves to the
   * credentials if found, or null if not found.
   */
  getCredentials(
    clientId: string,
    serverUrl: string
  ): Promise<AuthCredentials | null>;

  /**
   * Removes the credentials for a given serverUrl.
   *
   *  @param {string} serverUrl - The server URL for the credentials.
   * @returns {Promise<void>} A promise that resolves when
   * the credentials are removed.
   */
  removeCredentials(serverUrl: string): Promise<void>;

  /**
   * Sets a general key-value pair in secure storage.
   *
   * @param {string} key - The key for the data.
   * @param {string} value - The value to store.
   * @returns {Promise<void>} A promise that resolves when the data is set.
   */
  setItem(key: string, value: string): Promise<void | null>;

  /**
   * Retrieves a value for a given key from secure storage.
   *
   * @param {string} key - The key for the data.
   * @returns {Promise<string | null>} A promise that resolves to the
   * value if found, or null if not found.
   */
  getItem(key: string): Promise<string | null>;

  /**
   * Removes a key-value pair from secure storage.
   *
   * @param {string} key - The key for the data to remove.
   * @returns {Promise<void>} A promise that resolves when the data is removed.
   */
  removeItem(key: string): Promise<void>;
}
