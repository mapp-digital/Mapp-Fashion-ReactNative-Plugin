import {
  RelatedItemsAPIResponseItem,
  RelatedItemsAPIResponseItemIDsOnly,
} from '../types/related-items';
import { DetailedItem } from '../types/shared';

/** Resolve references in recommendation order, never by metadata array position. */
export const createRecommendationItemMapper = (
  data: RelatedItemsAPIResponseItem[]
): ((reference: RelatedItemsAPIResponseItemIDsOnly) => DetailedItem) => {
  const byId = new Map(data.map(item => [item.id, item]));
  const byCode = new Map(data.map(item => [item.product_code, item]));

  return reference => {
    let item =
      reference.raw_garment_id !== undefined
        ? byId.get(reference.raw_garment_id)
        : byCode.get(reference.product_code ?? reference.garment_id);

    // Basket has no include_fashion_ids option. Feed aliases may differ from
    // garment_id; only use a fallback when it identifies exactly one item.
    if (!item && reference.raw_garment_id === undefined) {
      const aliases = data.filter(
        candidate =>
          candidate.sku === reference.garment_id ||
          candidate.eans?.includes(reference.garment_id) ||
          (reference.ancillary_product_code != null &&
            candidate.ancillary_product_code ===
              reference.ancillary_product_code)
      );
      if (aliases.length === 1) item = aliases[0];
      if (!item && reference.product_id) {
        const styles = data.filter(
          candidate => candidate.product_id === reference.product_id
        );
        if (styles.length === 1) item = styles[0];
      }
    }

    if (!item) {
      throw new Error(
        `[Dressipi] Item with ID ${reference.raw_garment_id ?? reference.garment_id} not found in response data`
      );
    }

    return {
      id: item.product_code,
      dressipi_item_id: item.id,
      name: item.name,
      brand_name: item.brand_name,
      price: item.price,
      old_price: item.old_price,
      url: item.url,
      category_id: item.garment_category_id,
      category_name: item.garment_category_name,
      images: item.feed_image_urls ?? [],
      image_url: item.image_url ?? item.feed_image_urls?.[0] ?? '',
      best_model_image: item.best_model_image ?? undefined,
      best_product_image: item.best_product_image ?? undefined,
      style_id: item.product_id ?? reference.product_id,
      has_outfits: item.has_outfits,
      status: item.garment_status,
    };
  };
};
