import { renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DressipiContext } from '../../../context/DressipiContext';
import { useDressipiProductDisplayPageTracking } from '../../../hooks/tracking';
import { useDressipiTracking } from '../../../hooks/useDressipiTracking';

// Mock dependencies
vi.mock('use-deep-compare-effect');
vi.mock('../../../tracking/trackerEvents');

describe('useDressipiTracking hook', () => {
  const mockNamespaceId = 'test-namespace-123';
  const mockQueue = { current: [] };
  const mockTracker = {
    trackSelfDescribingEvent: vi.fn(),
    trackEcommerceTransactionEvent: vi.fn(),
  };

  const mockContextValue = {
    namespaceId: mockNamespaceId,
    queue: mockQueue,
    tracker: mockTracker,
    credentials: null,
    domain: 'api.dressipi.com',
    refreshAuthentication: vi.fn(),
  };

  const createTestWrapper = (contextValue: any) => {
    const TestWrapper: React.FC<{ children: React.ReactNode }> = ({
      children,
    }) =>
      React.createElement(
        DressipiContext.Provider,
        { value: contextValue },
        children
      );
    return TestWrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    if (mockQueue.current) {
      mockQueue.current.length = 0;
    }
  });

  describe('hook interface', () => {
    it('should return the expected tracking methods', () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useDressipiTracking(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toHaveProperty('order');
      expect(result.current).toHaveProperty('addToBasket');
      expect(result.current).toHaveProperty('removeFromBasket');
      expect(result.current).toHaveProperty('identify');
      expect(result.current).toHaveProperty('productDisplayPage');
      expect(result.current).toHaveProperty('productListPage');

      // All methods should be functions
      expect(typeof result.current.order).toBe('function');
      expect(typeof result.current.addToBasket).toBe('function');
      expect(typeof result.current.removeFromBasket).toBe('function');
      expect(typeof result.current.identify).toBe('function');
      expect(typeof result.current.productDisplayPage).toBe('function');
      expect(typeof result.current.productListPage).toBe('function');
    });

    it('should maintain stable references across re-renders', () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result, rerender } = renderHook(() => useDressipiTracking(), {
        wrapper: TestWrapper,
      });

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      expect(firstResult.order).toBe(secondResult.order);
      expect(firstResult.addToBasket).toBe(secondResult.addToBasket);
      expect(firstResult.removeFromBasket).toBe(secondResult.removeFromBasket);
      expect(firstResult.identify).toBe(secondResult.identify);
      expect(firstResult.productDisplayPage).toBe(
        secondResult.productDisplayPage
      );
      expect(firstResult.productListPage).toBe(secondResult.productListPage);
    });
  });

  describe('context integration', () => {
    it('should work with valid context', () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useDressipiTracking(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.order).toBe('function');
    });

    it('should work with missing queue', () => {
      const contextWithoutQueue = {
        ...mockContextValue,
        queue: null,
      };

      const TestWrapper = createTestWrapper(contextWithoutQueue);
      const { result } = renderHook(() => useDressipiTracking(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.order).toBe('function');
    });

    it('should work with missing tracker', () => {
      const contextWithoutTracker = {
        ...mockContextValue,
        tracker: null,
      };

      const TestWrapper = createTestWrapper(contextWithoutTracker);
      const { result } = renderHook(() => useDressipiTracking(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.order).toBe('function');
    });

    it('should work with missing both queue and tracker', () => {
      const contextWithoutTracking = {
        ...mockContextValue,
        queue: null,
        tracker: null,
      };

      const TestWrapper = createTestWrapper(contextWithoutTracking);
      const { result } = renderHook(() => useDressipiTracking(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.order).toBe('function');
    });

    it('should work with different namespace IDs', () => {
      const customContext = {
        ...mockContextValue,
        namespaceId: 'custom-namespace-456',
      };

      const TestWrapper = createTestWrapper(customContext);
      const { result } = renderHook(() => useDressipiTracking(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.identify).toBe('function');
    });
  });

  describe('method availability', () => {
    it('should provide all e-commerce tracking methods', () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useDressipiTracking(), {
        wrapper: TestWrapper,
      });

      // Test that all expected tracking methods are callable
      expect(() => {
        result.current.order({ orderId: 'test', totalValue: 0, items: [] });
      }).not.toThrow();

      expect(() => {
        result.current.addToBasket({ sku: 'test', quantity: 1 });
      }).not.toThrow();

      expect(() => {
        result.current.removeFromBasket({ sku: 'test', quantity: 1 });
      }).not.toThrow();

      expect(() => {
        result.current.identify({ customerId: 'test', email: 'test@test.com' });
      }).not.toThrow();

      expect(() => {
        result.current.productDisplayPage({ sku: 'test' });
      }).not.toThrow();

      expect(() => {
        result.current.productListPage({
          page: { number: 1 },
          items: [],
          filters: [],
        });
      }).not.toThrow();
    });

    it('should handle different parameter types', () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useDressipiTracking(), {
        wrapper: TestWrapper,
      });

      // Test with minimal parameters
      expect(() => {
        result.current.addToBasket({ sku: 'MINIMAL' });
      }).not.toThrow();

      // Test with full parameters
      expect(() => {
        result.current.addToBasket({
          sku: 'FULL-SKU',
          productCode: 'FULL-PROD',
          name: 'Full Product',
          brand: 'Test Brand',
          category: 'Test Category',
          price: '99.99',
          currency: 'USD',
          quantity: 2,
          size: 'M',
          barcode: '123456789',
        });
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle missing tracking infrastructure gracefully', () => {
      const emptyContext = {
        namespaceId: '',
        queue: null,
        tracker: null,
        credentials: null,
        domain: '',
        refreshAuthentication: vi.fn(),
      };

      const TestWrapper = createTestWrapper(emptyContext);
      const { result } = renderHook(() => useDressipiTracking(), {
        wrapper: TestWrapper,
      });

      // Should not throw errors when tracking infrastructure is missing
      expect(() => {
        result.current.order({ orderId: 'TEST', totalValue: 0, items: [] });
      }).not.toThrow();

      expect(() => {
        result.current.addToBasket({ sku: 'TEST', quantity: 1 });
      }).not.toThrow();
    });

    it('should handle undefined context values', () => {
      const undefinedContext = {
        namespaceId: undefined,
        queue: undefined,
        tracker: undefined,
        credentials: null,
        domain: 'api.dressipi.com',
        refreshAuthentication: vi.fn(),
      };

      const TestWrapper = createTestWrapper(undefinedContext);
      const { result } = renderHook(() => useDressipiTracking(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.order).toBe('function');
    });
  });

  describe('tracking scenarios', () => {
    it('should handle e-commerce flow scenarios', () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useDressipiTracking(), {
        wrapper: TestWrapper,
      });

      // Simulate a complete e-commerce flow
      const item = { sku: 'FLOW-SKU', quantity: 1, price: '99.99' };

      expect(() => {
        // Product view
        result.current.productDisplayPage(item);
        // Add to basket
        result.current.addToBasket(item);
        // Remove from basket
        result.current.removeFromBasket(item);
        // Add back to basket
        result.current.addToBasket(item);
        // Place order
        result.current.order({
          orderId: 'ORDER-123',
          totalValue: 99.99,
          items: [],
        });
      }).not.toThrow();
    });

    it('should handle search and listing scenarios', () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useDressipiTracking(), {
        wrapper: TestWrapper,
      });

      expect(() => {
        // Product list page view
        result.current.productListPage({
          page: { number: 1 },
          items: [
            { productCode: 'PROD-1' },
            { productCode: 'PROD-2' },
            { sku: 'SKU-3' },
          ],
          filters: [
            { name: 'category', selected: ['dresses'] },
            { name: 'brand', selected: ['Nike', 'Adidas'] },
          ],
        });

        // Individual product views
        result.current.productDisplayPage({ productCode: 'PROD-1' });
        result.current.productDisplayPage({ sku: 'SKU-3' });
      }).not.toThrow();
    });

    it('should handle user identification scenarios', () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useDressipiTracking(), {
        wrapper: TestWrapper,
      });

      expect(() => {
        // Customer identification with email
        result.current.identify({
          email: 'customer@example.com',
        });

        // Customer identification with customer ID
        result.current.identify({
          customerId: 'CUSTOMER-123',
        });

        // Customer identification with both
        result.current.identify({
          customerId: 'CUSTOMER-456',
          email: 'customer2@example.com',
        });
      }).not.toThrow();
    });
  });
});

