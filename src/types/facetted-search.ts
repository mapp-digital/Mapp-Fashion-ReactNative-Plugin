import { ResponseFormat } from '../enums/ResponseFormat';
import { DetailedItem } from './shared';
import {
  RelatedItemsAPIResponseItem,
  RelatedItemsAPIResponseItemIDsOnly,
} from './related-items';

/**
 * Type for the state of the facetted search feature.
 */
export type FacettedSearchState = {
  items: FacettedSearchMappedResponse | null;
  loading: boolean;
  error: Error | null;
};

/**
 * Type for a facetted search request that can be sent to the Dressipi API.
 */
export type FacettedSearchApiRequest = {
  facets?: (FacetSingleFilter | FacetMultipleFilter)[];
  response_format?: ResponseFormat;
  page?: number;
  per_page?: number;
  /** First page's response_id, forwarded in the body for later pages. */
  root_event_id?: string;
};

/**
 * Type for a facetted search request that includes a single filter.
 */
export type FacetSingleFilter = {
  name: FacettedSearchParameterDimension;
} & ValueFacetFilter;

/**
 * Type for a facetted search request that includes multiple filters.
 */
export type FacetMultipleFilter = {
  name: FacettedSearchParameterDimension;
  filters: (ValueFacetFilter | RangeFacetFilter)[];
};

/**
 * Type of filter for a facetted search request that uses an array of values.
 */
type ValueFacetFilter = {
  value: unknown[];
};

/**
 * Type of filter for a facetted search request that uses a range of values.
 */
type RangeFacetFilter = {
  from?: number;
  to?: number;
};

/**
 * Type for the response from the Dressipi API for facetted search.
 */
export type FacettedSearchApiResponse = {
  event_id: string;
  garment_data: RelatedItemsAPIResponseItem[];
  recommendations: {
    content_id: string;
    items: RelatedItemsAPIResponseItemIDsOnly[];
  };
  pagination: {
    total_pages: number;
    total_entries: number;
    current_page: number;
  };
};

/**
 * Type for the mapped response data based on the
 * Dressipi API facetted search response.
 */
export type FacettedSearchMappedResponse = {
  response_id: string;
  content_id: string;
  items: DetailedItem[];
  pagination: {
    last_page: number;
    current_page: number;
    total_items: number;
  };
};

/**
 * Options for the dimensions of the facetted search parameters.
 */
export type FacettedSearchParameterDimension =
  | 'garment_category'
  | 'brand'
  | 'occasion'
  | 'must_have'
  | 'retailer_labels'
  | 'store'
  | 'feature_ids'
  | 'not_feature_ids'
  | 'price'
  | 'reduced_by';
