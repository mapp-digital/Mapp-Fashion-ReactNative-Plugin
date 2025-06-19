/**
 * Enum representing the available storage types for secure credential storage.
 * Used to determine which storage adapter implementation to use.
 */
export enum StorageType {
  /**
   * Use React Native Keychain for secure storage.
   * This is the default option for standard React Native applications.
   */
  KEYCHAIN = 'keychain',

  /**
   * Use Expo SecureStore for secure storage.
   * This option should be used in Expo environments.
   */
  SECURE_STORE = 'secure-store',
}
