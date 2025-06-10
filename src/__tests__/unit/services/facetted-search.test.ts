import axios, { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationError } from '../../../errors/AuthenticationError';
import { performFacettedSearch } from '../../../services/facetted-search';
import { AuthCredentials } from '../../../types/auth';
import {
  FacettedSearchApiRequest,
  FacettedSearchApiResponse,
} from '../../../types/facetted-search';

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockedAxios = axios as any;

describe('facetted-search service', () => {
  const mockDomain = 'api.dressipi.com';
  const mockCredentials: AuthCredentials = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'Bearer',
    expires_in: 3600,
  };

  const mockParameters = {
    page: '1',
    per_page: '20',
  };

  const mockRequest: FacettedSearchApiRequest = {
    facets: [
      {
        name: 'garment_category',
        value: ['dresses', 'tops'],
      },
      {
        name: 'brand',
        value: ['test-brand', 'another-brand'],
      },
    ],
  };

  const mockApiResponse: FacettedSearchApiResponse = {
    event_id: 'search_event_12345',
    content_id: 'search_content_abc',
    recommendations: [
      {
        garment_id: 'DRESS_001',
        raw_garment_id: 1,
        has_outfits: true,
        retailer: 'Fashion Store',
        feed_image_urls: ['https://example.com/dress.jpg'],
        brand_name: 'Test Brand',
        name: 'Test Dress',
        price: '99.99',
        old_price: '129.99',
        url: 'https://example.com/dress',
        garment_status: 'in stock',
      },
    ],
    pagination: {
      total_pages: 5,
      total_entries: 100,
      current_page: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('successful requests', () => {
    beforeEach(() => {
      mockedAxios.post.mockResolvedValue({
        data: mockApiResponse,
      });
    });

    it('should perform facetted search successfully', async () => {
      const result = await performFacettedSearch(
        mockDomain,
        mockParameters,
        mockRequest,
        mockCredentials
      );

      expect(result).toEqual(mockApiResponse);
    });

    it('should make correct API request', async () => {
      await performFacettedSearch(
        mockDomain,
        mockParameters,
        mockRequest,
        mockCredentials
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `https://${mockDomain}/api/recommendations/facetted?page=1&per_page=20`,
        {
          facets: mockRequest.facets,
        },
        {
          headers: {
            Authorization: `Bearer ${mockCredentials.access_token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle empty parameters', async () => {
      await performFacettedSearch(mockDomain, {}, mockRequest, mockCredentials);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `https://${mockDomain}/api/recommendations/facetted?`,
        expect.objectContaining({
          facets: mockRequest.facets,
        }),
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockCredentials.access_token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle empty facets', async () => {
      const emptyRequest: FacettedSearchApiRequest = {
        facets: [],
      };

      await performFacettedSearch(
        mockDomain,
        mockParameters,
        emptyRequest,
        mockCredentials
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          facets: [],
        },
        expect.any(Object)
      );
    });

    it('should handle null/undefined request', async () => {
      await performFacettedSearch(
        mockDomain,
        mockParameters,
        null as any,
        mockCredentials
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          facets: [],
        },
        expect.any(Object)
      );
    });

    it('should handle special characters in parameters', async () => {
      const specialParams = {
        filter: 'category=dress&color=red+blue',
        search: 'summer/casual',
      };

      await performFacettedSearch(
        mockDomain,
        specialParams,
        mockRequest,
        mockCredentials
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('filter=category%3Ddress%26color%3Dred%2Bblue'),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('authentication errors', () => {
    it('should throw AuthenticationError for 401 status', async () => {
      const authError: Partial<AxiosError> = {
        status: 401,
        message: 'Unauthorized',
      };
      mockedAxios.post.mockRejectedValue(authError);

      await expect(
        performFacettedSearch(
          mockDomain,
          mockParameters,
          mockRequest,
          mockCredentials
        )
      ).rejects.toThrow(AuthenticationError);

      await expect(
        performFacettedSearch(
          mockDomain,
          mockParameters,
          mockRequest,
          mockCredentials
        )
      ).rejects.toThrow(
        'Authentication failed. Please check your credentials.'
      );
    });

    it('should throw AuthenticationError for 403 status', async () => {
      const authError: Partial<AxiosError> = {
        status: 403,
        message: 'Forbidden',
      };
      mockedAxios.post.mockRejectedValue(authError);

      await expect(
        performFacettedSearch(
          mockDomain,
          mockParameters,
          mockRequest,
          mockCredentials
        )
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('general error handling', () => {
    it('should throw generic Error for network errors', async () => {
      const networkError: Partial<AxiosError> = {
        status: 500,
        message: 'Network Error',
      };
      mockedAxios.post.mockRejectedValue(networkError);

      await expect(
        performFacettedSearch(
          mockDomain,
          mockParameters,
          mockRequest,
          mockCredentials
        )
      ).rejects.toThrow(
        'An error occurred while performing the facetted search: Network Error'
      );
    });

    it('should throw generic Error for timeout errors', async () => {
      const timeoutError: Partial<AxiosError> = {
        message: 'timeout of 5000ms exceeded',
      };
      mockedAxios.post.mockRejectedValue(timeoutError);

      await expect(
        performFacettedSearch(
          mockDomain,
          mockParameters,
          mockRequest,
          mockCredentials
        )
      ).rejects.toThrow(
        'An error occurred while performing the facetted search: timeout of 5000ms exceeded'
      );
    });

    it('should handle errors without response data', async () => {
      const simpleError: Partial<AxiosError> = {
        status: 400,
        message: 'Bad Request',
        response: undefined,
      };
      mockedAxios.post.mockRejectedValue(simpleError);

      await expect(
        performFacettedSearch(
          mockDomain,
          mockParameters,
          mockRequest,
          mockCredentials
        )
      ).rejects.toThrow(
        'An error occurred while performing the facetted search: Bad Request'
      );
    });
  });

  describe('request handling', () => {
    beforeEach(() => {
      mockedAxios.post.mockResolvedValue({ data: mockApiResponse });
    });

    it('should handle complex facets structure', async () => {
      const complexRequest: FacettedSearchApiRequest = {
        facets: [
          {
            name: 'garment_category',
            value: ['dresses', 'tops', 'skirts'],
          },
          {
            name: 'brand',
            value: ['brand1', 'brand2', 'brand3'],
          },
          {
            name: 'occasion',
            value: ['casual', 'formal', 'work'],
          },
          {
            name: 'price',
            value: ['0-50', '50-100', '100-200'],
          },
        ],
      };

      await performFacettedSearch(
        mockDomain,
        mockParameters,
        complexRequest,
        mockCredentials
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          facets: complexRequest.facets,
        },
        expect.any(Object)
      );
    });

    it('should handle facets with special characters', async () => {
      const specialRequest: FacettedSearchApiRequest = {
        facets: [
          {
            name: 'brand',
            value: ['H&M', 'Zara', 'C&A'],
          },
          {
            name: 'garment_category',
            value: ['t-shirts/tops', 'jeans & denim'],
          },
        ],
      };

      await performFacettedSearch(
        mockDomain,
        mockParameters,
        specialRequest,
        mockCredentials
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          facets: specialRequest.facets,
        },
        expect.any(Object)
      );
    });

    it('should work with different domains', async () => {
      const customDomain = 'custom-search-api.dressipi.example.com';

      await performFacettedSearch(
        customDomain,
        mockParameters,
        mockRequest,
        mockCredentials
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(
          `https://${customDomain}/api/recommendations/facetted`
        ),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle different credential formats', async () => {
      const longCredentials: AuthCredentials = {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 7200,
      };

      await performFacettedSearch(
        mockDomain,
        mockParameters,
        mockRequest,
        longCredentials
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        {
          headers: {
            Authorization: `Bearer ${longCredentials.access_token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
    });
  });

  describe('real-world scenarios', () => {
    it('should handle complete search response with all fields', async () => {
      const complexResponse: FacettedSearchApiResponse = {
        ...mockApiResponse,
        recommendations: [
          ...mockApiResponse.recommendations,
          {
            garment_id: 'TOP_002',
            raw_garment_id: 2,
            has_outfits: false,
            retailer: 'Fashion Store',
            feed_image_urls: [
              'https://example.com/top-1.jpg',
              'https://example.com/top-2.jpg',
            ],
            brand_name: 'Premium Brand',
            name: 'Silk Blouse',
            price: '149.99',
            old_price: '199.99',
            url: 'https://example.com/top',
            garment_status: 'in stock',
          },
        ],
        pagination: {
          total_pages: 10,
          total_entries: 200,
          current_page: 2,
        },
      };

      mockedAxios.post.mockResolvedValue({ data: complexResponse });

      const result = await performFacettedSearch(
        mockDomain,
        mockParameters,
        mockRequest,
        mockCredentials
      );

      expect(result).toEqual(complexResponse);
      expect(result.recommendations).toHaveLength(2);
      expect(result.pagination.total_entries).toBe(200);
    });

    it('should handle pagination scenarios', async () => {
      const paginationParams = {
        page: '3',
        per_page: '50',
      };

      mockedAxios.post.mockResolvedValue({ data: mockApiResponse });

      await performFacettedSearch(
        mockDomain,
        paginationParams,
        mockRequest,
        mockCredentials
      );

      const callUrl = mockedAxios.post.mock.calls[0][0];
      expect(callUrl).toContain('page=3');
      expect(callUrl).toContain('per_page=50');
    });

    it('should handle empty search results', async () => {
      const emptyResponse: FacettedSearchApiResponse = {
        event_id: 'search_event_empty',
        content_id: 'search_content_empty',
        recommendations: [],
        pagination: {
          total_pages: 0,
          total_entries: 0,
          current_page: 1,
        },
      };

      mockedAxios.post.mockResolvedValue({ data: emptyResponse });

      const result = await performFacettedSearch(
        mockDomain,
        mockParameters,
        mockRequest,
        mockCredentials
      );

      expect(result).toEqual(emptyResponse);
      expect(result.recommendations).toHaveLength(0);
      expect(result.pagination.total_entries).toBe(0);
    });

    it('should handle search with multiple filter parameters', async () => {
      const multipleParams = {
        page: '2',
        per_page: '10',
        sort: 'price_asc',
        filter: 'in_stock',
        category: 'dresses',
      };

      mockedAxios.post.mockResolvedValue({ data: mockApiResponse });

      await performFacettedSearch(
        mockDomain,
        multipleParams,
        mockRequest,
        mockCredentials
      );

      const callUrl = mockedAxios.post.mock.calls[0][0];
      expect(callUrl).toContain('page=2');
      expect(callUrl).toContain('per_page=10');
      expect(callUrl).toContain('sort=price_asc');
      expect(callUrl).toContain('filter=in_stock');
      expect(callUrl).toContain('category=dresses');
    });
  });
});
