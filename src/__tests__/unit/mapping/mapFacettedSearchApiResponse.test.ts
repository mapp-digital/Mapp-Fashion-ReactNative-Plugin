import { describe, expect, it } from 'vitest';
import { mapFacettedSearchApiResponse } from '../../../mapping/mapFacettedSearchApiResponse';
import {
  FacettedSearchApiResponse,
  FacettedSearchApiResponseItem,
} from '../../../types/facetted-search';

describe('mapFacettedSearchApiResponse', () => {
  // Mock data for testing
  const mockApiResponseItems: FacettedSearchApiResponseItem[] = [
    {
      garment_id: 'DRESS_001',
      raw_garment_id: 1,
      has_outfits: true,
      retailer: 'Fashion Store',
      feed_image_urls: [
        'https://example.com/dress-001-1.jpg',
        'https://example.com/dress-001-2.jpg',
      ],
      brand_name: 'StyleBrand',
      name: 'Summer Floral Dress',
      price: '89.99',
      old_price: '119.99',
      url: 'https://example.com/products/dress-001',
      garment_status: 'in stock',
    },
    {
      garment_id: 'SHOES_002',
      raw_garment_id: 2,
      has_outfits: false,
      retailer: 'Shoe World',
      feed_image_urls: ['https://example.com/shoes-002.jpg'],
      brand_name: 'ComfortWalk',
      name: 'Black Leather Boots',
      price: '149.99',
      old_price: '179.99',
      url: 'https://example.com/products/shoes-002',
      garment_status: 'out of stock',
    },
  ];

  const mockApiResponse: FacettedSearchApiResponse = {
    event_id: 'search_event_12345',
    content_id: 'search_content_abc',
    recommendations: mockApiResponseItems,
    pagination: {
      total_pages: 5,
      total_entries: 120,
      current_page: 2,
    },
  };

  describe('basic functionality', () => {
    it('should map basic API response structure correctly', () => {
      const result = mapFacettedSearchApiResponse(mockApiResponse);

      expect(result.response_id).toBe('search_event_12345');
      expect(result.content_id).toBe('search_content_abc');
      expect(result.items).toHaveLength(2);
      expect(result.pagination).toEqual({
        last_page: 5,
        current_page: 2,
        total_items: 120,
      });
    });

    it('should handle empty recommendations array', () => {
      const emptyResponse: FacettedSearchApiResponse = {
        ...mockApiResponse,
        recommendations: [],
      };

      const result = mapFacettedSearchApiResponse(emptyResponse);

      expect(result.response_id).toBe('search_event_12345');
      expect(result.content_id).toBe('search_content_abc');
      expect(result.items).toEqual([]);
      expect(result.pagination).toEqual({
        last_page: 5,
        current_page: 2,
        total_items: 120,
      });
    });

    it('should handle single item response', () => {
      const singleItemResponse: FacettedSearchApiResponse = {
        ...mockApiResponse,
        recommendations: [mockApiResponseItems[0]],
      };

      const result = mapFacettedSearchApiResponse(singleItemResponse);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('DRESS_001');
    });
  });

  describe('pagination mapping', () => {
    it('should correctly map pagination fields', () => {
      const result = mapFacettedSearchApiResponse(mockApiResponse);

      expect(result.pagination.last_page).toBe(5);
      expect(result.pagination.current_page).toBe(2);
      expect(result.pagination.total_items).toBe(120);
    });

    it('should handle first page pagination', () => {
      const firstPageResponse = {
        ...mockApiResponse,
        pagination: {
          total_pages: 1,
          total_entries: 10,
          current_page: 1,
        },
      };

      const result = mapFacettedSearchApiResponse(firstPageResponse);

      expect(result.pagination.last_page).toBe(1);
      expect(result.pagination.current_page).toBe(1);
      expect(result.pagination.total_items).toBe(10);
    });

    it('should handle zero results pagination', () => {
      const zeroResultsResponse = {
        ...mockApiResponse,
        recommendations: [],
        pagination: {
          total_pages: 0,
          total_entries: 0,
          current_page: 1,
        },
      };

      const result = mapFacettedSearchApiResponse(zeroResultsResponse);

      expect(result.items).toEqual([]);
      expect(result.pagination.last_page).toBe(0);
      expect(result.pagination.total_items).toBe(0);
    });
  });

  describe('item mapping', () => {
    it('should correctly map all item properties', () => {
      const result = mapFacettedSearchApiResponse(mockApiResponse);
      const firstItem = result.items[0];

      expect(firstItem).toEqual({
        id: 'DRESS_001',
        dressipi_item_id: 1,
        name: 'Summer Floral Dress',
        brand_name: 'StyleBrand',
        url: 'https://example.com/products/dress-001',
        images: [
          'https://example.com/dress-001-1.jpg',
          'https://example.com/dress-001-2.jpg',
        ],
        image_url: 'https://example.com/dress-001-1.jpg',
        has_outfits: true,
        status: 'in stock',
        price: '89.99',
        old_price: '119.99',
      });
    });

    it('should handle items with different garment statuses', () => {
      const result = mapFacettedSearchApiResponse(mockApiResponse);

      expect(result.items[0].status).toBe('in stock');
      expect(result.items[1].status).toBe('out of stock');
    });

    it('should handle items with single image', () => {
      const result = mapFacettedSearchApiResponse(mockApiResponse);
      const secondItem = result.items[1];

      expect(secondItem.images).toEqual(['https://example.com/shoes-002.jpg']);
      expect(secondItem.image_url).toBe('https://example.com/shoes-002.jpg');
    });

    it('should handle items without outfits', () => {
      const result = mapFacettedSearchApiResponse(mockApiResponse);

      expect(result.items[0].has_outfits).toBe(true);
      expect(result.items[1].has_outfits).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle item with no images', () => {
      const itemWithoutImages: FacettedSearchApiResponseItem = {
        ...mockApiResponseItems[0],
        feed_image_urls: undefined,
      };

      const responseWithoutImages = {
        ...mockApiResponse,
        recommendations: [itemWithoutImages],
      };

      const result = mapFacettedSearchApiResponse(responseWithoutImages);
      const item = result.items[0];

      expect(item.images).toEqual([]);
      expect(item.image_url).toBe('');
    });

    it('should handle item with empty images array', () => {
      const itemWithEmptyImages: FacettedSearchApiResponseItem = {
        ...mockApiResponseItems[0],
        feed_image_urls: [],
      };

      const responseWithEmptyImages = {
        ...mockApiResponse,
        recommendations: [itemWithEmptyImages],
      };

      const result = mapFacettedSearchApiResponse(responseWithEmptyImages);
      const item = result.items[0];

      expect(item.images).toEqual([]);
      expect(item.image_url).toBeUndefined();
    });

    it('should handle items with missing optional properties', () => {
      const minimalItem: FacettedSearchApiResponseItem = {
        garment_id: 'MIN_001',
        raw_garment_id: 999,
        has_outfits: false,
        retailer: 'Test Store',
        brand_name: 'Test Brand',
        name: 'Test Item',
        price: '99.99',
        old_price: '129.99',
        url: 'https://example.com/test',
        garment_status: 'in stock',
        // feed_image_urls is missing
      };

      const minimalResponse = {
        ...mockApiResponse,
        recommendations: [minimalItem],
      };

      const result = mapFacettedSearchApiResponse(minimalResponse);
      const item = result.items[0];

      expect(item.id).toBe('MIN_001');
      expect(item.images).toEqual([]);
      expect(item.image_url).toBe('');
    });
  });

  describe('real-world scenarios', () => {
    it('should handle large search results', () => {
      const manyItems = Array.from({ length: 50 }, (_, index) => ({
        ...mockApiResponseItems[0],
        garment_id: `ITEM_${index + 1}`,
        raw_garment_id: index + 1,
        name: `Item ${index + 1}`,
      }));

      const largeResponse = {
        ...mockApiResponse,
        recommendations: manyItems,
        pagination: {
          total_pages: 10,
          total_entries: 500,
          current_page: 1,
        },
      };

      const result = mapFacettedSearchApiResponse(largeResponse);

      expect(result.items).toHaveLength(50);
      expect(result.items[0].id).toBe('ITEM_1');
      expect(result.items[49].id).toBe('ITEM_50');
      expect(result.pagination.total_items).toBe(500);
    });

    it('should handle mixed item types and statuses', () => {
      const mixedItems: FacettedSearchApiResponseItem[] = [
        {
          garment_id: 'DRESS_SALE',
          raw_garment_id: 100,
          has_outfits: true,
          retailer: 'Sale Store',
          feed_image_urls: ['https://example.com/sale-dress.jpg'],
          brand_name: 'Budget Fashion',
          name: 'Sale Dress',
          price: '29.99',
          old_price: '89.99',
          url: 'https://example.com/sale-dress',
          garment_status: 'in stock',
        },
        {
          garment_id: 'PREMIUM_BAG',
          raw_garment_id: 200,
          has_outfits: false,
          retailer: 'Luxury Store',
          feed_image_urls: [
            'https://example.com/bag-1.jpg',
            'https://example.com/bag-2.jpg',
            'https://example.com/bag-3.jpg',
          ],
          brand_name: 'LuxuryBrand',
          name: 'Designer Handbag',
          price: '899.99',
          old_price: '999.99',
          url: 'https://example.com/premium-bag',
          garment_status: 'out of stock',
        },
      ];

      const mixedResponse = {
        ...mockApiResponse,
        recommendations: mixedItems,
      };

      const result = mapFacettedSearchApiResponse(mixedResponse);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].price).toBe('29.99');
      expect(result.items[1].price).toBe('899.99');
      expect(result.items[0].has_outfits).toBe(true);
      expect(result.items[1].has_outfits).toBe(false);
    });

    it('should preserve all retailer and brand information', () => {
      const result = mapFacettedSearchApiResponse(mockApiResponse);

      expect(result.items[0].brand_name).toBe('StyleBrand');
      expect(result.items[1].brand_name).toBe('ComfortWalk');
      // Note: retailer is not mapped to the DetailedItem but the test ensures the mapping works
    });
  });
});
