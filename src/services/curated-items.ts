import type { AxiosError } from 'axios';
import { AuthenticationError } from '../errors/AuthenticationError';
import { createRecommendationItemMapper } from '../mapping/mapRecommendationItems';
import { AuthCredentials } from '../types/auth';
import {
  BasketItemsApiRequest,
  BasketItemsApiResponse,
  BasketItemsMappedResponse,
  TopItemsApiRequest,
  TopItemsApiResponse,
  TopItemsMappedResponse,
} from '../types/curated-items';
import { httpGet } from '../utils/httpLogging';

const getItems = async <T>(
  operation: 'top' | 'basket',
  domain: string,
  request: TopItemsApiRequest | BasketItemsApiRequest,
  credentials: AuthCredentials | null
): Promise<T> => {
  const query = new URLSearchParams({ garment_format: 'detailed' });
  if (operation === 'top') query.set('include_fashion_ids', 'true');
  for (const [key, value] of Object.entries(request)) {
    if (value !== undefined && (!Array.isArray(value) || value.length > 0)) {
      query.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }
  }
  try {
    const { data } = await httpGet<T>(
      `https://${domain}/api/v2/items/${operation}?${query}`,
      {
        headers: credentials
          ? { 'x-dressipi-jwt': credentials.access_token }
          : {},
      }
    );
    return data;
  } catch (error) {
    const failure = error as AxiosError;
    const status = failure.response?.status ?? failure.status;
    if (status === 401 || status === 403) {
      throw new AuthenticationError(
        'Authentication failed. Please check your credentials.'
      );
    }
    throw new Error(
      `An error occurred while fetching ${operation} items: ${failure.message}`
    );
  }
};

export const getTopItems = async (
  domain: string,
  request: TopItemsApiRequest,
  credentials: AuthCredentials | null
): Promise<TopItemsMappedResponse> => {
  const data = await getItems<TopItemsApiResponse>(
    'top',
    domain,
    request,
    credentials
  );
  return {
    response_id: data.event_id,
    content_id: data.top_items.content_id,
    items: data.top_items.items.map(
      createRecommendationItemMapper(data.garment_data)
    ),
  };
};

export const getBasketItems = async (
  domain: string,
  request: BasketItemsApiRequest,
  credentials: AuthCredentials | null
): Promise<BasketItemsMappedResponse> => {
  const data = await getItems<BasketItemsApiResponse>(
    'basket',
    domain,
    request,
    credentials
  );
  return {
    response_id: data.event_id,
    items: data.recommendations.map(
      createRecommendationItemMapper(data.garment_data)
    ),
    ...(data.user !== undefined ? { user: data.user } : {}),
  };
};
