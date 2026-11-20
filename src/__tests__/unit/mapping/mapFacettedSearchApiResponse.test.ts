import { describe, expect, it } from 'vitest';
import { mapFacettedSearchApiResponse } from '../../../mapping/mapFacettedSearchApiResponse';
import {
  facettedResponse,
  garments,
} from '../../test-utils/recommendation-v2-data';

describe('v2 facetted response mapping', () => {
  it('joins separate metadata in recommendation order and retains pagination and attribution', () => {
    const result = mapFacettedSearchApiResponse(facettedResponse);
    expect(result.response_id).toBe('search-event');
    expect(result.content_id).toBe('search-content');
    expect(result.pagination).toEqual({
      last_page: 3,
      current_page: 1,
      total_items: 5,
    });
    expect(result.items.map(item => item.id)).toEqual(['ITEM-1', 'ITEM-2']);
    expect(result.items[0]).toMatchObject({
      dressipi_item_id: 1,
      name: 'Product 1',
      price: '29.99',
      old_price: '39.99',
      category_id: 1,
      category_name: 'Dresses',
      style_id: 'STYLE-1',
      images: ['https://shop.example/1.jpg'],
      status: 'in stock',
      has_outfits: true,
    });
  });

  it('handles empty results without requiring metadata', () => {
    const result = mapFacettedSearchApiResponse({
      ...facettedResponse,
      garment_data: [],
      recommendations: { content_id: 'empty-content', items: [] },
      pagination: { total_pages: 0, total_entries: 0, current_page: 1 },
    });
    expect(result.items).toEqual([]);
    expect(result.content_id).toBe('empty-content');
    expect(result.pagination.total_items).toBe(0);
  });

  it('handles absent images and nullable best-image values', () => {
    const result = mapFacettedSearchApiResponse({
      ...facettedResponse,
      garment_data: garments.map(
        item =>
          ({
            ...item,
            image_url: undefined,
            feed_image_urls: [],
            best_model_image: null,
            best_product_image: null,
          }) as any
      ),
    });
    expect(result.items[0].images).toEqual([]);
    expect(result.items[0].image_url).toBe('');
    expect(result.items[0].best_model_image).toBeUndefined();
  });

  it('fails clearly when a referenced product is missing, instead of misassigning metadata', () => {
    expect(() =>
      mapFacettedSearchApiResponse({
        ...facettedResponse,
        garment_data: [garments[1]],
      })
    ).toThrow('Item with ID 1 not found in response data');
  });
});
