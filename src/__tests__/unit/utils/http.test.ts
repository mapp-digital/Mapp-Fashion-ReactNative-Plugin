import { describe, expect, it } from 'vitest';
import { RelatedItemsMethod } from '../../../enums/RelatedItemsMethod';
import { ResponseFormat } from '../../../enums/ResponseFormat';
import { FacettedSearchApiRequest } from '../../../types/facetted-search';
import { RelatedItemsApiRequest } from '../../../types/related-items';
import { createQueryParameters } from '../../../utils/http';

describe('HTTP Utils', () => {
  describe('createQueryParameters', () => {
    it('should create query parameters from RelatedItemsApiRequest', () => {
      const params: RelatedItemsApiRequest = {
        item_id: 'test-item-123',
        response_format: ResponseFormat.Detailed,
        methods: RelatedItemsMethod.SimilarItems,
        max_similar_items: 10,
      };

      const result = createQueryParameters(params);

      expect(result).toEqual({
        garment_format: 'detailed',
        methods: 'similar_items',
        max_similar_items: '10',
      });
    });

    it('should handle undefined and null values', () => {
      const params: RelatedItemsApiRequest = {
        item_id: 'test-item-123',
        max_similar_items: undefined,
        try_all_methods: true,
      };

      const result = createQueryParameters(params);

      expect(result).toEqual({
        try_all_methods: 'true',
      });
    });

    it('should handle empty FacettedSearchApiRequest', () => {
      const params: FacettedSearchApiRequest = {};
      const result = createQueryParameters(params);
      expect(result).toEqual({});
    });

    it('should convert methods array to comma-separated string', () => {
      const params: RelatedItemsApiRequest = {
        item_id: 'test-item-123',
        methods: [RelatedItemsMethod.SimilarItems, RelatedItemsMethod.Outfits],
      };

      const result = createQueryParameters(params);

      expect(result).toEqual({
        methods: 'similar_items,outfits',
      });
    });

    it('should skip item_id parameter', () => {
      const params: RelatedItemsApiRequest = {
        item_id: 'test-item-123',
        max_similar_items: 5,
      };

      const result = createQueryParameters(params);

      expect(result).not.toHaveProperty('item_id');
      expect(result).toEqual({
        max_similar_items: '5',
      });
    });

    it('should map response_format to garment_format', () => {
      const params: RelatedItemsApiRequest = {
        item_id: 'test-item-123',
        response_format: ResponseFormat.Detailed,
      };

      const result = createQueryParameters(params);

      expect(result).toEqual({
        garment_format: 'detailed',
      });
    });
  });
});