describe('useDressipiProductDisplayPageTracking hook', () => {
  const mockContextValue = {
    namespaceId: 'test-namespace',
    queue: { current: [] },
    tracker: null,
    credentials: null,
    domain: 'api.dressipi.com',
    refreshAuthentication: vi.fn(),
  };

  const createTestWrapper = (contextValue: any) => {
    const TestWrapper: React.FC<{ children: React.ReactNode }> = ({
      children,
    }) =>
      React.createElement(
        DressipiContext.Provider,
        { value: contextValue },
        children
      );
    return TestWrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('automatic tracking', () => {
    it('should initialize without errors', () => {
      const item = {
        productCode: 'PROD-AUTO',
        sku: 'SKU-AUTO',
        name: 'Auto Track Item',
      };

      const TestWrapper = createTestWrapper(mockContextValue);

      expect(() => {
        renderHook(() => useDressipiProductDisplayPageTracking(item), {
          wrapper: TestWrapper,
        });
      }).not.toThrow();
    });

    it('should handle empty item gracefully', () => {
      const emptyItem = {};

      const TestWrapper = createTestWrapper(mockContextValue);

      expect(() => {
        renderHook(() => useDressipiProductDisplayPageTracking(emptyItem), {
          wrapper: TestWrapper,
        });
      }).not.toThrow();
    });

    it('should handle minimal item data', () => {
      const minimalItem = {
        sku: 'MINIMAL-SKU',
      };

      const TestWrapper = createTestWrapper(mockContextValue);

      expect(() => {
        renderHook(() => useDressipiProductDisplayPageTracking(minimalItem), {
          wrapper: TestWrapper,
        });
      }).not.toThrow();
    });

    it('should handle complex item data', () => {
      const complexItem = {
        productCode: 'COMPLEX-PROD',
        sku: 'COMPLEX-SKU',
        name: 'Complex Product',
        brand: 'Premium Brand',
        category: 'Luxury Items',
        price: '299.99',
        currency: 'EUR',
        size: 'L',
        barcode: '9876543210',
      };

      const TestWrapper = createTestWrapper(mockContextValue);

      expect(() => {
        renderHook(() => useDressipiProductDisplayPageTracking(complexItem), {
          wrapper: TestWrapper,
        });
      }).not.toThrow();
    });
  });

  describe('hook behavior', () => {
    it('should not return anything', () => {
      const item = { sku: 'TEST-SKU' };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(
        () => useDressipiProductDisplayPageTracking(item),
        {
          wrapper: TestWrapper,
        }
      );

      expect(result.current).toBeUndefined();
    });

    it('should work with different context configurations', () => {
      const item = { productCode: 'CONTEXT-TEST' };

      const customContext = {
        ...mockContextValue,
        namespaceId: 'custom-namespace',
        tracker: { trackSelfDescribingEvent: vi.fn() },
      };

      const TestWrapper = createTestWrapper(customContext);

      expect(() => {
        renderHook(() => useDressipiProductDisplayPageTracking(item), {
          wrapper: TestWrapper,
        });
      }).not.toThrow();
    });

    it('should handle different item types', () => {
      const TestWrapper = createTestWrapper(mockContextValue);

      // Test with product code only
      expect(() => {
        renderHook(
          () =>
            useDressipiProductDisplayPageTracking({
              productCode: 'PROD-ONLY',
            }),
          { wrapper: TestWrapper }
        );
      }).not.toThrow();

      // Test with SKU only
      expect(() => {
        renderHook(
          () => useDressipiProductDisplayPageTracking({ sku: 'SKU-ONLY' }),
          { wrapper: TestWrapper }
        );
      }).not.toThrow();

      // Test with multiple properties
      expect(() => {
        renderHook(
          () =>
            useDressipiProductDisplayPageTracking({
              productCode: 'MULTI-PROD',
              sku: 'MULTI-SKU',
              name: 'Multi Property Item',
              price: '149.99',
            }),
          { wrapper: TestWrapper }
        );
      }).not.toThrow();
    });
  });

  describe('context dependency', () => {
    it('should work with missing tracking infrastructure', () => {
      const item = { sku: 'NO-TRACKING' };

      const emptyContext = {
        namespaceId: '',
        queue: null,
        tracker: null,
        credentials: null,
        domain: '',
        refreshAuthentication: vi.fn(),
      };

      const TestWrapper = createTestWrapper(emptyContext);

      expect(() => {
        renderHook(() => useDressipiProductDisplayPageTracking(item), {
          wrapper: TestWrapper,
        });
      }).not.toThrow();
    });

    it('should handle context changes gracefully', () => {
      const item = { sku: 'CONTEXT-CHANGE' };

      const initialContext = {
        ...mockContextValue,
        namespaceId: 'initial-namespace',
      };

      const TestWrapper = createTestWrapper(initialContext);
      const { rerender } = renderHook(
        () => useDressipiProductDisplayPageTracking(item),
        { wrapper: TestWrapper }
      );

      expect(() => {
        rerender();
      }).not.toThrow();
    });
  });
});
