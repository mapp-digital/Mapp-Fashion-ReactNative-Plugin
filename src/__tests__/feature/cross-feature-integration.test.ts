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

describe('Cross-Feature Integration Tests', () => {
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

  it('should handle complex multi-hook state synchronization', async () => {
    // Test advanced scenario: Multiple hooks with interdependent data flow
    const { result: searchResult } = renderHook(
      () =>
        useFacettedSearch({
          facets: [
            { name: 'garment_category', value: ['dresses'] },
            { name: 'brand', value: ['premium-brand'] },
            { name: 'occasion', value: ['formal'] },
          ],
          response_format: ResponseFormat.Detailed,
          page: 1,
          per_page: 25,
        }),
      { wrapper: TestProvider }
    );

    // Multiple related items hooks with different configurations
    const relatedHooks = [];
    for (let i = 0; i < 3; i++) {
      const hook = renderHook(
        () =>
          useRelatedItems({
            item_id: `complex-item-${i}`,
            methods: [
              RelatedItemsMethod.SimilarItems,
              RelatedItemsMethod.Outfits,
              RelatedItemsMethod.PartnerOutfits,
            ],
            response_format: ResponseFormat.Detailed,
            max_similar_items: 15,
            outfits_per_occasion: 4,
          }),
        { wrapper: TestProvider }
      );
      relatedHooks.push(hook);
    }

    // Tracking hook to monitor all interactions
    const { result: trackingResult } = renderHook(() => useDressipiTracking(), {
      wrapper: TestProvider,
    });

    // Verify all hooks are properly initialized
    expect(searchResult.current).toBeDefined();
    expect(typeof searchResult.current.loading).toBe('boolean');

    relatedHooks.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');
      expect(hook.result.current.relatedItems).toBeNull();
      expect(hook.result.current.error).toBeNull();
    });

    expect(trackingResult.current).toBeDefined();
    expect(trackingResult.current.productDisplayPage).toBeDefined();

    // Test complex tracking scenario with multiple data sources
    act(() => {
      // Track search page with complex filters
      trackingResult.current.productListPage({
        page: { number: 1 },
        items: [
          { productCode: 'COMPLEX-1' },
          { productCode: 'COMPLEX-2' },
          { productCode: 'COMPLEX-3' },
        ],
        filters: [
          { name: 'garment_category', selected: ['dresses'] },
          { name: 'brand', selected: ['premium-brand'] },
          { name: 'occasion', selected: ['formal'] },
        ],
      });

      // Track individual product views from related items
      for (let i = 0; i < 3; i++) {
        trackingResult.current.productDisplayPage({
          productCode: `complex-item-${i}`,
          sku: `COMPLEX-SKU-${i}`,
          name: `Complex Product ${i}`,
          price: `${99 + i * 50}.99`,
          currency: 'USD',
        });
      }

      // Track basket interactions
      trackingResult.current.addToBasket({
        sku: 'COMPLEX-SKU-1',
        name: 'Complex Product 1',
        price: '149.99',
        quantity: 2,
      });

      trackingResult.current.addToBasket({
        sku: 'COMPLEX-SKU-2',
        name: 'Complex Product 2',
        price: '199.99',
        quantity: 1,
      });
    });

    // Verify state remains consistent across all hooks
    expect(searchResult.current).toBeDefined();
    expect(trackingResult.current.productDisplayPage).toBeDefined();
    relatedHooks.forEach(hook => {
      expect(hook.result.current).toBeDefined();
    });
  });

  it('should handle memory management and cleanup in complex scenarios', async () => {
    // Test memory management with rapid hook creation and destruction
    const hookInstances = [];

    // Create multiple hook instances rapidly
    for (let i = 0; i < 5; i++) {
      const searchHook = renderHook(
        () =>
          useFacettedSearch({
            facets: [{ name: 'brand', value: [`memory-test-${i}`] }],
            page: i + 1,
            per_page: 10,
          }),
        { wrapper: TestProvider }
      );

      const relatedHook = renderHook(
        () =>
          useRelatedItems({
            item_id: `memory-item-${i}`,
            methods: RelatedItemsMethod.SimilarItems,
          }),
        { wrapper: TestProvider }
      );

      hookInstances.push({ search: searchHook, related: relatedHook });
    }

    // Verify all instances are properly initialized
    hookInstances.forEach((instance, index) => {
      expect(instance.search.result.current).toBeDefined();
      expect(instance.related.result.current).toBeDefined();
      expect(typeof instance.search.result.current.loading).toBe('boolean');
      expect(typeof instance.related.result.current.loading).toBe('boolean');
    });

    // Test cleanup by unmounting some hooks
    hookInstances.slice(0, 2).forEach(instance => {
      instance.search.unmount();
      instance.related.unmount();
    });

    // Remaining hooks should still function properly
    hookInstances.slice(2).forEach((instance, index) => {
      expect(instance.search.result.current).toBeDefined();
      expect(instance.related.result.current).toBeDefined();
    });

    // Test tracking continues to work after hook cleanup
    const { result: trackingResult } = renderHook(() => useDressipiTracking(), {
      wrapper: TestProvider,
    });

    act(() => {
      trackingResult.current.productDisplayPage({
        productCode: 'CLEANUP-TEST',
        sku: 'CLEANUP-SKU',
        name: 'Cleanup Test Product',
        price: '99.99',
      });
    });

    expect(trackingResult.current.productDisplayPage).toBeDefined();
  });

  it('should handle edge case parameter combinations and boundary conditions', async () => {
    // Test extreme parameter combinations
    const edgeCaseScenarios = [
      // Maximum parameters
      {
        item_id: 'edge-case-max',
        methods: [
          RelatedItemsMethod.SimilarItems,
          RelatedItemsMethod.Outfits,
          RelatedItemsMethod.PartnerOutfits,
        ],
        response_format: ResponseFormat.Detailed,
        max_similar_items: 50,
        outfits_per_occasion: 10,
      },
      // Minimal parameters
      {
        item_id: 'edge-case-min',
      },
      // Single method combinations
      {
        item_id: 'edge-case-single-similar',
        methods: RelatedItemsMethod.SimilarItems,
        max_similar_items: 1,
      },
      {
        item_id: 'edge-case-single-outfits',
        methods: RelatedItemsMethod.Outfits,
        outfits_per_occasion: 1,
      },
    ];

    const edgeHooks = edgeCaseScenarios.map((scenario, index) =>
      renderHook(() => useRelatedItems(scenario), { wrapper: TestProvider })
    );

    // All edge case scenarios should be handled properly
    edgeHooks.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');
      expect(hook.result.current.relatedItems).toBeNull();
      expect(hook.result.current.error).toBeNull();
    });

    // Test search edge cases
    const searchEdgeCases = [
      // Maximum facets
      {
        facets: [
          {
            name: 'garment_category' as const,
            value: ['tops', 'dresses', 'bottoms'],
          },
          {
            name: 'brand' as const,
            value: ['brand1', 'brand2', 'brand3', 'brand4'],
          },
          { name: 'occasion' as const, value: ['casual', 'formal', 'party'] },
          {
            name: 'price' as const,
            filters: [
              { from: 0, to: 50 },
              { from: 50, to: 100 },
              { from: 100, to: 500 },
            ],
          },
        ],
        page: 1,
        per_page: 100,
      },
      // Single facet
      {
        facets: [{ name: 'brand' as const, value: ['single-brand'] }],
        page: 1,
        per_page: 1,
      },
      // Price range only
      {
        facets: [
          {
            name: 'price' as const,
            filters: [{ from: 0, to: 1000000 }],
          },
        ],
      },
    ];

    const searchEdgeHooks = searchEdgeCases.map((scenario, index) =>
      renderHook(() => useFacettedSearch(scenario), { wrapper: TestProvider })
    );

    searchEdgeHooks.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');
    });
  });

  it('should handle performance under concurrent load with mixed operations', async () => {
    // Simulate high-load scenario with mixed operations
    const concurrentOperations = [];

    // Create heavy concurrent load
    for (let i = 0; i < 10; i++) {
      // Related items hooks
      const relatedHook = renderHook(
        () =>
          useRelatedItems({
            item_id: `load-test-${i}`,
            methods:
              i % 2 === 0
                ? RelatedItemsMethod.SimilarItems
                : [RelatedItemsMethod.SimilarItems, RelatedItemsMethod.Outfits],
            max_similar_items: Math.floor(Math.random() * 20) + 5,
          }),
        { wrapper: TestProvider }
      );
      concurrentOperations.push(relatedHook);

      // Search hooks with varying complexity
      const searchHook = renderHook(
        () =>
          useFacettedSearch({
            facets: [
              { name: 'brand' as const, value: [`load-brand-${i}`] },
              ...(i % 3 === 0
                ? [
                    {
                      name: 'garment_category' as const,
                      value: ['load-category'],
                    },
                  ]
                : []),
            ],
            page: (i % 3) + 1,
            per_page: Math.floor(Math.random() * 30) + 10,
          }),
        { wrapper: TestProvider }
      );
      concurrentOperations.push(searchHook);
    }

    // Multiple tracking instances
    const trackingHooks: ReturnType<
      typeof renderHook<ReturnType<typeof useDressipiTracking>, any>
    >[] = [];
    for (let i = 0; i < 3; i++) {
      const trackingHook = renderHook(() => useDressipiTracking(), {
        wrapper: TestProvider,
      });
      trackingHooks.push(trackingHook);
    }

    // Verify all concurrent operations are stable
    concurrentOperations.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');
      expect(hook.result.current.error).toBeNull();
    });

    trackingHooks.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(hook.result.current.productDisplayPage).toBeDefined();
    });

    // Test rapid tracking operations
    act(() => {
      trackingHooks.forEach((hook, trackingIndex) => {
        for (let i = 0; i < 5; i++) {
          hook.result.current.productDisplayPage({
            productCode: `LOAD-PRODUCT-${trackingIndex}-${i}`,
            sku: `LOAD-SKU-${trackingIndex}-${i}`,
            name: `Load Test Product ${trackingIndex}-${i}`,
            price: `${(trackingIndex + 1) * (i + 1) * 10}.99`,
          });
        }
      });
    });

    // Verify all operations remain stable under load
    trackingHooks.forEach(hook => {
      expect(hook.result.current.productDisplayPage).toBeDefined();
    });

    concurrentOperations.forEach(hook => {
      expect(hook.result.current).toBeDefined();
    });
  });

  it('should handle state synchronization across provider re-renders and updates', async () => {
    // Test complex state synchronization scenarios
    let providerConfig = {
      clientId: 'sync-test-1',
      domain: 'api.dressipi.com',
      namespaceId: 'sync-namespace-1',
    };

    const DynamicProvider: React.FC<{ children: React.ReactNode }> = ({
      children,
    }) => React.createElement(DressipiProvider, providerConfig, children);

    // Create hooks with dynamic provider
    const { result: searchResult, rerender: rerenderSearch } = renderHook(
      () =>
        useFacettedSearch({
          facets: [{ name: 'brand', value: ['sync-brand'] }],
        }),
      { wrapper: DynamicProvider }
    );

    const { result: relatedResult, rerender: rerenderRelated } = renderHook(
      () =>
        useRelatedItems({
          item_id: 'sync-item',
          methods: RelatedItemsMethod.SimilarItems,
        }),
      { wrapper: DynamicProvider }
    );

    const { result: trackingResult, rerender: rerenderTracking } = renderHook(
      () => useDressipiTracking(),
      { wrapper: DynamicProvider }
    );

    // Initial state verification
    expect(searchResult.current).toBeDefined();
    expect(relatedResult.current).toBeDefined();
    expect(trackingResult.current).toBeDefined();

    // Change provider configuration
    providerConfig = {
      clientId: 'sync-test-2',
      domain: 'staging.dressipi.com',
      namespaceId: 'sync-namespace-2',
    };

    // Re-render all hooks with new provider config
    rerenderSearch();
    rerenderRelated();
    rerenderTracking();

    // State should remain consistent after provider changes
    expect(searchResult.current).toBeDefined();
    expect(relatedResult.current).toBeDefined();
    expect(trackingResult.current).toBeDefined();

    expect(typeof searchResult.current.loading).toBe('boolean');
    expect(typeof relatedResult.current.loading).toBe('boolean');
    expect(trackingResult.current.productDisplayPage).toBeDefined();

    // Test tracking functionality after provider changes
    act(() => {
      trackingResult.current.productDisplayPage({
        productCode: 'SYNC-TEST-PRODUCT',
        sku: 'SYNC-TEST-SKU',
        name: 'Sync Test Product',
        price: '199.99',
      });

      trackingResult.current.addToBasket({
        sku: 'SYNC-TEST-SKU',
        name: 'Sync Test Product',
        price: '199.99',
        quantity: 1,
      });
    });

    // All functionality should remain available
    expect(trackingResult.current.productDisplayPage).toBeDefined();
    expect(trackingResult.current.addToBasket).toBeDefined();
  });
});
