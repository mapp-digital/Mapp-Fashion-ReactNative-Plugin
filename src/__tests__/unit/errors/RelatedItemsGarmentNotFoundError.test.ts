import { describe, expect, it } from 'vitest';
import { RelatedItemsGarmentNotFoundError } from '../../../errors/RelatedItemsGarmentNotFoundError';

describe('RelatedItemsGarmentNotFoundError', () => {
  describe('constructor', () => {
    it('should create an instance with the provided message', () => {
      const message = 'Garment item not found';
      const error = new RelatedItemsGarmentNotFoundError(message);

      expect(error.message).toBe(message);
    });

    it('should set the correct error name', () => {
      const error = new RelatedItemsGarmentNotFoundError('test message');

      expect(error.name).toBe('RelatedItemsGarmentNotFoundError');
    });

    it('should extend the base Error class', () => {
      const error = new RelatedItemsGarmentNotFoundError('test message');

      expect(error).toBeInstanceOf(Error);
    });

    it('should be an instance of RelatedItemsGarmentNotFoundError', () => {
      const error = new RelatedItemsGarmentNotFoundError('test message');

      expect(error).toBeInstanceOf(RelatedItemsGarmentNotFoundError);
    });

    it('should handle empty message', () => {
      const error = new RelatedItemsGarmentNotFoundError('');

      expect(error.message).toBe('');
      expect(error.name).toBe('RelatedItemsGarmentNotFoundError');
    });

    it('should handle garment ID in message', () => {
      const message = 'Garment with ID 12345 not found in related items';
      const error = new RelatedItemsGarmentNotFoundError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('RelatedItemsGarmentNotFoundError');
    });

    it('should handle detailed error messages', () => {
      const message =
        'Related garment item with ID 987654321 could not be retrieved from the recommendation service';
      const error = new RelatedItemsGarmentNotFoundError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('RelatedItemsGarmentNotFoundError');
    });
  });

  describe('inheritance and prototype chain', () => {
    it('should maintain correct prototype chain', () => {
      const error = new RelatedItemsGarmentNotFoundError('test message');

      expect(Object.getPrototypeOf(error)).toBe(
        RelatedItemsGarmentNotFoundError.prototype
      );
    });

    it('should work with instanceof checks', () => {
      const error = new RelatedItemsGarmentNotFoundError('test message');

      expect(error instanceof RelatedItemsGarmentNotFoundError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should preserve stack trace', () => {
      const error = new RelatedItemsGarmentNotFoundError('test message');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack).toContain('RelatedItemsGarmentNotFoundError');
    });
  });

  describe('error handling scenarios', () => {
    it('should be catchable as Error', () => {
      expect(() => {
        throw new RelatedItemsGarmentNotFoundError('test error');
      }).toThrow(Error);
    });

    it('should be catchable as RelatedItemsGarmentNotFoundError', () => {
      expect(() => {
        throw new RelatedItemsGarmentNotFoundError('test error');
      }).toThrow(RelatedItemsGarmentNotFoundError);
    });

    it('should preserve message when thrown and caught', () => {
      const message = 'Item with ID ABC123 not found';

      try {
        throw new RelatedItemsGarmentNotFoundError(message);
      } catch (error) {
        expect(error).toBeInstanceOf(RelatedItemsGarmentNotFoundError);
        expect((error as RelatedItemsGarmentNotFoundError).message).toBe(
          message
        );
        expect((error as RelatedItemsGarmentNotFoundError).name).toBe(
          'RelatedItemsGarmentNotFoundError'
        );
      }
    });

    it('should work in promise rejections', async () => {
      const message = 'Related garment not available';

      await expect(
        Promise.reject(new RelatedItemsGarmentNotFoundError(message))
      ).rejects.toThrow(RelatedItemsGarmentNotFoundError);

      await expect(
        Promise.reject(new RelatedItemsGarmentNotFoundError(message))
      ).rejects.toThrow(message);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle common garment not found error messages', () => {
      const commonMessages = [
        'Garment not found',
        'Item ID 12345 does not exist',
        'Related item unavailable',
        'Product not found in recommendation data',
        'Garment with ID XYZ789 not in response',
        'Missing garment in related items collection',
        'Item lookup failed - not found',
      ];

      commonMessages.forEach(message => {
        const error = new RelatedItemsGarmentNotFoundError(message);
        expect(error.message).toBe(message);
        expect(error.name).toBe('RelatedItemsGarmentNotFoundError');
        expect(error).toBeInstanceOf(RelatedItemsGarmentNotFoundError);
      });
    });

    it('should handle structured error messages with item details', () => {
      const itemId = 'DRESS_001_BLUE_M';
      const categoryId = 'dresses';
      const message = `Related garment item "${itemId}" in category "${categoryId}" not found in API response`;

      const error = new RelatedItemsGarmentNotFoundError(message);

      expect(error.message).toBe(message);
      expect(error.message).toContain(itemId);
      expect(error.message).toContain(categoryId);
      expect(error.name).toBe('RelatedItemsGarmentNotFoundError');
    });

    it('should handle numeric garment IDs', () => {
      const garmentId = 987654321;
      const message = `Garment with raw_garment_id ${garmentId} not found in indexed items`;

      const error = new RelatedItemsGarmentNotFoundError(message);

      expect(error.message).toBe(message);
      expect(error.message).toContain(garmentId.toString());
      expect(error.name).toBe('RelatedItemsGarmentNotFoundError');
    });

    it('should handle JSON-structured error messages', () => {
      const errorData = {
        error_type: 'garment_not_found',
        garment_id: 'ITEM_999',
        category: 'accessories',
        timestamp: '2024-01-15T10:30:00Z',
      };
      const message = JSON.stringify(errorData);

      const error = new RelatedItemsGarmentNotFoundError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('RelatedItemsGarmentNotFoundError');
    });
  });

  describe('comparison with other error types', () => {
    it('should be distinguishable from generic Error', () => {
      const garmentError = new RelatedItemsGarmentNotFoundError(
        'garment not found'
      );
      const genericError = new Error('generic error');

      expect(garmentError).toBeInstanceOf(RelatedItemsGarmentNotFoundError);
      expect(genericError).not.toBeInstanceOf(RelatedItemsGarmentNotFoundError);
      expect(garmentError.name).toBe('RelatedItemsGarmentNotFoundError');
      expect(genericError.name).toBe('Error');
    });

    it('should be distinguishable from AuthenticationError', () => {
      // Mock AuthenticationError for comparison
      class AuthenticationError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'AuthenticationError';
        }
      }

      const garmentError = new RelatedItemsGarmentNotFoundError(
        'garment not found'
      );
      const authError = new AuthenticationError('auth failed');

      expect(garmentError).not.toBeInstanceOf(AuthenticationError);
      expect(authError).not.toBeInstanceOf(RelatedItemsGarmentNotFoundError);
      expect(garmentError.name).toBe('RelatedItemsGarmentNotFoundError');
      expect(authError.name).toBe('AuthenticationError');
    });

    it('should be distinguishable from other custom errors', () => {
      class ProductNotFoundError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'ProductNotFoundError';
        }
      }

      const garmentError = new RelatedItemsGarmentNotFoundError(
        'garment not found'
      );
      const productError = new ProductNotFoundError('product not found');

      expect(garmentError).not.toBeInstanceOf(ProductNotFoundError);
      expect(productError).not.toBeInstanceOf(RelatedItemsGarmentNotFoundError);
      expect(garmentError.name).toBe('RelatedItemsGarmentNotFoundError');
      expect(productError.name).toBe('ProductNotFoundError');
    });
  });

  describe('integration with related items system', () => {
    it('should handle API response context errors', () => {
      const message =
        'Item with ID 12345 not found in response data - may have been removed or is unavailable';
      const error = new RelatedItemsGarmentNotFoundError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('RelatedItemsGarmentNotFoundError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle mapping function context errors', () => {
      const rawGarmentId = 999888777;
      const message = `[Dressipi] Item with ID ${rawGarmentId} not found in response data`;
      const error = new RelatedItemsGarmentNotFoundError(message);

      expect(error.message).toBe(message);
      expect(error.message).toContain('[Dressipi]');
      expect(error.message).toContain(rawGarmentId.toString());
      expect(error.name).toBe('RelatedItemsGarmentNotFoundError');
    });

    it('should maintain error context for debugging', () => {
      const error = new RelatedItemsGarmentNotFoundError(
        'Debug: Garment lookup failed in outfit mapping'
      );

      // Should preserve all error properties for debugging
      expect(error.message).toContain('Debug:');
      expect(error.stack).toBeDefined();
      expect(error.name).toBe('RelatedItemsGarmentNotFoundError');
      expect(typeof error.stack).toBe('string');
    });
  });
});
