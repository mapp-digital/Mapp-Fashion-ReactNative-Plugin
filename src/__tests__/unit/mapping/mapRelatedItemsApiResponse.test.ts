import { describe, expect, it } from 'vitest';
import { ResponseFormat } from '../../../enums/ResponseFormat';
import { mapRelatedItemsApiResponse } from '../../../mapping/mapRelatedItemsApiResponse';
import {
  RelatedItemsApiResponse,
  RelatedItemsAPIResponseItem,
  RelatedItemsAPIResponseItemIDsOnly,
  RelatedItemsApiResponseOutfit,
} from '../../../types/related-items';

describe('mapRelatedItemsApiResponse', () => {
  // Mock data for testing
  const mockGarmentData: RelatedItemsAPIResponseItem[] = [
    {
      id: 1,
      product_code: 'DRESS_001',
      name: 'Blue Summer Dress',
      brand_name: 'Fashion Brand',
      price: '89.99',
      old_price: '119.99',
      url: 'https://example.com/dress-001',
      garment_category_id: 10,
      garment_category_name: 'Dresses',
      department: 'female',
      image_url: 'https://example.com/images/dress-001.jpg',
      best_model_image: 'https://example.com/images/dress-001-model.jpg',
      best_product_image: 'https://example.com/images/dress-001-product.jpg',
      product_id: 'PROD_001',
      partner: 'RetailerA',
      retailer: 'RetailerA',
      rating: '4.5',
      why: [],
      has_outfits: true,
      garment_status: 'in stock',
      feed_image_urls: [
        'https://example.com/images/dress-001-1.jpg',
        'https://example.com/images/dress-001-2.jpg',
      ],
    },
    {
      id: 2,
      product_code: 'SHOES_001',
      name: 'White Sneakers',
      brand_name: 'Shoe Brand',
      price: '79.99',
      url: 'https://example.com/shoes-001',
      garment_category_id: 20,
      garment_category_name: 'Shoes',
      department: 'female',
      image_url: 'https://example.com/images/shoes-001.jpg',
      product_id: 'PROD_002',
      partner: 'RetailerB',
      retailer: 'RetailerB',
      rating: null,
      why: [],
      has_outfits: false,
      garment_status: 'out of stock',
      feed_image_urls: ['https://example.com/images/shoes-001-1.jpg'],
    },
  ];

  const mockSource: RelatedItemsAPIResponseItemIDsOnly = {
    garment_id: 'DRESS_001',
    raw_garment_id: 1,
  };

  const mockOutfit: RelatedItemsApiResponseOutfit = {
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
  };

  const mockApiResponse: RelatedItemsApiResponse = {
    event_id: 'event_12345',
    source: mockSource,
    garment_data: mockGarmentData,
    reparentable: true,
    outfits: [mockOutfit],
    partner_outfits: [],
    similar_items: {
      content_id: 'similar_123',
      items: [
        {
          garment_id: 'SHOES_001',
          raw_garment_id: 2,
        },
      ],
    },
  };

  describe('basic functionality', () => {
    it('should map basic API response with response_id', () => {
      const result = mapRelatedItemsApiResponse(
        mockApiResponse,
        ResponseFormat.Detailed
      );

      expect(result.response_id).toBe('event_12345');
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        mapRelatedItemsApiResponse(mockApiResponse, 'unsupported' as any);
      }).toThrow('[Dressipi] Unknown format unsupported');
    });

    it('should handle minimal API response', () => {
      const minimalResponse: RelatedItemsApiResponse = {
        event_id: 'minimal_event',
        source: mockSource,
        garment_data: mockGarmentData,
        reparentable: false,
        outfits: [],
        partner_outfits: [],
        similar_items: {
          content_id: '',
          items: [],
        },
      };

      const result = mapRelatedItemsApiResponse(
        minimalResponse,
        ResponseFormat.Detailed
      );

      expect(result.response_id).toBe('minimal_event');
      expect(result.outfits).toEqual([]);
      expect(result.partner_outfits).toEqual([]);
      expect(result.similar_items).toBeUndefined();
    });
  });

  describe('outfits mapping', () => {
    it('should map outfits correctly', () => {
      const result = mapRelatedItemsApiResponse(
        mockApiResponse,
        ResponseFormat.Detailed
      );

      expect(result.outfits).toHaveLength(1);
      expect(result.outfits![0]).toEqual({
        content_id: 'outfit_123',
        occasion: 'casual',
        items: [
          {
            id: 'DRESS_001',
            dressipi_item_id: 1,
            name: 'Blue Summer Dress',
            brand_name: 'Fashion Brand',
            price: '89.99',
            old_price: '119.99',
            url: 'https://example.com/dress-001',
            category_id: 10,
            category_name: 'Dresses',
            image_url: 'https://example.com/images/dress-001.jpg',
            best_model_image: 'https://example.com/images/dress-001-model.jpg',
            best_product_image:
              'https://example.com/images/dress-001-product.jpg',
            style_id: 'PROD_001',
            has_outfits: true,
            status: 'in stock',
            images: [
              'https://example.com/images/dress-001-1.jpg',
              'https://example.com/images/dress-001-2.jpg',
            ],
          },
          {
            id: 'SHOES_001',
            dressipi_item_id: 2,
            name: 'White Sneakers',
            brand_name: 'Shoe Brand',
            price: '79.99',
            url: 'https://example.com/shoes-001',
            category_id: 20,
            category_name: 'Shoes',
            image_url: 'https://example.com/images/shoes-001.jpg',
            style_id: 'PROD_002',
            has_outfits: false,
            status: 'out of stock',
            images: ['https://example.com/images/shoes-001-1.jpg'],
          },
        ],
      });
    });

    it('should not include outfits property when no outfits exist', () => {
      const responseWithoutOutfits = {
        ...mockApiResponse,
        outfits: [],
      };

      const result = mapRelatedItemsApiResponse(
        responseWithoutOutfits,
        ResponseFormat.Detailed
      );

      expect(result.outfits).toEqual([]);
    });

    it('should handle multiple outfits', () => {
      const multipleOutfitsResponse = {
        ...mockApiResponse,
        outfits: [
          mockOutfit,
          {
            ...mockOutfit,
            content_id: 'outfit_456',
            occasion: 'formal',
          },
        ],
      };

      const result = mapRelatedItemsApiResponse(
        multipleOutfitsResponse,
        ResponseFormat.Detailed
      );

      expect(result.outfits).toHaveLength(2);
      expect(result.outfits![0].content_id).toBe('outfit_123');
      expect(result.outfits![0].occasion).toBe('casual');
      expect(result.outfits![1].content_id).toBe('outfit_456');
      expect(result.outfits![1].occasion).toBe('formal');
    });
  });

  describe('partner outfits mapping', () => {
    it('should map partner outfits when present', () => {
      const responseWithPartnerOutfits = {
        ...mockApiResponse,
        partner_outfits: [mockOutfit],
      };

      const result = mapRelatedItemsApiResponse(
        responseWithPartnerOutfits,
        ResponseFormat.Detailed
      );

      expect(result.partner_outfits).toHaveLength(1);
      expect(result.partner_outfits![0].content_id).toBe('outfit_123');
      expect(result.partner_outfits![0].occasion).toBe('casual');
    });

    it('should not include partner_outfits property when none exist', () => {
      const result = mapRelatedItemsApiResponse(
        mockApiResponse,
        ResponseFormat.Detailed
      );

      expect(result.partner_outfits).toEqual([]);
    });
  });

  describe('similar items mapping', () => {
    it('should map similar items with valid content_id', () => {
      const result = mapRelatedItemsApiResponse(
        mockApiResponse,
        ResponseFormat.Detailed
      );

      expect(result.similar_items).toEqual({
        content_id: 'similar_123',
        items: [
          {
            id: 'SHOES_001',
            dressipi_item_id: 2,
            name: 'White Sneakers',
            brand_name: 'Shoe Brand',
            price: '79.99',
            url: 'https://example.com/shoes-001',
            category_id: 20,
            category_name: 'Shoes',
            image_url: 'https://example.com/images/shoes-001.jpg',
            style_id: 'PROD_002',
            has_outfits: false,
            status: 'out of stock',
            images: ['https://example.com/images/shoes-001-1.jpg'],
          },
        ],
      });
    });

    it('should not include similar items when content_id is empty', () => {
      const responseWithEmptyContentId = {
        ...mockApiResponse,
        similar_items: {
          content_id: '',
          items: [{ garment_id: 'SHOES_001', raw_garment_id: 2 }],
        },
      };

      const result = mapRelatedItemsApiResponse(
        responseWithEmptyContentId,
        ResponseFormat.Detailed
      );

      expect(result.similar_items).toBeUndefined();
    });

    it('should not include similar items when content_id is default value', () => {
      const responseWithDefaultContentId = {
        ...mockApiResponse,
        similar_items: {
          content_id: '000000000000000000000000',
          items: [{ garment_id: 'SHOES_001', raw_garment_id: 2 }],
        },
      };

      const result = mapRelatedItemsApiResponse(
        responseWithDefaultContentId,
        ResponseFormat.Detailed
      );

      expect(result.similar_items).toBeUndefined();
    });

    it('should not include similar items when similar_items is undefined', () => {
      const responseWithoutSimilarItems = {
        ...mockApiResponse,
        similar_items: undefined as any,
      };

      const result = mapRelatedItemsApiResponse(
        responseWithoutSimilarItems,
        ResponseFormat.Detailed
      );

      expect(result.similar_items).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw error when item not found in garment_data', () => {
      const responseWithMissingItem = {
        ...mockApiResponse,
        garment_data: [], // Empty garment data
        similar_items: {
          content_id: 'similar_123',
          items: [
            {
              garment_id: 'MISSING_ITEM',
              raw_garment_id: 999, // This ID doesn't exist in garment_data
            },
          ],
        },
      };

      expect(() => {
        mapRelatedItemsApiResponse(
          responseWithMissingItem,
          ResponseFormat.Detailed
        );
      }).toThrow('[Dressipi] Item with ID 1 not found in response data');
    });

    it('should throw error when outfit item not found', () => {
      const responseWithMissingOutfitItem = {
        ...mockApiResponse,
        garment_data: [mockGarmentData[0]], // Only include first item
        outfits: [
          {
            ...mockOutfit,
            items: [
              {
                garment_id: 'MISSING_ITEM',
                raw_garment_id: 999,
              },
            ],
          },
        ],
      };

      expect(() => {
        mapRelatedItemsApiResponse(
          responseWithMissingOutfitItem,
          ResponseFormat.Detailed
        );
      }).toThrow('[Dressipi] Item with ID 999 not found in response data');
    });
  });

  describe('item mapping details', () => {
    it('should correctly map all item properties', () => {
      const result = mapRelatedItemsApiResponse(
        mockApiResponse,
        ResponseFormat.Detailed
      );

      const mappedItem = result.outfits![0].items[0];

      expect(mappedItem).toEqual({
        id: 'DRESS_001',
        dressipi_item_id: 1,
        name: 'Blue Summer Dress',
        brand_name: 'Fashion Brand',
        price: '89.99',
        old_price: '119.99',
        url: 'https://example.com/dress-001',
        category_id: 10,
        category_name: 'Dresses',
        image_url: 'https://example.com/images/dress-001.jpg',
        best_model_image: 'https://example.com/images/dress-001-model.jpg',
        best_product_image: 'https://example.com/images/dress-001-product.jpg',
        style_id: 'PROD_001',
        has_outfits: true,
        status: 'in stock',
        images: [
          'https://example.com/images/dress-001-1.jpg',
          'https://example.com/images/dress-001-2.jpg',
        ],
      });
    });

    it('should handle optional properties gracefully', () => {
      const result = mapRelatedItemsApiResponse(
        mockApiResponse,
        ResponseFormat.Detailed
      );

      const shoesItem = result.outfits![0].items[1]; // Second item is shoes

      expect(shoesItem.id).toBe('SHOES_001');
      expect(shoesItem.old_price).toBeUndefined();
      expect(shoesItem.best_model_image).toBeUndefined();
      expect(shoesItem.best_product_image).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty garment_data array', () => {
      const responseWithEmptyData = {
        ...mockApiResponse,
        garment_data: [],
        outfits: [],
        similar_items: { content_id: '', items: [] },
      };

      const result = mapRelatedItemsApiResponse(
        responseWithEmptyData,
        ResponseFormat.Detailed
      );

      expect(result.response_id).toBe('event_12345');
      expect(result.outfits).toEqual([]);
      expect(result.similar_items).toBeUndefined();
    });

    it('should handle null garment_data', () => {
      const responseWithNullData = {
        ...mockApiResponse,
        garment_data: null as any,
        outfits: [],
        similar_items: { content_id: '', items: [] },
      };

      const result = mapRelatedItemsApiResponse(
        responseWithNullData,
        ResponseFormat.Detailed
      );

      expect(result.response_id).toBe('event_12345');
    });

    it('should include source item in outfit items', () => {
      const result = mapRelatedItemsApiResponse(
        mockApiResponse,
        ResponseFormat.Detailed
      );

      // Source item should be first in the outfit items array
      expect(result.outfits![0].items).toHaveLength(2);
      expect(result.outfits![0].items[0].id).toBe('DRESS_001'); // Source item
      expect(result.outfits![0].items[1].id).toBe('SHOES_001'); // Outfit item
    });
  });

  describe('real-world scenarios', () => {
    it('should handle complex response with all sections', () => {
      const complexResponse = {
        ...mockApiResponse,
        partner_outfits: [
          {
            ...mockOutfit,
            content_id: 'partner_outfit_123',
            occasion: 'evening',
          },
        ],
      };

      const result = mapRelatedItemsApiResponse(
        complexResponse,
        ResponseFormat.Detailed
      );

      expect(result.response_id).toBe('event_12345');
      expect(result.outfits).toHaveLength(1);
      expect(result.partner_outfits).toHaveLength(1);
      expect(result.similar_items).toBeDefined();
      expect(result.similar_items!.items).toHaveLength(1);
    });

    it('should handle response with only similar items', () => {
      const similarItemsOnlyResponse = {
        ...mockApiResponse,
        outfits: [],
        partner_outfits: [],
      };

      const result = mapRelatedItemsApiResponse(
        similarItemsOnlyResponse,
        ResponseFormat.Detailed
      );

      expect(result.outfits).toEqual([]);
      expect(result.partner_outfits).toEqual([]);
      expect(result.similar_items).toBeDefined();
      expect(result.similar_items!.content_id).toBe('similar_123');
    });
  });
});
