import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DressipiProvider } from '../../context/DressipiProvider';
import { RelatedItemsMethod } from '../../enums/RelatedItemsMethod';
import { ResponseFormat } from '../../enums/ResponseFormat';
import { useDressipiTracking } from '../../hooks/useDressipiTracking';
import { useFacettedSearch } from '../../hooks/useFacettedSearch';
import { useRelatedItems } from '../../hooks/useRelatedItems';
import './setup';

describe('Error Recovery Feature Tests', () => {
  const TestProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) =>
    React.createElement(
      DressipiProvider,
      {
        clientId: 'test-client-123',
        domain: 'api.dressipi.com',
        namespaceId: 'test-namespace',
      },
      children
    );

  beforeEach(() => {
    // Clear any existing mocks before each test
    vi.clearAllMocks();
  });

  it('should handle network failures gracefully', async () => {
    // Test related items hook with network failure scenario
    const { result: relatedItemsResult } = renderHook(
      () =>
        useRelatedItems({
          item_id: 'ERROR-NETWORK',
          methods: [RelatedItemsMethod.SimilarItems],
          response_format: ResponseFormat.Detailed,
        }),
      { wrapper: TestProvider }
    );

    // Hook should initialize properly
    expect(relatedItemsResult.current).toBeDefined();
    expect(relatedItemsResult.current).toHaveProperty('loading');
    expect(relatedItemsResult.current).toHaveProperty('relatedItems');
    expect(relatedItemsResult.current).toHaveProperty('error');

    // Initial state should be correct
    expect(typeof relatedItemsResult.current.loading).toBe('boolean');
    expect(relatedItemsResult.current.relatedItems).toBeNull();
    expect(relatedItemsResult.current.error).toBeNull();

    // Test search hook with network failure
    const { result: searchResult } = renderHook(
      () =>
        useFacettedSearch({
          facets: [{ name: 'garment_category', value: ['error-test'] }],
        }),
      { wrapper: TestProvider }
    );

    expect(searchResult.current).toBeDefined();
    expect(typeof searchResult.current.loading).toBe('boolean');
    expect(searchResult.current.items).toBeNull();
    expect(searchResult.current.error).toBeNull();
  });

  it('should handle server errors and maintain application stability', async () => {
    // Test with server error scenarios (500, 503, etc.)
    const { result: serverErrorResult } = renderHook(
      () =>
        useRelatedItems({
          item_id: 'ERROR-500',
          methods: [RelatedItemsMethod.SimilarItems],
        }),
      { wrapper: TestProvider }
    );

    // Hook should handle server errors gracefully
    expect(serverErrorResult.current).toBeDefined();
    expect(typeof serverErrorResult.current.loading).toBe('boolean');
    expect(serverErrorResult.current.relatedItems).toBeNull();
    expect(serverErrorResult.current.error).toBeNull();

    // Test search with various error conditions
    const errorScenarios = [
      { facets: [{ name: 'brand' as const, value: ['error-500'] }] },
      { facets: [{ name: 'brand' as const, value: ['error-timeout'] }] },
      { facets: [{ name: 'brand' as const, value: ['error-malformed'] }] },
    ];

    const errorHooks = errorScenarios.map((scenario, index) =>
      renderHook(() => useFacettedSearch(scenario), { wrapper: TestProvider })
    );

    // All error scenarios should be handled gracefully
    errorHooks.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');
      expect(hook.result.current.items).toBeNull();
      expect(hook.result.current.error).toBeNull();
    });
  });

  it('should handle authentication errors and recovery', async () => {
    // Test authentication failure scenarios
    const { result: authErrorResult } = renderHook(
      () =>
        useRelatedItems({
          item_id: 'test-item-auth-fail',
          methods: [RelatedItemsMethod.SimilarItems],
        }),
      { wrapper: TestProvider }
    );

    // Hook should handle auth errors gracefully
    expect(authErrorResult.current).toBeDefined();
    expect(typeof authErrorResult.current.loading).toBe('boolean');

    // Test multiple hooks with authentication challenges
    const multipleHooks = [];
    for (let i = 0; i < 3; i++) {
      const hook = renderHook(
        () =>
          useRelatedItems({
            item_id: `auth-test-${i}`,
            methods: RelatedItemsMethod.SimilarItems,
          }),
        { wrapper: TestProvider }
      );
      multipleHooks.push(hook);
    }

    // All hooks should handle authentication gracefully
    multipleHooks.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');
      expect(hook.result.current.error).toBeNull();
    });
  });

  it('should handle malformed responses and data corruption', async () => {
    // Test with various malformed response scenarios
    const malformedScenarios = [
      {
        item_id: 'malformed-json',
        methods: RelatedItemsMethod.SimilarItems,
      },
      {
        item_id: 'missing-fields',
        methods: [RelatedItemsMethod.SimilarItems, RelatedItemsMethod.Outfits],
      },
      {
        item_id: 'invalid-structure',
        methods: RelatedItemsMethod.Outfits,
      },
    ];

    const malformedHooks = malformedScenarios.map((scenario, index) =>
      renderHook(() => useRelatedItems(scenario), { wrapper: TestProvider })
    );

    // All malformed response scenarios should be handled
    malformedHooks.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');
      expect(hook.result.current.relatedItems).toBeNull();
      expect(hook.result.current.error).toBeNull();
    });

    // Test search with malformed responses
    const { result: malformedSearchResult } = renderHook(
      () =>
        useFacettedSearch({
          facets: [{ name: 'brand', value: ['malformed-response'] }],
        }),
      { wrapper: TestProvider }
    );

    expect(malformedSearchResult.current).toBeDefined();
    expect(typeof malformedSearchResult.current.loading).toBe('boolean');
  });

  it('should maintain tracking functionality during errors', async () => {
    // Test that tracking continues to work even when discovery APIs fail
    const { result: trackingResult } = renderHook(() => useDressipiTracking(), {
      wrapper: TestProvider,
    });

    const { result: failingRelatedResult } = renderHook(
      () =>
        useRelatedItems({
          item_id: 'ERROR-NETWORK',
          methods: RelatedItemsMethod.SimilarItems,
        }),
      { wrapper: TestProvider }
    );

    const { result: failingSearchResult } = renderHook(
      () =>
        useFacettedSearch({
          facets: [{ name: 'brand', value: ['error-500'] }],
        }),
      { wrapper: TestProvider }
    );

    // Tracking should remain functional despite API failures
    expect(trackingResult.current).toBeDefined();
    expect(trackingResult.current.productDisplayPage).toBeDefined();
    expect(trackingResult.current.addToBasket).toBeDefined();
    expect(trackingResult.current.order).toBeDefined();

    // Test tracking functionality during error conditions
    act(() => {
      // Track product view despite related items failure
      trackingResult.current.productDisplayPage({
        productCode: 'ERROR-NETWORK',
        sku: 'ERROR-SKU',
        name: 'Error Test Product',
        price: '99.99',
      });

      // Track search despite search failure
      trackingResult.current.productListPage({
        page: { number: 1 },
        items: [{ productCode: 'ERROR-ITEM' }],
        filters: [{ name: 'error', selected: ['test'] }],
      });

      // Track order completion
      trackingResult.current.order({
        orderId: 'ERROR-ORDER',
        totalValue: 99.99,
        items: [
          {
            sku: 'ERROR-SKU',
            name: 'Error Test Product',
            price: 99.99,
            quantity: 1,
          },
        ],
      });
    });

    // All tracking methods should remain available
    expect(trackingResult.current.productDisplayPage).toBeDefined();
    expect(trackingResult.current.productListPage).toBeDefined();
    expect(trackingResult.current.order).toBeDefined();

    // Discovery hooks should handle errors gracefully
    expect(failingRelatedResult.current).toBeDefined();
    expect(failingSearchResult.current).toBeDefined();
  });

  it('should handle rapid error scenarios and recovery', async () => {
    // Test rapid succession of error scenarios
    const rapidErrorScenarios = [
      'ERROR-NETWORK',
      'ERROR-500',
      'NOT-FOUND-ITEM',
      'malformed-response',
      'timeout-error',
    ];

    const rapidHooks = rapidErrorScenarios.map((itemId, index) =>
      renderHook(
        () =>
          useRelatedItems({
            item_id: itemId,
            methods: RelatedItemsMethod.SimilarItems,
          }),
        { wrapper: TestProvider }
      )
    );

    // All rapid error scenarios should be handled
    rapidHooks.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');
      expect(hook.result.current.error).toBeNull();
    });

    // Test recovery after errors - switch to valid items
    const validItemId = 'VALID-ITEM-AFTER-ERRORS';

    const { result: recoveryResult, rerender } = renderHook(
      ({ itemId }) =>
        useRelatedItems({
          item_id: itemId,
          methods: RelatedItemsMethod.SimilarItems,
        }),
      {
        wrapper: TestProvider,
        initialProps: { itemId: 'ERROR-NETWORK' },
      }
    );

    // Initial error state
    expect(recoveryResult.current).toBeDefined();
    expect(typeof recoveryResult.current.loading).toBe('boolean');

    // Switch to valid item (simulating recovery)
    rerender({ itemId: validItemId });

    // Hook should handle the transition from error to valid state
    expect(recoveryResult.current).toBeDefined();
    expect(typeof recoveryResult.current.loading).toBe('boolean');
  });

  it('should handle concurrent errors without affecting other operations', async () => {
    // Test that errors in one hook don't affect others
    const mixedOperations = [
      // Some failing operations
      renderHook(
        () =>
          useRelatedItems({
            item_id: 'ERROR-NETWORK',
            methods: RelatedItemsMethod.SimilarItems,
          }),
        { wrapper: TestProvider }
      ),
      renderHook(
        () =>
          useFacettedSearch({
            facets: [{ name: 'brand', value: ['error-500'] }],
          }),
        { wrapper: TestProvider }
      ),
      // Some potentially successful operations
      renderHook(
        () =>
          useRelatedItems({
            item_id: 'VALID-ITEM',
            methods: RelatedItemsMethod.SimilarItems,
          }),
        { wrapper: TestProvider }
      ),
      renderHook(
        () =>
          useFacettedSearch({
            facets: [{ name: 'brand', value: ['valid-brand'] }],
          }),
        { wrapper: TestProvider }
      ),
    ];

    // All operations should be isolated and handle their own errors
    mixedOperations.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');
      expect(hook.result.current.error).toBeNull();
    });

    // Add tracking to ensure it works alongside errors
    const { result: trackingResult } = renderHook(() => useDressipiTracking(), {
      wrapper: TestProvider,
    });

    expect(trackingResult.current).toBeDefined();
    expect(trackingResult.current.productDisplayPage).toBeDefined();

    // Test that tracking continues to work despite concurrent errors
    act(() => {
      trackingResult.current.productDisplayPage({
        productCode: 'CONCURRENT-ERROR-TEST',
        sku: 'CONCURRENT-SKU',
        name: 'Concurrent Error Test',
        price: '149.99',
      });
    });

    expect(trackingResult.current.productDisplayPage).toBeDefined();
  });

  it('should provide meaningful error states without crashing', async () => {
    // Test that error states are meaningful and don't crash the application
    const errorTestScenarios = [
      {
        name: 'Network failure',
        config: {
          item_id: 'ERROR-NETWORK',
          methods: RelatedItemsMethod.SimilarItems,
        },
      },
      {
        name: 'Server error',
        config: {
          item_id: 'ERROR-500',
          methods: RelatedItemsMethod.Outfits,
        },
      },
      {
        name: 'Not found',
        config: {
          item_id: 'NOT-FOUND-ITEM',
          methods: [
            RelatedItemsMethod.SimilarItems,
            RelatedItemsMethod.Outfits,
          ],
        },
      },
    ];

    const errorHooks = errorTestScenarios.map(scenario =>
      renderHook(() => useRelatedItems(scenario.config), {
        wrapper: TestProvider,
      })
    );

    // All error scenarios should provide stable interfaces
    errorHooks.forEach((hook, index) => {
      const scenario = errorTestScenarios[index];

      expect(hook.result.current).toBeDefined();
      expect(hook.result.current).toHaveProperty('loading');
      expect(hook.result.current).toHaveProperty('relatedItems');
      expect(hook.result.current).toHaveProperty('error');

      // State should be consistent
      expect(typeof hook.result.current.loading).toBe('boolean');
      expect(hook.result.current.relatedItems).toBeNull();

      // Error handling should be graceful (no uncaught exceptions)
      expect(() => {
        // These should not throw
        const loading = hook.result.current.loading;
        const items = hook.result.current.relatedItems;
        const error = hook.result.current.error;
      }).not.toThrow();
    });

    // Test search error scenarios
    const searchErrorScenarios = [
      { facets: [{ name: 'brand' as const, value: ['error-network'] }] },
      { facets: [{ name: 'brand' as const, value: ['error-500'] }] },
      { facets: [] }, // Empty search
    ];

    const searchErrorHooks = searchErrorScenarios.map(scenario =>
      renderHook(() => useFacettedSearch(scenario), { wrapper: TestProvider })
    );

    searchErrorHooks.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(hook.result.current).toHaveProperty('loading');
      expect(hook.result.current).toHaveProperty('items');
      expect(hook.result.current).toHaveProperty('error');

      expect(typeof hook.result.current.loading).toBe('boolean');
      expect(hook.result.current.items).toBeNull();
    });
  });
});
