import {
  FacettedSearchApiResponse,
  FacettedSearchMappedResponse,
} from '../types/facetted-search';
import { createRecommendationItemMapper } from './mapRecommendationItems';

export const mapFacettedSearchApiResponse = (
  response: FacettedSearchApiResponse
): FacettedSearchMappedResponse => ({
  response_id: response.event_id,
  content_id: response.recommendations.content_id,
  items: response.recommendations.items.map(
    createRecommendationItemMapper(response.garment_data)
  ),
  pagination: {
    last_page: response.pagination.total_pages,
    current_page: response.pagination.current_page,
    total_items: response.pagination.total_entries,
  },
});
