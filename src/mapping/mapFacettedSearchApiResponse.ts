import { FacettedSearchApiResponse, FacettedSearchApiResponseItem, FacettedSearchMappedResponse } from "../types/facetted-search";
import { DetailedItem } from "../types/shared";

/**
 * Maps the response from the facetted search API to a more usable format.
 * 
 * @param response - The response from the facetted search API.
 * @returns {FacettedSearchMappedResponse} A mapped response object.
 */
export const mapFacettedSearchApiResponse = (
  response: FacettedSearchApiResponse,
): FacettedSearchMappedResponse => ({
  response_id: response.event_id,
  content_id: response.content_id,
  items: response.recommendations.map(mapFacettedSearchApiResponseItem),
  pagination: {
    last_page: response.pagination.total_pages,
    current_page: response.pagination.current_page,
    total_items: response.pagination.total_entries,
  },
});

/**
 * Maps a single item from the facetted search API response
 * to a detailed item format.
 * 
 * @param item - The item from the facetted search API response.
 * @returns {DetailedItem} A detailed item object.
 */
const mapFacettedSearchApiResponseItem = (
  item: FacettedSearchApiResponseItem,
): DetailedItem => ({
  id: item.garment_id,
  dressipi_item_id: item.raw_garment_id,
  name: item.name,
  brand_name: item.brand_name,
  url: item.url,
  images: item.feed_image_urls || [],
  image_url: item.feed_image_urls ? item.feed_image_urls[0] : "",
  has_outfits: item.has_outfits,
  status: item.garment_status,
  price: item.price,
  old_price: item.old_price,
});