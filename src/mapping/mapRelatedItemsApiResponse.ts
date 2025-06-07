import { ResponseFormat } from "../enums/ResponseFormat";
import { Outfit, RelatedItemsApiResponse, RelatedItemsAPIResponseItem, RelatedItemsAPIResponseItemIDsOnly, RelatedItemsApiResponseOutfit, RelatedItemsMappedResponse } from "../types/related-items";
import { DetailedItem } from "../types/shared";

/**
 * Maps the related items API response to a format
 * that can be used in the application.
 * 
 * @param response - The response from the related items API.
 * @param format - The format in which the response should be mapped.
 * @return {RelatedItemsMappedResponse} A structured response containing 
 * outfits, partner outfits, and similar items.
 */
export const mapRelatedItemsApiResponse = (
  response: RelatedItemsApiResponse,
  format: ResponseFormat,
): RelatedItemsMappedResponse => {
  /**
   * Throws an error if the format is not supported.
   */
  if (format !== ResponseFormat.Detailed) {
    throw new Error(`[Dressipi] Unknown format ${format}`);
  }

  /**
   * Indexes the items from the related items API response
   * to a Map for quick lookup by item ID.
   */
  const itemsIndex: Map<number, RelatedItemsAPIResponseItem> 
    = indexResponseItems(response.garment_data);

  /**
   * Maps the related items API response to a structured format
   * that can be used in the application.
   */
  const result: RelatedItemsMappedResponse = {
    response_id: response.event_id,
  };

  /**
   * Maps outfits from the related items API response.
   */
  if (response.outfits) {
    result.outfits = response.outfits.map(outfit => 
      formatRelatedItemsOutfit(outfit, response.source, itemsIndex)
    );
  }

  /**
   * Maps partner outfits if they exist.
   */
  if (response.partner_outfits) {
    result.partner_outfits = response.partner_outfits.map(outfit =>
      formatRelatedItemsOutfit(outfit, response.source, itemsIndex)
    );
  }

  /**
   * Maps similar items if they exist and have a valid content ID.
   */
  if (response.similar_items) {
    if (
      response.similar_items.content_id 
      && response.similar_items.content_id !== '000000000000000000000000'
    ) {
      result.similar_items = {
        content_id: response.similar_items.content_id,
        items: response.similar_items.items.map(
          item => mapItemIDsOnlyToDetailedItem(item, itemsIndex)
        ),
      };
    }
  }

  return result;
};

/**
 * Maps the list of items from the related items API response
 * to a Map indexed by item ID for quick lookup.
 * 
 * @param data - Array of items from the API response.
 * @returns {Map<number, RelatedItemsAPIResponseItem>} A Map indexed by item ID.
 */
const indexResponseItems = (
  data: RelatedItemsAPIResponseItem[],
): Map<number, RelatedItemsAPIResponseItem> => {
  return new Map(
    (data || []).map(item => [item.id, item])
  );
};

/**
 * Maps an item ID reference to a DetailedItem object by looking it up
 * in the indexed items Map.
 * 
 * @param itemIdData - The item ID reference from the API response.
 * @param itemsIndex - The Map of indexed items for quick lookup.
 * @returns {DetailedItem} A DetailedItem object containing the mapped data.
 */
const mapItemIDsOnlyToDetailedItem = (
  itemIdData: RelatedItemsAPIResponseItemIDsOnly,
  itemsIndex: Map<number, RelatedItemsAPIResponseItem>
): DetailedItem => {
  const responseItem: RelatedItemsAPIResponseItem | undefined = 
    itemsIndex.get(itemIdData.raw_garment_id);
  
  if (!responseItem) {
    throw new Error(
      `[Dressipi] Item with ID ${itemIdData.raw_garment_id} not found in response data`
    );
  }
  
  return mapResponseItemToDetailedItem(responseItem);
};

/**
 * Maps a single item from the related items API response
 * to a DetailedItem object.
 * 
 * @param responseItem - The item from the related items API response.
 * @returns {DetailedItem} A DetailedItem object containing the mapped data.
 */
const mapResponseItemToDetailedItem = (
  responseItem: RelatedItemsAPIResponseItem
): DetailedItem => ({
  best_model_image: responseItem.best_model_image,
  best_product_image: responseItem.best_product_image,
  brand_name: responseItem.brand_name,
  category_id: responseItem.garment_category_id,
  category_name: responseItem.garment_category_name,
  dressipi_item_id: responseItem.id,
  has_outfits: responseItem.has_outfits,
  id: responseItem.product_code,
  old_price: responseItem.old_price,
  price: responseItem.price,
  status: responseItem.garment_status,
  style_id: responseItem.product_id,
  url: responseItem.url,
  image_url: responseItem.image_url,
  images: responseItem.feed_image_urls,
  name: responseItem.name,
});

/**
 * Formats an outfit from the related items API response
 * to a format that can be used in the application.
 * 
 * @param outfit - The outfit from the API response.
 * @param source - The source item from the related items API response.
 * @param itemsIndex - The Map of indexed items for quick lookup.
 * @returns {Outfit} A formatted outfit object.
 */
const formatRelatedItemsOutfit = (
  outfit: RelatedItemsApiResponseOutfit,
  source: RelatedItemsAPIResponseItemIDsOnly,
  itemsIndex: Map<number, RelatedItemsAPIResponseItem>
): Outfit => ({
  content_id: outfit.content_id,
  occasion: outfit.occasion,
  items: [source, ...outfit.items].map(item => 
    mapItemIDsOnlyToDetailedItem(item, itemsIndex)
  ),
});
