import { RelatedItemsMethod } from '../enums/RelatedItemsMethod';
import { ResponseFormat } from '../enums/ResponseFormat';
import {
  RelatedItemsApiResponse,
  RelatedItemsApiResponseOutfit,
  RelatedItemsMappedResponse,
} from '../types/related-items';
import { createRecommendationItemMapper } from './mapRecommendationItems';

export const mapRelatedItemsApiResponse = (
  response: RelatedItemsApiResponse,
  format: ResponseFormat
): RelatedItemsMappedResponse => {
  if (format !== ResponseFormat.Detailed) {
    throw new Error(`[Dressipi] Unknown format ${format}`);
  }

  const mapItem = createRecommendationItemMapper(response.garment_data ?? []);
  const result: RelatedItemsMappedResponse = { response_id: response.event_id };
  const mapOutfits = (
    outfits: RelatedItemsApiResponseOutfit[],
    method: RelatedItemsMethod
  ) =>
    outfits.map(outfit => {
      const source = response.source;
      const items = source
        ? [
            source,
            ...outfit.items.filter(item =>
              item.raw_garment_id !== undefined &&
              source.raw_garment_id !== undefined
                ? item.raw_garment_id !== source.raw_garment_id
                : item.garment_id !== source.garment_id
            ),
          ]
        : outfit.items;
      return {
        response_id: response.event_ids?.[method] ?? response.event_id,
        content_id: outfit.content_id,
        occasion: outfit.occasion,
        items: items.map(mapItem),
      };
    });

  if (response.outfits) {
    result.outfits = mapOutfits(response.outfits, RelatedItemsMethod.Outfits);
  }
  if (response.partner_outfits) {
    result.partner_outfits = mapOutfits(
      response.partner_outfits,
      RelatedItemsMethod.PartnerOutfits
    );
  }
  if (
    response.similar_items?.content_id &&
    response.similar_items.content_id !== '000000000000000000000000'
  ) {
    result.similar_items = {
      response_id:
        response.event_ids?.[RelatedItemsMethod.SimilarItems] ??
        response.event_id,
      content_id: response.similar_items.content_id,
      items: response.similar_items.items.map(mapItem),
    };
  }
  return result;
};
