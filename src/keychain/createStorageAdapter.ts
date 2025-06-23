import { StorageType } from '../enums/StorageType';
import { SecureStorageAdapter } from '../types/keychain';
import { KeyChainAdapter } from './KeyChainAdapter';

/**
 * Factory function to create the appropriate storage adapter based on the storage type.
 *
 * @param {StorageType} storageType - The type of storage adapter to create.
 * Defaults to StorageType.KEYCHAIN if not provided.
 * @returns {SecureStorageAdapter} The appropriate storage adapter instance.
 */
export const createStorageAdapter = (
  storageType: StorageType = StorageType.KEYCHAIN
): SecureStorageAdapter => {
  switch (storageType) {
    case StorageType.SECURE_STORE:
    case StorageType.KEYCHAIN:
    default:
      return new KeyChainAdapter();
  }
};
