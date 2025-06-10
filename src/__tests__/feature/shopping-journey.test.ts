import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DressipiProvider } from '../../context/DressipiProvider';
import { RelatedItemsMethod } from '../../enums/RelatedItemsMethod';
import { ResponseFormat } from '../../enums/ResponseFormat';
import { useDressipiTracking } from '../../hooks/useDressipiTracking';
import { useFacettedSearch } from '../../hooks/useFacettedSearch';
import { useRelatedItems } from '../../hooks/useRelatedItems';
import './setup';

describe('Shopping Journey Feature Tests', () => {
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
  });

  it('should provide tracking functionality without authentication dependency', async () => {
    // Test tracking functionality which doesn't require authentication
    const { result: trackingResult } = renderHook(() => useDressipiTracking(), {
      wrapper: TestProvider,
    });

    // Verify tracking methods are available
    expect(trackingResult.current.productDisplayPage).toBeDefined();
    expect(trackingResult.current.addToBasket).toBeDefined();
    expect(trackingResult.current.removeFromBasket).toBeDefined();
    expect(trackingResult.current.order).toBeDefined();
    expect(trackingResult.current.productListPage).toBeDefined();
    expect(trackingResult.current.identify).toBeDefined();

    // Test that tracking methods can be called without errors
    act(() => {
      trackingResult.current.productDisplayPage({
        productCode: 'TEST-PRODUCT',
        sku: 'TEST-SKU',
        name: 'Test Product',
        price: '99.99',
      });
    });

    act(() => {
      trackingResult.current.addToBasket({
        sku: 'TEST-SKU',
        name: 'Test Product',
        price: '99.99',
        quantity: 1,
      });
    });

    act(() => {
      trackingResult.current.order({
        orderId: 'TEST-ORDER',
        totalValue: 99.99,
        items: [
          {
            sku: 'TEST-SKU',
            name: 'Test Product',
            price: 99.99,
            quantity: 1,
          },
        ],
      });
    });

    // All methods should still be available after use
    expect(trackingResult.current.productDisplayPage).toBeDefined();
    expect(trackingResult.current.addToBasket).toBeDefined();
    expect(trackingResult.current.order).toBeDefined();
  });

  it('should handle hook initialization properly', async () => {
    // Test that hooks can be initialized without throwing errors
    const { result: relatedItemsResult } = renderHook(
      () =>
        useRelatedItems({
          item_id: 'test-item',
          methods: [RelatedItemsMethod.SimilarItems],
          response_format: ResponseFormat.Detailed,
        }),
      { wrapper: TestProvider }
    );

    const { result: searchResult } = renderHook(
      () =>
        useFacettedSearch({
          facets: [{ name: 'garment_category', value: ['dresses'] }],
          response_format: ResponseFormat.Detailed,
        }),
      { wrapper: TestProvider }
    );

    // Hooks should initialize with proper state structure
    expect(relatedItemsResult.current).toHaveProperty('loading');
    expect(relatedItemsResult.current).toHaveProperty('relatedItems');
    expect(relatedItemsResult.current).toHaveProperty('error');

    expect(searchResult.current).toHaveProperty('loading');
    expect(searchResult.current).toHaveProperty('items');
    expect(searchResult.current).toHaveProperty('error');

    // Initial states should be correct
    expect(typeof relatedItemsResult.current.loading).toBe('boolean');
    expect(typeof searchResult.current.loading).toBe('boolean');
  });

  it('should maintain hook reference stability', async () => {
    const { result: trackingResult, rerender } = renderHook(
      () => useDressipiTracking(),
      { wrapper: TestProvider }
    );

    const initialTrackingMethods = {
      productDisplayPage: trackingResult.current.productDisplayPage,
      addToBasket: trackingResult.current.addToBasket,
      removeFromBasket: trackingResult.current.removeFromBasket,
      order: trackingResult.current.order,
    };

    // Re-render the hook
    rerender();

    // Methods should maintain reference equality
    expect(trackingResult.current.productDisplayPage).toBe(
      initialTrackingMethods.productDisplayPage
    );
    expect(trackingResult.current.addToBasket).toBe(
      initialTrackingMethods.addToBasket
    );
    expect(trackingResult.current.removeFromBasket).toBe(
      initialTrackingMethods.removeFromBasket
    );
    expect(trackingResult.current.order).toBe(initialTrackingMethods.order);
  });

  it('should handle complex tracking scenarios', async () => {
    const { result: trackingResult } = renderHook(() => useDressipiTracking(), {
      wrapper: TestProvider,
    });

    // Simulate a complete e-commerce journey
    act(() => {
      // User identifies themselves
      trackingResult.current.identify({
        customerId: 'customer-123',
        email: 'test@example.com',
      });

      // User views a product list
      trackingResult.current.productListPage({
        page: { number: 1 },
        items: [
          { productCode: 'PROD-1' },
          { productCode: 'PROD-2' },
          { productCode: 'PROD-3' },
        ],
        filters: [{ name: 'category', selected: ['clothing'] }],
      });

      // User views individual products
      trackingResult.current.productDisplayPage({
        productCode: 'PROD-1',
        sku: 'SKU-1',
        name: 'Product 1',
        price: '79.99',
      });

      trackingResult.current.productDisplayPage({
        productCode: 'PROD-2',
        sku: 'SKU-2',
        name: 'Product 2',
        price: '129.99',
      });

      // User adds items to basket
      trackingResult.current.addToBasket({
        sku: 'SKU-1',
        name: 'Product 1',
        price: '79.99',
        quantity: 1,
      });

      trackingResult.current.addToBasket({
        sku: 'SKU-2',
        name: 'Product 2',
        price: '129.99',
        quantity: 2,
      });

      // User changes mind, removes one item
      trackingResult.current.removeFromBasket({
        sku: 'SKU-2',
        name: 'Product 2',
        price: '129.99',
        quantity: 1,
      });

      // User completes purchase
      trackingResult.current.order({
        orderId: 'ORDER-456',
        totalValue: 209.98,
        items: [
          { sku: 'SKU-1', name: 'Product 1', price: 79.99, quantity: 1 },
          { sku: 'SKU-2', name: 'Product 2', price: 129.99, quantity: 1 },
        ],
        currency: 'USD',
      });
    });

    // Verify all tracking methods remain functional
    expect(trackingResult.current.identify).toBeDefined();
    expect(trackingResult.current.productListPage).toBeDefined();
    expect(trackingResult.current.productDisplayPage).toBeDefined();
    expect(trackingResult.current.addToBasket).toBeDefined();
    expect(trackingResult.current.removeFromBasket).toBeDefined();
    expect(trackingResult.current.order).toBeDefined();
  });

  it('should demonstrate cross-hook integration readiness', async () => {
    // Test that multiple hooks can be used together without conflicts
    const { result: trackingResult } = renderHook(() => useDressipiTracking(), {
      wrapper: TestProvider,
    });

    const { result: relatedItemsResult } = renderHook(
      () =>
        useRelatedItems({
          item_id: 'integration-test-item',
          methods: [RelatedItemsMethod.SimilarItems],
        }),
      { wrapper: TestProvider }
    );

    const { result: searchResult } = renderHook(
      () =>
        useFacettedSearch({
          facets: [{ name: 'brand', value: ['nike'] }],
        }),
      { wrapper: TestProvider }
    );

    // All hooks should be properly initialized
    expect(trackingResult.current).toBeDefined();
    expect(relatedItemsResult.current).toBeDefined();
    expect(searchResult.current).toBeDefined();

    // Tracking should work while other hooks are present
    act(() => {
      trackingResult.current.productDisplayPage({
        productCode: 'INTEGRATION-PRODUCT',
        sku: 'INTEGRATION-SKU',
        name: 'Integration Test Product',
        price: '149.99',
      });
    });

    // All hooks should maintain their interfaces
    expect(typeof trackingResult.current.order).toBe('function');
    expect(typeof relatedItemsResult.current.loading).toBe('boolean');
    expect(typeof searchResult.current.loading).toBe('boolean');
  });
});
