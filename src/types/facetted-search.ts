import { FacettedSearchResponseFormat } from "../enums/FacettedSearchResponseFormat";
import { DetailedItem } from "./shared";

/**
 * Type for the state of the facetted search feature.
 */
export type FacetedSearchState = {
  items: FacettedSearchMappedResponse | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Type for a facetted search request that can be sent to the Dressipi API.
 */
export type FacettedSearchApiRequest = {
  facets?: (FacetSingleFilter | FacetMultipleFilter)[];
  response_format?: FacettedSearchResponseFormat;
  page?: number;
  per_page?: number;
}

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
  name: FacettedSearchParameterDimension
  filters: (ValueFacetFilter | RangeFacetFilter)[];
}

/**
 * Type of filter for a facetted search request that uses an array of values.
 */
type ValueFacetFilter = {
  value: unknown[];
}

/**
 * Type of filter for a facetted search request that uses a range of values.
 */
type RangeFacetFilter = {
  from?: number;
  to?: number;
}

/**
 * Type for the response from the Dressipi API for facetted search.
 */
export type FacettedSearchApiResponse = {
  event_id: string;
  content_id: string;
  recommendations: FacettedSearchApiResponseItem[];
  pagination: {
    total_pages: number;
    total_entries: number;
    current_page: number;
  };
}

/**
 * Type for a single item in the facetted search API response.
 */
export type FacettedSearchApiResponseItem = {
  garment_id: string;
  raw_garment_id: number;
  has_outfits: boolean;
  retailer: string;
  feed_image_urls?: string[];
  brand_name: string;
  name: string;
  price: string;
  old_price: string;
  url: string;
  garment_status: FacettedSearchApiResponseItemGarmentStatus;
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
}

export type FacettedSearchParameterDimension = 'garment_category' | 'brand' 
  | 'occasion' | 'must_have' | 'retailer_labels' | 'store' | 'feature_ids' 
  | 'not_feature_ids' | 'price' | 'reduced_by'

export type FacettedSearchApiResponseItemGarmentStatus = 
  'in stock' | 'out of stock';