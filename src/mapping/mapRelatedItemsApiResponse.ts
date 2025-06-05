import { ResponseFormat } from "../enums/ResponseFormat";
import { RelatedItemsApiResponse, RelatedItemsAPIResponseItem, RelatedItemsAPIResponseItemIDsOnly, RelatedItemsApiResponseOutfit, RelatedItemsMappedResponse } from "../types/related-items";
import { DetailedItem } from "../types/shared";

/**
 * Maps the related items API response to a format
 * that can be used in the application.
 * 
 * @param response - The response from the related items API.
 * @param format - The format in which the response should be mapped.
 */
export const mapRelatedItemsApiResponse = (
  response: RelatedItemsApiResponse,
  format: ResponseFormat,
) => {
  const formatter = getItemFormatter(
    format, 
    indexResponseItems(response.garment_data),
  );

  return formatRelatedItemResponse(formatter)(response);
}

/**
 * Type for a function that formats an item from the related items API response
 * to a DetailedItem object.
 */
type ItemFormatter = (data: RelatedItemsAPIResponseItemIDsOnly) => DetailedItem;

const getItemFormatter = (
  format: ResponseFormat, 
  items: Record<number, RelatedItemsAPIResponseItem>
): ItemFormatter => (data: RelatedItemsAPIResponseItemIDsOnly) => {
    switch (format) {
      case ResponseFormat.Detailed: {
        return mapResponseItemToDetailedItem(items[data.raw_garment_id])
      }
    default:
      throw new Error(`[Dressipi] Unknown format ${format}`)
    }
  }

/**
 * Maps the list of items from the related items API response
 * to a record indexed by item ID.
 */
const indexResponseItems = (
  data: RelatedItemsAPIResponseItem[],
): Record<number, RelatedItemsAPIResponseItem> => {
  return (data || []).reduce((acc, item) => {
    acc[item.id] = item
    return acc
  }, {} as Record<number, RelatedItemsAPIResponseItem>);
}

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
 * Formats the related items API response to a mapped response
 * that can be used in the application.
 * 
 * @param formatter - The function to format the items.
 * @returns {RelatedItemsMappedResponse} The mapped response containing outfits and similar items.
 */
const formatRelatedItemResponse = (formatter: ItemFormatter) =>
  (data: RelatedItemsApiResponse): RelatedItemsMappedResponse => {
    const result: RelatedItemsMappedResponse = {
      response_id: data.event_id,
    };

    if (data.outfits) {
      result.outfits = 
        data.outfits.map(formatRelatedItemsOutfit(formatter, data.source));
    }

    if (data.partner_outfits) {
      result.partner_outfits = 
        data.partner_outfits.map(
          formatRelatedItemsOutfit(formatter, data.source)
        );
    }

    if (data.similar_items) {
      if (
        data.similar_items.content_id 
        && data.similar_items.content_id !== '000000000000000000000000'
      ) {
        result.similar_items = {
          content_id: data.similar_items.content_id,
          items: data.similar_items.items.map(formatter),
        };
      }
    }

    return result;
  }

/**
 * Formats an outfit from the related items API response
 * to a format that can be used in the application.
 * 
 * @param formatter - The function to format the items.
 * @param source - The source item from the related items API response.
 */
const formatRelatedItemsOutfit = (
  formatter: ItemFormatter, 
  source: RelatedItemsAPIResponseItemIDsOnly
) => (outfit: RelatedItemsApiResponseOutfit) => ({
    content_id: outfit.content_id,
    occasion: outfit.occasion,
    items: [source].concat(outfit.items).map(formatter),
  });
