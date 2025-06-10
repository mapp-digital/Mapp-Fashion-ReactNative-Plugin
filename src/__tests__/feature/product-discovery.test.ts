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

describe('Product Discovery Feature Tests', () => {
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

  it('should handle related items discovery workflow', async () => {
    // Test the complete related items discovery flow
    const { result: relatedItemsResult } = renderHook(
      () =>
        useRelatedItems({
          item_id: 'DRESS-123',
          methods: [
            RelatedItemsMethod.SimilarItems,
            RelatedItemsMethod.Outfits,
            RelatedItemsMethod.PartnerOutfits,
          ],
          response_format: ResponseFormat.Detailed,
          max_similar_items: 10,
          outfits_per_occasion: 3,
        }),
      { wrapper: TestProvider }
    );

    // Hook should initialize with proper structure
    expect(relatedItemsResult.current).toBeDefined();
    expect(relatedItemsResult.current).toHaveProperty('loading');
    expect(relatedItemsResult.current).toHaveProperty('relatedItems');
    expect(relatedItemsResult.current).toHaveProperty('error');

    // Initial state should be correct
    expect(typeof relatedItemsResult.current.loading).toBe('boolean');
    expect(relatedItemsResult.current.relatedItems).toBeNull();
    expect(relatedItemsResult.current.error).toBeNull();

    // Test different method combinations
    const { result: minimalResult } = renderHook(
      () =>
        useRelatedItems({
          item_id: 'SIMPLE-ITEM',
          methods: RelatedItemsMethod.SimilarItems,
        }),
      { wrapper: TestProvider }
    );

    expect(minimalResult.current).toBeDefined();
    expect(typeof minimalResult.current.loading).toBe('boolean');
  });

  it('should handle facetted search discovery workflow', async () => {
    // Test comprehensive search scenarios
    const { result: basicSearchResult } = renderHook(
      () =>
        useFacettedSearch({
          facets: [
            { name: 'garment_category', value: ['dresses'] },
            { name: 'brand', value: ['zara', 'h&m'] },
          ],
          response_format: ResponseFormat.Detailed,
          page: 1,
          per_page: 20,
        }),
      { wrapper: TestProvider }
    );

    // Hook should initialize with proper structure
    expect(basicSearchResult.current).toBeDefined();
    expect(basicSearchResult.current).toHaveProperty('loading');
    expect(basicSearchResult.current).toHaveProperty('items');
    expect(basicSearchResult.current).toHaveProperty('error');

    // Initial state should be correct
    expect(typeof basicSearchResult.current.loading).toBe('boolean');
    expect(basicSearchResult.current.items).toBeNull();
    expect(basicSearchResult.current.error).toBeNull();

    // Test price range search
    const { result: priceSearchResult } = renderHook(
      () =>
        useFacettedSearch({
          facets: [
            {
              name: 'price',
              filters: [{ from: 50, to: 200 }],
            },
          ],
          page: 1,
          per_page: 15,
        }),
      { wrapper: TestProvider }
    );

    expect(priceSearchResult.current).toBeDefined();
    expect(typeof priceSearchResult.current.loading).toBe('boolean');

    // Test empty search
    const { result: emptySearchResult } = renderHook(
      () =>
        useFacettedSearch({
          facets: [],
          page: 1,
          per_page: 10,
        }),
      { wrapper: TestProvider }
    );

    expect(emptySearchResult.current).toBeDefined();
    expect(typeof emptySearchResult.current.loading).toBe('boolean');
  });

  it('should handle search-to-related-items discovery flow', async () => {
    // Simulate a user discovering products through search, then exploring related items

    // First, perform a search
    const { result: searchResult } = renderHook(
      () =>
        useFacettedSearch({
          facets: [{ name: 'garment_category', value: ['dresses'] }],
          response_format: ResponseFormat.Detailed,
        }),
      { wrapper: TestProvider }
    );

    // Then, use one of the search results to get related items
    const { result: relatedItemsResult } = renderHook(
      () =>
        useRelatedItems({
          item_id: 'SEARCH-RESULT-ITEM',
          methods: [
            RelatedItemsMethod.SimilarItems,
            RelatedItemsMethod.Outfits,
          ],
          response_format: ResponseFormat.Detailed,
        }),
      { wrapper: TestProvider }
    );

    // Both hooks should be properly initialized
    expect(searchResult.current).toBeDefined();
    expect(relatedItemsResult.current).toBeDefined();

    // State structures should be consistent
    expect(typeof searchResult.current.loading).toBe('boolean');
    expect(typeof relatedItemsResult.current.loading).toBe('boolean');

    // Both should handle their respective data structures
    expect(searchResult.current.items).toBeNull();
    expect(relatedItemsResult.current.relatedItems).toBeNull();
  });

  it('should handle pagination and filtering workflows', async () => {
    // Test pagination scenarios
    const paginationScenarios = [
      { page: 1, per_page: 10 },
      { page: 2, per_page: 20 },
      { page: 3, per_page: 15 },
    ];

    const hooks = paginationScenarios.map((pagination, index) =>
      renderHook(
        () =>
          useFacettedSearch({
            facets: [{ name: 'brand', value: [`brand-${index}`] }],
            ...pagination,
          }),
        { wrapper: TestProvider }
      )
    );

    // All pagination hooks should be properly initialized
    hooks.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');
      expect(hook.result.current.items).toBeNull();
      expect(hook.result.current.error).toBeNull();
    });

    // Test complex filtering
    const { result: complexFilterResult } = renderHook(
      () =>
        useFacettedSearch({
          facets: [
            { name: 'garment_category', value: ['tops', 'dresses'] },
            { name: 'brand', value: ['nike', 'adidas', 'zara'] },
            { name: 'occasion', value: ['casual', 'formal'] },
            {
              name: 'price',
              filters: [
                { from: 20, to: 100 },
                { from: 150, to: 300 },
              ],
            },
          ],
          page: 1,
          per_page: 25,
        }),
      { wrapper: TestProvider }
    );

    expect(complexFilterResult.current).toBeDefined();
    expect(typeof complexFilterResult.current.loading).toBe('boolean');
  });

  it('should handle different response formats and data structures', async () => {
    // Test different response formats
    const responseFormats = [ResponseFormat.Detailed];

    const hooks = responseFormats.map((format, index) =>
      renderHook(
        () =>
          useRelatedItems({
            item_id: `format-test-${index}`,
            methods: RelatedItemsMethod.SimilarItems,
            response_format: format,
          }),
        { wrapper: TestProvider }
      )
    );

    // All format hooks should be properly initialized
    hooks.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');
      expect(hook.result.current.relatedItems).toBeNull();
    });

    // Test different method combinations
    const methodCombinations = [
      [RelatedItemsMethod.SimilarItems],
      [RelatedItemsMethod.Outfits],
      [RelatedItemsMethod.PartnerOutfits],
      [RelatedItemsMethod.SimilarItems, RelatedItemsMethod.Outfits],
    ];

    const methodHooks = methodCombinations.map((methods, index) =>
      renderHook(
        () =>
          useRelatedItems({
            item_id: `method-test-${index}`,
            methods: methods.length === 1 ? methods[0] : methods,
          }),
        { wrapper: TestProvider }
      )
    );

    methodHooks.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');
    });
  });

  it('should integrate discovery with tracking for complete user journey', async () => {
    // Test complete product discovery + tracking integration
    const { result: searchResult } = renderHook(
      () =>
        useFacettedSearch({
          facets: [{ name: 'garment_category', value: ['shoes'] }],
        }),
      { wrapper: TestProvider }
    );

    const { result: relatedItemsResult } = renderHook(
      () =>
        useRelatedItems({
          item_id: 'TRACKED-ITEM',
          methods: RelatedItemsMethod.SimilarItems,
        }),
      { wrapper: TestProvider }
    );

    const { result: trackingResult } = renderHook(() => useDressipiTracking(), {
      wrapper: TestProvider,
    });

    // All hooks should be available
    expect(searchResult.current).toBeDefined();
    expect(relatedItemsResult.current).toBeDefined();
    expect(trackingResult.current).toBeDefined();

    // Simulate discovery + tracking workflow
    act(() => {
      // Track search page view
      trackingResult.current.productListPage({
        page: { number: 1 },
        items: [
          { productCode: 'SHOE-1' },
          { productCode: 'SHOE-2' },
          { productCode: 'SHOE-3' },
        ],
        filters: [{ name: 'garment_category', selected: ['shoes'] }],
      });

      // Track individual product view
      trackingResult.current.productDisplayPage({
        productCode: 'TRACKED-ITEM',
        sku: 'TRACKED-SKU',
        name: 'Tracked Product',
        price: '99.99',
      });

      // Track similar item discovery
      trackingResult.current.productDisplayPage({
        productCode: 'SIMILAR-ITEM',
        sku: 'SIMILAR-SKU',
        name: 'Similar Product',
        price: '89.99',
      });
    });

    // All functionality should remain available
    expect(trackingResult.current.productListPage).toBeDefined();
    expect(trackingResult.current.productDisplayPage).toBeDefined();
    expect(typeof searchResult.current.loading).toBe('boolean');
    expect(typeof relatedItemsResult.current.loading).toBe('boolean');
  });

  it('should handle request parameter variations and edge cases', async () => {
    // Test various parameter combinations
    const parameterVariations = [
      // Minimal parameters
      { item_id: 'minimal-1' },
      // With method
      { item_id: 'method-1', methods: RelatedItemsMethod.SimilarItems },
      // With multiple methods
      {
        item_id: 'multi-1',
        methods: [RelatedItemsMethod.SimilarItems, RelatedItemsMethod.Outfits],
      },
      // With limits
      {
        item_id: 'limits-1',
        methods: RelatedItemsMethod.SimilarItems,
        max_similar_items: 5,
      },
      // Complete configuration
      {
        item_id: 'complete-1',
        methods: [RelatedItemsMethod.SimilarItems, RelatedItemsMethod.Outfits],
        response_format: ResponseFormat.Detailed,
        max_similar_items: 8,
        outfits_per_occasion: 2,
      },
    ];

    const hooks = parameterVariations.map((params, index) =>
      renderHook(() => useRelatedItems(params), { wrapper: TestProvider })
    );

    // All parameter variations should work
    hooks.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');
      expect(hook.result.current.relatedItems).toBeNull();
      expect(hook.result.current.error).toBeNull();
    });
  });

  it('should handle concurrent discovery operations efficiently', async () => {
    // Test multiple discovery operations running simultaneously
    const concurrentOperations = [];

    // Multiple related items requests
    for (let i = 0; i < 3; i++) {
      const hook = renderHook(
        () =>
          useRelatedItems({
            item_id: `concurrent-related-${i}`,
            methods: RelatedItemsMethod.SimilarItems,
          }),
        { wrapper: TestProvider }
      );
      concurrentOperations.push(hook);
    }

    // Multiple search requests
    for (let i = 0; i < 3; i++) {
      const hook = renderHook(
        () =>
          useFacettedSearch({
            facets: [{ name: 'brand', value: [`concurrent-brand-${i}`] }],
          }),
        { wrapper: TestProvider }
      );
      concurrentOperations.push(hook);
    }

    // All concurrent operations should be properly initialized
    concurrentOperations.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');

      // Check for appropriate data properties based on hook type
      if ('relatedItems' in hook.result.current) {
        expect(hook.result.current.relatedItems).toBeNull();
      }
      if ('items' in hook.result.current) {
        expect(hook.result.current.items).toBeNull();
      }

      expect(hook.result.current.error).toBeNull();
    });
  });

  it('should maintain hook stability during rapid parameter changes', async () => {
    // Test hook stability when parameters change rapidly
    let currentItemId = 'stability-test-1';

    const { result, rerender } = renderHook(
      () =>
        useRelatedItems({
          item_id: currentItemId,
          methods: RelatedItemsMethod.SimilarItems,
        }),
      { wrapper: TestProvider }
    );

    // Initial hook should be stable
    const initialHook = result.current;
    expect(initialHook).toBeDefined();

    // Change parameters multiple times
    for (let i = 2; i <= 5; i++) {
      currentItemId = `stability-test-${i}`;
      rerender();

      // Hook should remain stable and functional
      expect(result.current).toBeDefined();
      expect(typeof result.current.loading).toBe('boolean');
      expect(result.current.error).toBeNull();
    }

    // Test search parameter stability
    let currentFacets = [
      { name: 'brand' as const, value: ['stability-brand-1'] },
    ];

    const { result: searchResult, rerender: searchRerender } = renderHook(
      () => useFacettedSearch({ facets: currentFacets }),
      { wrapper: TestProvider }
    );

    // Change search parameters
    for (let i = 2; i <= 4; i++) {
      currentFacets = [
        { name: 'brand' as const, value: [`stability-brand-${i}`] },
      ];
      searchRerender();

      expect(searchResult.current).toBeDefined();
      expect(typeof searchResult.current.loading).toBe('boolean');
      expect(searchResult.current.error).toBeNull();
    }
  });
});
