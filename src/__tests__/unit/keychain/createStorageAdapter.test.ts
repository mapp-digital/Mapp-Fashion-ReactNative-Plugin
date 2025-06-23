import { beforeEach, describe, expect, it } from 'vitest';
import { StorageType } from '../../../enums/StorageType';
import { createStorageAdapter } from '../../../keychain/createStorageAdapter';
import { KeyChainAdapter } from '../../../keychain/KeyChainAdapter';
import type { SecureStorageAdapter } from '../../../types/keychain';

describe('createStorageAdapter', () => {
  describe('storage type selection', () => {
    it('should return KeyChainAdapter for KEYCHAIN storage type', () => {
      const adapter = createStorageAdapter(StorageType.KEYCHAIN);

      expect(adapter).toBeInstanceOf(KeyChainAdapter);
      expect(adapter).toHaveProperty('getCredentials');
      expect(adapter).toHaveProperty('setCredentials');
      expect(adapter).toHaveProperty('removeCredentials');
    });

    it('should return KeyChainAdapter for SECURE_STORE storage type (fallback)', () => {
      const adapter = createStorageAdapter(StorageType.SECURE_STORE);

      expect(adapter).toBeInstanceOf(KeyChainAdapter);
      expect(adapter).toHaveProperty('getCredentials');
      expect(adapter).toHaveProperty('setCredentials');
      expect(adapter).toHaveProperty('removeCredentials');
    });

    it('should return KeyChainAdapter when no storage type is provided (default)', () => {
      const adapter = createStorageAdapter();

      expect(adapter).toBeInstanceOf(KeyChainAdapter);
      expect(adapter).toHaveProperty('getCredentials');
      expect(adapter).toHaveProperty('setCredentials');
      expect(adapter).toHaveProperty('removeCredentials');
    });

    it('should return KeyChainAdapter for undefined storage type', () => {
      const adapter = createStorageAdapter(undefined);

      expect(adapter).toBeInstanceOf(KeyChainAdapter);
    });
  });

  describe('adapter interface compliance', () => {
    it('should return adapter that implements SecureStorageAdapter interface', () => {
      const adapter = createStorageAdapter(StorageType.KEYCHAIN);

      // Verify all required methods exist
      expect(typeof adapter.getCredentials).toBe('function');
      expect(typeof adapter.setCredentials).toBe('function');
      expect(typeof adapter.removeCredentials).toBe('function');
    });

    it('should return different instances on multiple calls', () => {
      const adapter1 = createStorageAdapter(StorageType.KEYCHAIN);
      const adapter2 = createStorageAdapter(StorageType.KEYCHAIN);

      expect(adapter1).not.toBe(adapter2);
      expect(adapter1).toBeInstanceOf(KeyChainAdapter);
      expect(adapter2).toBeInstanceOf(KeyChainAdapter);
    });
  });

  describe('method signatures', () => {
    let adapter: SecureStorageAdapter;

    beforeEach(() => {
      adapter = createStorageAdapter(StorageType.KEYCHAIN);
    });

    it('should have getCredentials method with correct signature', () => {
      expect(adapter.getCredentials).toBeDefined();
      expect(adapter.getCredentials.length).toBe(2); // clientId, serverUrl
    });

    it('should have setCredentials method with correct signature', () => {
      expect(adapter.setCredentials).toBeDefined();
      expect(adapter.setCredentials.length).toBe(3); // clientId, serverUrl, token
    });

    it('should have removeCredentials method with correct signature', () => {
      expect(adapter.removeCredentials).toBeDefined();
      expect(adapter.removeCredentials.length).toBe(1); // serverUrl
    });
  });

  describe('type safety', () => {
    it('should accept all valid StorageType enum values', () => {
      // These should all compile and run without errors
      expect(() => createStorageAdapter(StorageType.KEYCHAIN)).not.toThrow();
      expect(() =>
        createStorageAdapter(StorageType.SECURE_STORE)
      ).not.toThrow();
    });

    it('should handle invalid storage type gracefully (fallback to default)', () => {
      // TypeScript would prevent this, but testing runtime behavior
      const invalidType = 'invalid-type' as any;
      const adapter = createStorageAdapter(invalidType);

      expect(adapter).toBeInstanceOf(KeyChainAdapter);
    });
  });

  describe('consistency', () => {
    it('should return same adapter type for same storage type', () => {
      const adapter1 = createStorageAdapter(StorageType.KEYCHAIN);
      const adapter2 = createStorageAdapter(StorageType.KEYCHAIN);

      expect(adapter1.constructor).toBe(adapter2.constructor);
      expect(adapter1).toBeInstanceOf(KeyChainAdapter);
      expect(adapter2).toBeInstanceOf(KeyChainAdapter);
    });

    it('should return consistent adapter types for fallback cases', () => {
      const keychainAdapter = createStorageAdapter(StorageType.KEYCHAIN);
      const secureStoreAdapter = createStorageAdapter(StorageType.SECURE_STORE);
      const defaultAdapter = createStorageAdapter();

      // All should return the same type (KeyChainAdapter) for now
      expect(keychainAdapter).toBeInstanceOf(KeyChainAdapter);
      expect(secureStoreAdapter).toBeInstanceOf(KeyChainAdapter);
      expect(defaultAdapter).toBeInstanceOf(KeyChainAdapter);
    });
  });

  describe('factory pattern behavior', () => {
    it('should act as a proper factory function', () => {
      const adapters = [
        createStorageAdapter(StorageType.KEYCHAIN),
        createStorageAdapter(StorageType.SECURE_STORE),
        createStorageAdapter(),
      ];

      // All should be different instances
      adapters.forEach((adapter, index) => {
        adapters.slice(index + 1).forEach(otherAdapter => {
          expect(adapter).not.toBe(otherAdapter);
        });
      });

      // But all should be of the same type currently
      adapters.forEach(adapter => {
        expect(adapter).toBeInstanceOf(KeyChainAdapter);
      });
    });

    it('should be callable without parameters', () => {
      expect(() => createStorageAdapter()).not.toThrow();

      const adapter = createStorageAdapter();
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(KeyChainAdapter);
    });
  });

  describe('future extensibility', () => {
    it('should be ready for additional storage types', () => {
      // This test ensures the factory pattern is set up correctly
      // for future storage adapter implementations

      const keychainAdapter = createStorageAdapter(StorageType.KEYCHAIN);
      const secureStoreAdapter = createStorageAdapter(StorageType.SECURE_STORE);

      // Both should implement the same interface
      const expectedMethods = [
        'getCredentials',
        'setCredentials',
        'removeCredentials',
      ];

      expectedMethods.forEach(method => {
        expect(keychainAdapter).toHaveProperty(method);
        expect(secureStoreAdapter).toHaveProperty(method);
        expect(typeof (keychainAdapter as any)[method]).toBe('function');
        expect(typeof (secureStoreAdapter as any)[method]).toBe('function');
      });
    });
  });
});
