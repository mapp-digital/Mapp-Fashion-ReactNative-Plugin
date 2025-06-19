import { AuthCredentials } from './auth';

/**
 * Represents a secure storage adapter for managing credentials.
 * This interface defines methods for setting, getting, and removing
 * credentials securely.
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
}
