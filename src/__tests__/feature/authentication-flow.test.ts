import { act, renderHook } from '@testing-library/react';
import React, { useContext } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DressipiContext } from '../../context/DressipiContext';
import { DressipiProvider } from '../../context/DressipiProvider';
import { RelatedItemsMethod } from '../../enums/RelatedItemsMethod';
import { ResponseFormat } from '../../enums/ResponseFormat';
import { useFacettedSearch } from '../../hooks/useFacettedSearch';
import { useRelatedItems } from '../../hooks/useRelatedItems';
import './setup';

describe('Authentication Flow Feature Tests', () => {
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

  it('should provide authentication context to child components', async () => {
    // Hook to access the context directly
    const useTestContext = () => useContext(DressipiContext);

    const { result: contextResult } = renderHook(() => useTestContext(), {
      wrapper: TestProvider,
    });

    // Context should be available
    expect(contextResult.current).toBeDefined();
    expect(contextResult.current.clientId).toBe('test-client-123');
    expect(contextResult.current.domain).toBe('api.dressipi.com');
    expect(contextResult.current.namespaceId).toBe('test-namespace');

    // Authentication-related properties should be available
    expect(contextResult.current).toHaveProperty('credentials');
    expect(contextResult.current).toHaveProperty('refreshAuthentication');
    expect(contextResult.current).toHaveProperty('queue');
    expect(contextResult.current).toHaveProperty('tracker');
  });

  it('should handle authentication state changes gracefully', async () => {
    let refreshCount = 0;

    // Hook to monitor authentication refresh calls
    const useAuthMonitor = () => {
      const context = useContext(DressipiContext);
      return {
        refreshAuthentication: () => {
          refreshCount++;
          return context.refreshAuthentication();
        },
        credentials: context.credentials,
      };
    };

    const { result: authResult } = renderHook(() => useAuthMonitor(), {
      wrapper: TestProvider,
    });

    // Test that refresh function is available and callable
    expect(authResult.current.refreshAuthentication).toBeDefined();
    expect(typeof authResult.current.refreshAuthentication).toBe('function');

    // Call refresh authentication
    act(() => {
      authResult.current.refreshAuthentication();
    });

    // Verify the function was called
    expect(refreshCount).toBe(1);
  });

  it('should handle authentication dependency for API calls', async () => {
    // Test related items hook with authentication dependency
    const { result: relatedItemsResult } = renderHook(
      () =>
        useRelatedItems({
          item_id: 'auth-test-item',
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
  });

  it('should handle search authentication dependency', async () => {
    // Test facetted search hook with authentication dependency
    const { result: searchResult } = renderHook(
      () =>
        useFacettedSearch({
          facets: [{ name: 'garment_category', value: ['dresses'] }],
          response_format: ResponseFormat.Detailed,
        }),
      { wrapper: TestProvider }
    );

    // Hook should initialize properly
    expect(searchResult.current).toBeDefined();
    expect(searchResult.current).toHaveProperty('loading');
    expect(searchResult.current).toHaveProperty('items');
    expect(searchResult.current).toHaveProperty('error');

    // Initial state should be correct
    expect(typeof searchResult.current.loading).toBe('boolean');
  });

  it('should maintain consistent authentication state across multiple hooks', async () => {
    // Test multiple hooks using the same authentication context
    const { result: relatedItemsResult } = renderHook(
      () =>
        useRelatedItems({
          item_id: 'consistency-test-item',
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

    // Both hooks should be properly initialized
    expect(relatedItemsResult.current).toBeDefined();
    expect(searchResult.current).toBeDefined();

    // Both should have consistent state structure
    expect(typeof relatedItemsResult.current.loading).toBe('boolean');
    expect(typeof searchResult.current.loading).toBe('boolean');

    // Both should handle the same authentication context
    expect(relatedItemsResult.current.error).toBeNull();
    expect(searchResult.current.error).toBeNull();
  });

  it('should handle provider configuration changes', async () => {
    // Test with different client configurations
    const AlternativeProvider: React.FC<{ children: React.ReactNode }> = ({
      children,
    }) =>
      React.createElement(
        DressipiProvider,
        {
          clientId: 'alternative-client-456',
          domain: 'staging.dressipi.com',
          namespaceId: 'staging-namespace',
        },
        children
      );

    const useTestContext = () => useContext(DressipiContext);

    const { result: contextResult } = renderHook(() => useTestContext(), {
      wrapper: AlternativeProvider,
    });

    // Context should reflect new configuration
    expect(contextResult.current.clientId).toBe('alternative-client-456');
    expect(contextResult.current.domain).toBe('staging.dressipi.com');
    expect(contextResult.current.namespaceId).toBe('staging-namespace');

    // Authentication infrastructure should still be available
    expect(contextResult.current.refreshAuthentication).toBeDefined();
    expect(contextResult.current).toHaveProperty('credentials');
    expect(contextResult.current).toHaveProperty('queue');
  });

  it('should handle concurrent authentication-dependent operations', async () => {
    // Test multiple hooks that depend on authentication running concurrently
    const hooks = [];

    // Create multiple related items hooks
    for (let i = 0; i < 3; i++) {
      const hook = renderHook(
        () =>
          useRelatedItems({
            item_id: `concurrent-item-${i}`,
            methods: [RelatedItemsMethod.SimilarItems],
          }),
        { wrapper: TestProvider }
      );
      hooks.push(hook);
    }

    // Create multiple search hooks
    for (let i = 0; i < 2; i++) {
      const hook = renderHook(
        () =>
          useFacettedSearch({
            facets: [{ name: 'garment_category', value: [`category-${i}`] }],
          }),
        { wrapper: TestProvider }
      );
      hooks.push(hook);
    }

    // All hooks should be properly initialized
    hooks.forEach((hook, index) => {
      expect(hook.result.current).toBeDefined();
      expect(typeof hook.result.current.loading).toBe('boolean');
    });

    // Verify no hooks have immediate errors (authentication should be shared)
    hooks.forEach((hook, index) => {
      expect(hook.result.current.error).toBeNull();
    });
  });

  it('should maintain authentication state during provider re-renders', async () => {
    const useTestContext = () => useContext(DressipiContext);

    const { result: contextResult, rerender } = renderHook(
      () => useTestContext(),
      { wrapper: TestProvider }
    );

    // Capture initial authentication state
    const initialCredentials = contextResult.current.credentials;
    const initialRefreshFunction = contextResult.current.refreshAuthentication;

    // Re-render the provider
    rerender();

    // Authentication state should remain consistent
    expect(contextResult.current.credentials).toBe(initialCredentials);
    expect(contextResult.current.refreshAuthentication).toBe(
      initialRefreshFunction
    );

    // Context values should remain the same
    expect(contextResult.current.clientId).toBe('test-client-123');
    expect(contextResult.current.domain).toBe('api.dressipi.com');
    expect(contextResult.current.namespaceId).toBe('test-namespace');
  });
});
