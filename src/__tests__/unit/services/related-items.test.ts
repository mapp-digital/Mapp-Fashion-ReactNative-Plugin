import axios, { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationError } from '../../../errors/AuthenticationError';
import { RelatedItemsGarmentNotFoundError } from '../../../errors/RelatedItemsGarmentNotFoundError';
import { getRelatedItems } from '../../../services/related-items';
import { AuthCredentials } from '../../../types/auth';
import { RelatedItemsApiResponse } from '../../../types/related-items';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedAxios = axios as any;

describe('related-items service', () => {
  const mockDomain = 'api.dressipi.com';
  const mockItemId = 'DRESS_001';
  const mockCredentials: AuthCredentials = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'Bearer',
    expires_in: 3600,
  };

  const mockParameters = {
    response_format: 'detailed',
    per_page: '10',
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('successful requests', () => {
    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({
        data: mockApiResponse,
      });
    });

    it('should fetch related items successfully', async () => {
      const result = await getRelatedItems(
        mockDomain,
        mockParameters,
        mockItemId,
        mockCredentials
      );

      expect(result).toEqual(mockApiResponse);
    });

    it('should make correct API request', async () => {
      await getRelatedItems(
        mockDomain,
        mockParameters,
        mockItemId,
        mockCredentials
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://${mockDomain}/api/items/${encodeURIComponent(mockItemId)}/related?response_format=detailed&per_page=10`,
        {
          headers: {
            Authorization: `Bearer ${mockCredentials.access_token}`,
          },
        }
      );
    });

    it('should handle empty parameters', async () => {
      await getRelatedItems(mockDomain, {}, mockItemId, mockCredentials);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://${mockDomain}/api/items/${encodeURIComponent(mockItemId)}/related?`,
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockCredentials.access_token}`,
          },
        })
      );
    });

    it('should handle special characters in itemId', async () => {
      const specialItemId = 'DRESS/WITH-SPECIAL@CHARS';

      await getRelatedItems(
        mockDomain,
        mockParameters,
        specialItemId,
        mockCredentials
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(specialItemId)),
        expect.any(Object)
      );
    });

    it('should handle special characters in parameters', async () => {
      const specialParams = {
        filter: 'category=dress&color=red+blue',
        search: 'summer/casual',
      };

      await getRelatedItems(
        mockDomain,
        specialParams,
        mockItemId,
        mockCredentials
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('filter=category%3Ddress%26color%3Dred%2Bblue'),
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
      mockedAxios.get.mockRejectedValue(authError);

      await expect(
        getRelatedItems(mockDomain, mockParameters, mockItemId, mockCredentials)
      ).rejects.toThrow(AuthenticationError);

      await expect(
        getRelatedItems(mockDomain, mockParameters, mockItemId, mockCredentials)
      ).rejects.toThrow(
        'Authentication failed. Please check your credentials.'
      );
    });

    it('should throw AuthenticationError for 403 status', async () => {
      const authError: Partial<AxiosError> = {
        status: 403,
        message: 'Forbidden',
      };
      mockedAxios.get.mockRejectedValue(authError);

      await expect(
        getRelatedItems(mockDomain, mockParameters, mockItemId, mockCredentials)
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('garment not found errors', () => {
    it('should throw RelatedItemsGarmentNotFoundError for garment not found', async () => {
      const notFoundError: Partial<AxiosError> = {
        status: 404,
        message: 'Not Found',
        response: {
          data: {
            error: {
              message: 'Garment not found',
            },
          },
        } as any,
      };
      mockedAxios.get.mockRejectedValue(notFoundError);

      await expect(
        getRelatedItems(mockDomain, mockParameters, mockItemId, mockCredentials)
      ).rejects.toThrow(RelatedItemsGarmentNotFoundError);

      await expect(
        getRelatedItems(mockDomain, mockParameters, mockItemId, mockCredentials)
      ).rejects.toThrow('Garment not found');
    });

    it('should not throw RelatedItemsGarmentNotFoundError for other 404 errors', async () => {
      const otherError: Partial<AxiosError> = {
        status: 404,
        message: 'Not Found',
        response: {
          data: {
            error: {
              message: 'Different error message',
            },
          },
        } as any,
      };
      mockedAxios.get.mockRejectedValue(otherError);

      await expect(
        getRelatedItems(mockDomain, mockParameters, mockItemId, mockCredentials)
      ).rejects.toThrow(Error);

      await expect(
        getRelatedItems(mockDomain, mockParameters, mockItemId, mockCredentials)
      ).rejects.not.toThrow(RelatedItemsGarmentNotFoundError);
    });
  });

  describe('general error handling', () => {
    it('should throw generic Error for network errors', async () => {
      const networkError: Partial<AxiosError> = {
        status: 500,
        message: 'Network Error',
      };
      mockedAxios.get.mockRejectedValue(networkError);

      await expect(
        getRelatedItems(mockDomain, mockParameters, mockItemId, mockCredentials)
      ).rejects.toThrow(
        'An error occurred while fetching the related items: Network Error'
      );
    });

    it('should throw generic Error for timeout errors', async () => {
      const timeoutError: Partial<AxiosError> = {
        message: 'timeout of 5000ms exceeded',
      };
      mockedAxios.get.mockRejectedValue(timeoutError);

      await expect(
        getRelatedItems(mockDomain, mockParameters, mockItemId, mockCredentials)
      ).rejects.toThrow(
        'An error occurred while fetching the related items: timeout of 5000ms exceeded'
      );
    });

    it('should handle errors without response data', async () => {
      const simpleError: Partial<AxiosError> = {
        status: 500,
        message: 'Internal Server Error',
        response: undefined,
      };
      mockedAxios.get.mockRejectedValue(simpleError);

      await expect(
        getRelatedItems(mockDomain, mockParameters, mockItemId, mockCredentials)
      ).rejects.toThrow(
        'An error occurred while fetching the related items: Internal Server Error'
      );
    });

    it('should handle malformed error response data', async () => {
      const malformedError: Partial<AxiosError> = {
        status: 400,
        message: 'Bad Request',
        response: {
          data: 'Invalid JSON string',
        } as any,
      };
      mockedAxios.get.mockRejectedValue(malformedError);

      await expect(
        getRelatedItems(mockDomain, mockParameters, mockItemId, mockCredentials)
      ).rejects.toThrow('Cannot read properties of undefined');
    });
  });

  describe('parameter handling', () => {
    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });
    });

    it('should handle multiple parameters correctly', async () => {
      const multipleParams = {
        response_format: 'detailed',
        per_page: '20',
        page: '2',
        filter: 'category=dress',
      };

      await getRelatedItems(
        mockDomain,
        multipleParams,
        mockItemId,
        mockCredentials
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('response_format=detailed'),
        expect.any(Object)
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('per_page=20'),
        expect.any(Object)
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });

    it('should work with different domains', async () => {
      const customDomain = 'custom-api.dressipi.example.com';

      await getRelatedItems(
        customDomain,
        mockParameters,
        mockItemId,
        mockCredentials
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`https://${customDomain}/api/items`),
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

      await getRelatedItems(
        mockDomain,
        mockParameters,
        mockItemId,
        longCredentials
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(expect.any(String), {
        headers: {
          Authorization: `Bearer ${longCredentials.access_token}`,
        },
      });
    });
  });

  describe('real-world scenarios', () => {
    it('should handle complete API response with all fields', async () => {
      const complexResponse: RelatedItemsApiResponse = {
        ...mockApiResponse,
        outfits: [
          {
            content_id: 'outfit_123',
            garment_id: 'DRESS_001',
            raw_garment_id: 1,
            template_id: 'template_abc',
            saved: false,
            occasion: 'casual',
            items: [
              {
                garment_id: 'SHOES_001',
                raw_garment_id: 2,
              },
            ],
          },
        ],
        similar_items: {
          content_id: 'similar_456',
          items: [
            {
              garment_id: 'DRESS_002',
              raw_garment_id: 3,
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue({ data: complexResponse });

      const result = await getRelatedItems(
        mockDomain,
        mockParameters,
        mockItemId,
        mockCredentials
      );

      expect(result).toEqual(complexResponse);
      expect(result.outfits).toHaveLength(1);
      expect(result.similar_items.items).toHaveLength(1);
    });

    it('should handle pagination parameters', async () => {
      const paginationParams = {
        page: '3',
        per_page: '50',
        response_format: 'detailed',
      };

      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      await getRelatedItems(
        mockDomain,
        paginationParams,
        mockItemId,
        mockCredentials
      );

      const callUrl = mockedAxios.get.mock.calls[0][0];
      expect(callUrl).toContain('page=3');
      expect(callUrl).toContain('per_page=50');
    });
  });
});
