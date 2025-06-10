import { renderHook, waitFor } from '@testing-library/react';
import { isEqual } from 'lodash-es';
import React from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DressipiContext } from '../../../context/DressipiContext';
import { RelatedItemsMethod } from '../../../enums/RelatedItemsMethod';
import { ResponseFormat } from '../../../enums/ResponseFormat';
import { AuthenticationError } from '../../../errors/AuthenticationError';
import { RelatedItemsGarmentNotFoundError } from '../../../errors/RelatedItemsGarmentNotFoundError';
import { useRelatedItems } from '../../../hooks/useRelatedItems';
import * as relatedItemsMapping from '../../../mapping/mapRelatedItemsApiResponse';
import * as relatedItemsService from '../../../services/related-items';
import {
  RelatedItemsApiRequest,
  RelatedItemsApiResponse,
  RelatedItemsMappedResponse,
} from '../../../types/related-items';
import * as httpUtils from '../../../utils/http';

// Mock all dependencies
vi.mock('lodash-es');
vi.mock('use-deep-compare-effect');
vi.mock('../../../services/related-items');
vi.mock('../../../mapping/mapRelatedItemsApiResponse');
vi.mock('../../../utils/http');

const mockedIsEqual = vi.mocked(isEqual);
const mockedUseDeepCompareEffect = vi.mocked(useDeepCompareEffect);
const mockedRelatedItemsService = vi.mocked(relatedItemsService);
const mockedRelatedItemsMapping = vi.mocked(relatedItemsMapping);
const mockedHttpUtils = vi.mocked(httpUtils);

