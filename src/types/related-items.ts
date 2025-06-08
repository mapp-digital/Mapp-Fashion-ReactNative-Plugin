import { RelatedItemsIdentifierType } from '../enums/RelatedItemsIdentifierType';
import { RelatedItemsMethod } from '../enums/RelatedItemsMethod';
import { ResponseFormat } from '../enums/ResponseFormat';
import { DetailedItem } from './shared';

/**
 * Type for the state of the related items feature.
 */
export type RelatedItemsState = {
  relatedItems: RelatedItemsMappedResponse | null;
  loading: boolean;
  error: Error | null;
};

/**
 * Type for a related items request that can be sent to the Dressipi API.
 */
export type RelatedItemsApiRequest = {
  item_id?: string;
  response_format?: ResponseFormat;
  methods?: RelatedItemsMethod | RelatedItemsMethod[];
  try_all_methods?: boolean;
  outfits_per_occasion?: number;
  max_similar_items?: number;
  max_reduced_by?: number;
  identifier_type?: RelatedItemsIdentifierType;
};

/**
 * Type for the response from the Dressipi API for the related items.
 */
export type RelatedItemsApiResponse = {
  event_id: string;
  source: RelatedItemsAPIResponseItemIDsOnly;
  garment_data: RelatedItemsAPIResponseItem[];
  reparentable: boolean;
  outfits: RelatedItemsApiResponseOutfit[];
  partner_outfits: RelatedItemsApiResponseOutfit[];
  similar_items: {
    content_id: string;
    items: RelatedItemsAPIResponseItemIDsOnly[];
  };
};

/**
 * Type for an item in the related items API response.
 */
export type RelatedItemsAPIResponseItem = {
  id: number;
  feed_image_urls: string[];
  brand_name: string;
  name: string;
  price?: string;
  old_price?: string;
  url: string;
  rating: string | null;
  garment_category_id: number;
  garment_category_name: string;
  department: 'female' | 'male' | 'boys' | 'girls';
  image_url: string;
  thumbnail_image_url?: string;
  best_model_image?: string;
  best_product_image?: string;
  product_code: string;
  partner: string;
  retailer: string;
  why: [];
  has_outfits: boolean;
  garment_status: 'in stock' | 'out of stock';
  product_id: string;
};

/**
 * Type for an outfit in the related items API response that only contains
 * the IDs.
 */
export type RelatedItemsAPIResponseItemIDsOnly = {
  garment_id: string;
  raw_garment_id: number;
  ancillary_product_code?: string;
};

/**
 * Type for the response from the Dressipi API for an outfit.
 * It contains the content ID, garment ID, template ID, and a list of items.
 */
export type RelatedItemsApiResponseOutfit = {
  content_id: string;
  garment_id: string;
  raw_garment_id: number;
  template_id: string;
  saved: boolean;
  occasion: string;
  items: RelatedItemsAPIResponseItemIDsOnly[];
};

/**
 * Type for the mapped response data based on the
 * Dressipi API related items response.
 */
export type RelatedItemsMappedResponse = {
  response_id: string;
  outfits?: Outfit[];
  partner_outfits?: Outfit[];
  similar_items?: {
    content_id: string;
    items: DetailedItem[];
  };
};

/**
 * Represents an outfit with a list of items for an occasion.
 */
export type Outfit = {
  content_id: string;
  occasion: string;
  items: DetailedItem[];
};
