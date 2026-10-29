import {
  RelatedItemsAPIResponseItem,
  RelatedItemsAPIResponseItemIDsOnly,
} from './related-items';
import { DetailedItem } from './shared';

/** Parameters shared by Top and Basket recommendations. Results are detailed. */
type CuratedItemsApiRequest = {
  max_items?: number;
  max_reduced_by?: number;
  excluded_ids?: string[];
  locale?: string;
  language?: string;
};

export type TopItemsApiRequest = CuratedItemsApiRequest & {
  department?: 'female' | 'male' | 'girls' | 'boys' | 'unisex';
};

export type BasketItemsApiRequest = CuratedItemsApiRequest & {
  /** Style + colour identifiers by default. An empty basket is supported. */
  ids?: string[];
  identifier_type?: 'gtin' | 'product-code' | 'sku';
  sort?: 'price';
  direction?: 'asc' | 'desc';
  include_user_data?: boolean;
};

export type BasketUser = {
  first_name: string | null;
  style_quiz_complete: boolean;
};

export type TopItemsMappedResponse = {
  response_id: string;
  content_id: string;
  items: DetailedItem[];
};

export type BasketItemsMappedResponse = {
  response_id: string;
  items: DetailedItem[];
  user?: BasketUser;
};

export type TopItemsState = {
  items: TopItemsMappedResponse | null;
  loading: boolean;
  error: Error | null;
};

export type BasketItemsState = {
  items: BasketItemsMappedResponse | null;
  loading: boolean;
  error: Error | null;
};

type CuratedItemsApiResponse = {
  event_id: string;
  garment_data: RelatedItemsAPIResponseItem[];
};

export type TopItemsApiResponse = CuratedItemsApiResponse & {
  top_items: {
    content_id: string;
    items: RelatedItemsAPIResponseItemIDsOnly[];
  };
};

export type BasketItemsApiResponse = CuratedItemsApiResponse & {
  recommendations: RelatedItemsAPIResponseItemIDsOnly[];
  user?: BasketUser;
};