describe('useRelatedItems hook', () => {
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

  const mockRequest: RelatedItemsApiRequest = {
    item_id: 'DRESS_001',
    response_format: ResponseFormat.Detailed,
    methods: [RelatedItemsMethod.Outfits],
    max_similar_items: 10,
  };

  const mockApiResponse: RelatedItemsApiResponse = {
    event_id: 'event_12345',
    source: {
      garment_id: 'DRESS_001',
      raw_garment_id: 1,
    },
    garment_data: [
      {
        id: 1,
        product_code: 'DRESS_001',
        name: 'Test Dress',
        brand_name: 'Test Brand',
        price: '99.99',
        url: 'https://example.com/dress',
        garment_category_id: 10,
        garment_category_name: 'Dresses',
        department: 'female',
        image_url: 'https://example.com/image.jpg',
        product_id: 'PROD_001',
        partner: 'Partner A',
        retailer: 'Retailer A',
        rating: '4.5',
        why: [],
        has_outfits: true,
        garment_status: 'in stock',
        feed_image_urls: ['https://example.com/image.jpg'],
      },
    ],
    reparentable: true,
    outfits: [],
    partner_outfits: [],
    similar_items: {
      content_id: 'similar_123',
      items: [],
    },
  };

  const mockMappedResponse: RelatedItemsMappedResponse = {
    response_id: 'event_12345',
    outfits: [],
    partner_outfits: [],
    similar_items: {
      content_id: 'similar_123',
      items: [],
    },
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

    // Mock useDeepCompareEffect to behave like useEffect
    mockedUseDeepCompareEffect.mockImplementation((callback, deps) => {
      React.useEffect(callback, deps);
    });

    // Default mock implementations
    mockedIsEqual.mockReturnValue(false);
    mockedHttpUtils.createQueryParameters.mockReturnValue({
      response_format: 'detailed',
    });
    mockedRelatedItemsService.getRelatedItems.mockResolvedValue(
      mockApiResponse
    );
    mockedRelatedItemsMapping.mapRelatedItemsApiResponse.mockReturnValue(
      mockMappedResponse
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state and loading', () => {
    it('should start with loading state', () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useRelatedItems(mockRequest), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.relatedItems).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should not make API call when credentials are not available', () => {
      const contextWithoutCredentials = {
        ...mockContextValue,
        credentials: null,
      };

      const TestWrapper = createTestWrapper(contextWithoutCredentials);

      renderHook(() => useRelatedItems(mockRequest), {
        wrapper: TestWrapper,
      });

      expect(mockedRelatedItemsService.getRelatedItems).not.toHaveBeenCalled();
    });

    it('should not make API call when request has not changed', () => {
      mockedIsEqual.mockReturnValue(true);

      const TestWrapper = createTestWrapper(mockContextValue);
      renderHook(() => useRelatedItems(mockRequest), {
        wrapper: TestWrapper,
      });

      expect(mockedRelatedItemsService.getRelatedItems).not.toHaveBeenCalled();
    });
  });

  describe('successful data fetching', () => {
    it('should fetch related items successfully', async () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useRelatedItems(mockRequest), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.relatedItems).toEqual(mockMappedResponse);
      expect(result.current.error).toBe(null);

      expect(mockedHttpUtils.createQueryParameters).toHaveBeenCalledWith({
        ...mockRequest,
        response_format: ResponseFormat.Detailed,
      });

      expect(mockedRelatedItemsService.getRelatedItems).toHaveBeenCalledWith(
        mockDomain,
        { response_format: 'detailed' },
        mockRequest.item_id,
        mockCredentials
      );

      expect(
        mockedRelatedItemsMapping.mapRelatedItemsApiResponse
      ).toHaveBeenCalledWith(mockApiResponse, ResponseFormat.Detailed);
    });

    it('should handle minimal request with only item_id', async () => {
      const minimalRequest: RelatedItemsApiRequest = {
        item_id: 'SIMPLE_ITEM',
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useRelatedItems(minimalRequest), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.relatedItems).toEqual(mockMappedResponse);
      expect(mockedRelatedItemsService.getRelatedItems).toHaveBeenCalledWith(
        mockDomain,
        { response_format: 'detailed' },
        'SIMPLE_ITEM',
        mockCredentials
      );
    });

    it('should handle complex request with all parameters', async () => {
      const complexRequest: RelatedItemsApiRequest = {
        item_id: 'COMPLEX_ITEM',
        response_format: ResponseFormat.Detailed,
        methods: [RelatedItemsMethod.Outfits, RelatedItemsMethod.SimilarItems],
        try_all_methods: true,
        outfits_per_occasion: 3,
        max_similar_items: 20,
        max_reduced_by: 50,
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useRelatedItems(complexRequest), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedHttpUtils.createQueryParameters).toHaveBeenCalledWith({
        ...complexRequest,
        response_format: ResponseFormat.Detailed,
      });
    });
  });

  describe('error handling', () => {
    it('should handle missing item_id error', async () => {
      const requestWithoutItemId: RelatedItemsApiRequest = {
        response_format: ResponseFormat.Detailed,
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(
        () => useRelatedItems(requestWithoutItemId),
        {
          wrapper: TestWrapper,
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.relatedItems).toBe(null);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain(
        'You must pass an item_id to get related items'
      );

      expect(mockedRelatedItemsService.getRelatedItems).not.toHaveBeenCalled();
    });

    it('should handle authentication errors with refresh attempt', async () => {
      const authError = new AuthenticationError('Token expired');
      mockedRelatedItemsService.getRelatedItems.mockRejectedValueOnce(
        authError
      );

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useRelatedItems(mockRequest), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(mockRefreshAuthentication).toHaveBeenCalled();
      });

      expect(result.current.loading).toBe(true); // Should still be loading after refresh attempt
    });

    it('should handle authentication refresh failure', async () => {
      const authError = new AuthenticationError('Token expired');
      const refreshError = new Error('Refresh failed');

      mockedRelatedItemsService.getRelatedItems.mockRejectedValue(authError);
      mockRefreshAuthentication.mockRejectedValue(refreshError);

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useRelatedItems(mockRequest), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.relatedItems).toBe(null);
      expect(result.current.error).toBe(refreshError);
    });

    it('should handle RelatedItemsGarmentNotFoundError gracefully', async () => {
      const notFoundError = new RelatedItemsGarmentNotFoundError(
        'Garment not found'
      );
      mockedRelatedItemsService.getRelatedItems.mockRejectedValue(
        notFoundError
      );

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useRelatedItems(mockRequest), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.relatedItems).toBe(null);
      expect(result.current.error).toBe(null); // Should not treat as error
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Network error');
      mockedRelatedItemsService.getRelatedItems.mockRejectedValue(genericError);

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useRelatedItems(mockRequest), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.relatedItems).toBe(null);
      expect(result.current.error).toBe(genericError);
    });
  });

  describe('request optimization', () => {
    it('should skip API call when request is identical', () => {
      mockedIsEqual.mockReturnValue(true);

      const TestWrapper = createTestWrapper(mockContextValue);
      const { rerender } = renderHook(() => useRelatedItems(mockRequest), {
        wrapper: TestWrapper,
      });

      // Clear the mock to reset call count
      mockedRelatedItemsService.getRelatedItems.mockClear();

      // Rerender with same request
      rerender();

      expect(mockedRelatedItemsService.getRelatedItems).not.toHaveBeenCalled();
    });

    it('should make API call when request changes', async () => {
      mockedIsEqual.mockReturnValue(false);

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result, rerender } = renderHook(
        (props: { request: RelatedItemsApiRequest }) =>
          useRelatedItems(props.request),
        {
          wrapper: TestWrapper,
          initialProps: { request: mockRequest },
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedRelatedItemsService.getRelatedItems).toHaveBeenCalledTimes(
        1
      );

      // Change request
      const newRequest = { ...mockRequest, max_similar_items: 20 };
      rerender({ request: newRequest });

      expect(mockedRelatedItemsService.getRelatedItems).toHaveBeenCalledTimes(
        2
      );
    });
  });

  describe('context dependency', () => {
    it('should make API call when credentials are available', async () => {
      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useRelatedItems(mockRequest), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedRelatedItemsService.getRelatedItems).toHaveBeenCalledWith(
        mockDomain,
        { response_format: 'detailed' },
        mockRequest.item_id,
        mockCredentials
      );
    });

    it('should use the domain from context', async () => {
      const customDomain = 'custom-api.dressipi.com';
      const customContextValue = {
        ...mockContextValue,
        domain: customDomain,
      };

      const TestWrapper = createTestWrapper(customContextValue);
      const { result } = renderHook(() => useRelatedItems(mockRequest), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedRelatedItemsService.getRelatedItems).toHaveBeenCalledWith(
        customDomain,
        { response_format: 'detailed' },
        mockRequest.item_id,
        mockCredentials
      );
    });
  });

  describe('real-world scenarios', () => {
    it('should handle empty response data', async () => {
      const emptyResponse: RelatedItemsApiResponse = {
        ...mockApiResponse,
        garment_data: [],
        outfits: [],
        partner_outfits: [],
        similar_items: { content_id: '', items: [] },
      };

      const emptyMappedResponse: RelatedItemsMappedResponse = {
        response_id: 'event_12345',
        outfits: [],
        partner_outfits: [],
        similar_items: { content_id: '', items: [] },
      };

      mockedRelatedItemsService.getRelatedItems.mockResolvedValue(
        emptyResponse
      );
      mockedRelatedItemsMapping.mapRelatedItemsApiResponse.mockReturnValue(
        emptyMappedResponse
      );

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useRelatedItems(mockRequest), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.relatedItems).toEqual(emptyMappedResponse);
      expect(result.current.error).toBe(null);
    });

    it('should work with different request parameters', async () => {
      const customRequest: RelatedItemsApiRequest = {
        item_id: 'CUSTOM_ITEM',
        max_similar_items: 5,
      };

      const TestWrapper = createTestWrapper(mockContextValue);
      const { result } = renderHook(() => useRelatedItems(customRequest), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedRelatedItemsService.getRelatedItems).toHaveBeenCalledWith(
        mockDomain,
        { response_format: 'detailed' },
        'CUSTOM_ITEM',
        mockCredentials
      );
    });
  });
});
