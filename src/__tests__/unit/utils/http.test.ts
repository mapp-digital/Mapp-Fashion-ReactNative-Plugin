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

    it('should handle boolean values correctly', () => {
      const params: RelatedItemsApiRequest = {
        item_id: 'test-item-123',
        try_all_methods: true,
      };

      const result = createQueryParameters(params);

      expect(result).toEqual({
        try_all_methods: 'true',
      });
    });

    it('should handle FacettedSearchApiRequest parameters', () => {
      const params: FacettedSearchApiRequest = {
        response_format: ResponseFormat.Detailed,
        page: 2,
        per_page: 20,
      };

      const result = createQueryParameters(params);

      expect(result).toEqual({
        garment_format: 'detailed',
        page: '2',
        per_page: '20',
      });
    });

    it('should handle zero values correctly', () => {
      const params: RelatedItemsApiRequest = {
        item_id: 'test-item-123',
        max_similar_items: 0,
        outfits_per_occasion: 0,
      };

      const result = createQueryParameters(params);

      expect(result).toEqual({
        max_similar_items: '0',
        outfits_per_occasion: '0',
      });
    });

    it('should handle single method as string and array', () => {
      const paramsString: RelatedItemsApiRequest = {
        item_id: 'test-item-123',
        methods: RelatedItemsMethod.SimilarItems,
      };

      const paramsArray: RelatedItemsApiRequest = {
        item_id: 'test-item-123',
        methods: [RelatedItemsMethod.SimilarItems],
      };

      const resultString = createQueryParameters(paramsString);
      const resultArray = createQueryParameters(paramsArray);

      expect(resultString).toEqual({
        methods: 'similar_items',
      });
      expect(resultArray).toEqual({
        methods: 'similar_items',
      });
    });

    it('should handle complex request with multiple parameters', () => {
      const params: RelatedItemsApiRequest = {
        item_id: 'complex-item-456',
        response_format: ResponseFormat.Detailed,
        methods: [
          RelatedItemsMethod.SimilarItems,
          RelatedItemsMethod.Outfits,
          RelatedItemsMethod.PartnerOutfits,
        ],
        max_similar_items: 15,
        outfits_per_occasion: 5,
        try_all_methods: false,
        max_reduced_by: 10,
      };

      const result = createQueryParameters(params);

      expect(result).toEqual({
        garment_format: 'detailed',
        methods: 'similar_items,outfits,partner_outfits',
        max_similar_items: '15',
        outfits_per_occasion: '5',
        try_all_methods: 'false',
        max_reduced_by: '10',
      });
    });

    it('should skip null values but include empty strings', () => {
      const params = {
        item_id: 'test-item-123',
        empty_string: '',
        null_value: null,
        undefined_value: undefined,
        valid_string: 'valid',
      };

      const result = createQueryParameters(params);

      expect(result).toEqual({
        valid_string: 'valid',
      });
      expect(result).not.toHaveProperty('item_id');
      expect(result).not.toHaveProperty('empty_string');
      expect(result).not.toHaveProperty('null_value');
      expect(result).not.toHaveProperty('undefined_value');
    });

    it('should handle string and numeric values correctly', () => {
      const params = {
        item_id: 'test-item-123',
        string_param: 'test-string',
        number_param: 42,
        float_param: 3.14,
      };

      const result = createQueryParameters(params);

      expect(result).toEqual({
        string_param: 'test-string',
        number_param: '42',
        float_param: '3.14',
      });
    });

    it('should handle edge case with empty methods array', () => {
      const params: RelatedItemsApiRequest = {
        item_id: 'test-item-123',
        methods: [],
      };

      const result = createQueryParameters(params);

      expect(result).toEqual({});
    });

    it('should maintain parameter order independence', () => {
      const params1 = {
        item_id: 'test-item-123',
        response_format: ResponseFormat.Detailed,
        page: 1,
      };

      const params2 = {
        page: 1,
        item_id: 'test-item-123',
        response_format: ResponseFormat.Detailed,
      };

      const result1 = createQueryParameters(params1);
      const result2 = createQueryParameters(params2);

      expect(result1).toEqual(result2);
      expect(result1).toEqual({
        garment_format: 'detailed',
        page: '1',
      });
    });
  });
});
