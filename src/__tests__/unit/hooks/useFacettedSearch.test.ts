import { renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DressipiContext } from '../../../context/DressipiContext';
import { ResponseFormat } from '../../../enums/ResponseFormat';
import { useFacettedSearch } from '../../../hooks/useFacettedSearch';

// Mock dependencies
vi.mock('lodash-es');
vi.mock('use-deep-compare-effect');
vi.mock('../../../services/facetted-search');
vi.mock('../../../mapping/mapFacettedSearchApiResponse');
vi.mock('../../../utils/http');

describe('useFacettedSearch hook', () => {
  const mockCredentials = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'Bearer',
    expires_in: 3600,
  };

  const mockDomain = 'api.dressipi.com';
  const mockRefreshAuthentication = vi.fn();

  const mockContextValue = {
    credentials: mockCredentials,
    domain: mockDomain,
    refreshAuthentication: mockRefreshAuthentication,
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

  describe('initial state', () => {
    it('should initialize with correct default state', () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch(), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.items).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle empty request object', () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch({}), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.items).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle request with facets', () => {
      const request = {
        facets: [
          {
            name: 'garment_category' as const,
            value: ['dresses', 'tops'],
          },
        ],
        response_format: ResponseFormat.Detailed,
        page: 1,
        per_page: 20,
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch(request), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.items).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle complex facet structures', () => {
      const request = {
        facets: [
          {
            name: 'price' as const,
            filters: [
              { from: 0, to: 100 },
              { from: 200, to: 500 },
            ],
          },
          {
            name: 'brand' as const,
            value: ['Nike', 'Adidas'],
          },
        ],
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch(request), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.items).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  describe('context integration', () => {
    it('should work with valid context', () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toEqual({
        loading: false,
        items: null,
        error: null,
      });
    });

    it('should work with null credentials', () => {
      const contextWithoutCredentials = {
        ...mockContextValue,
        credentials: null,
      };

      const TestWrapper = createTestWrapper(contextWithoutCredentials);
      const { result } = renderHook(() => useFacettedSearch(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toEqual({
        loading: false,
        items: null,
        error: null,
      });
    });

    it('should work with custom domain', () => {
      const customContextValue = {
        ...mockContextValue,
        domain: 'custom-api.example.com',
      };

      const TestWrapper = createTestWrapper(customContextValue);
      const { result } = renderHook(() => useFacettedSearch(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toEqual({
        loading: false,
        items: null,
        error: null,
      });
    });
  });

  describe('request variations', () => {
    it('should handle pagination parameters', () => {
      const request = {
        page: 5,
        per_page: 30,
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch(request), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
    });

    it('should handle response format specification', () => {
      const request = {
        response_format: ResponseFormat.Detailed,
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch(request), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
    });

    it('should handle single filter facets', () => {
      const request = {
        facets: [
          {
            name: 'brand' as const,
            value: ['Nike'],
          },
        ],
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch(request), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
    });

    it('should handle multiple filter facets', () => {
      const request = {
        facets: [
          {
            name: 'garment_category' as const,
            value: ['dresses', 'skirts', 'tops'],
          },
          {
            name: 'occasion' as const,
            value: ['work', 'casual'],
          },
        ],
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch(request), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
    });

    it('should handle range filters', () => {
      const request = {
        facets: [
          {
            name: 'price' as const,
            filters: [
              { from: 10, to: 50 },
              { from: 100, to: 200 },
            ],
          },
        ],
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch(request), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('hook interface', () => {
    it('should return the expected state structure', () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('items');
      expect(result.current).toHaveProperty('error');
      expect(typeof result.current.loading).toBe('boolean');
    });

    it('should maintain stable reference when request is unchanged', () => {
      const request = { page: 1 };
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result, rerender } = renderHook(
        () => useFacettedSearch(request),
        {
          wrapper: TestWrapper,
        }
      );

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });
  });

  describe('facet dimension support', () => {
    it('should support garment_category facet', () => {
      const request = {
        facets: [
          {
            name: 'garment_category' as const,
            value: ['dresses'],
          },
        ],
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch(request), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
    });

    it('should support brand facet', () => {
      const request = {
        facets: [
          {
            name: 'brand' as const,
            value: ['Nike'],
          },
        ],
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch(request), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
    });

    it('should support occasion facet', () => {
      const request = {
        facets: [
          {
            name: 'occasion' as const,
            value: ['casual'],
          },
        ],
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch(request), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
    });

    it('should support price range facet', () => {
      const request = {
        facets: [
          {
            name: 'price' as const,
            filters: [{ from: 20, to: 100 }],
          },
        ],
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useFacettedSearch(request), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
    });
  });
});
