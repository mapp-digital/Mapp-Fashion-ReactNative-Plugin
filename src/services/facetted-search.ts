import type { AxiosError } from 'axios';
import { AuthenticationError } from '../errors/AuthenticationError';
import { AuthCredentials } from '../types/auth';
import {
  FacettedSearchApiRequest,
  FacettedSearchApiResponse,
} from '../types/facetted-search';
import { httpPost } from '../utils/httpLogging';

/** Translate the existing facet API without widening unsupported range unions. */
const createFilters = (facets: FacettedSearchApiRequest['facets'] = []) => {
  const filters: Record<
    string,
    string[] | number | { from?: number; to?: number }
  > = {};
  const valueNames = [
    'garment_category',
    'brand',
    'occasion',
    'retailer_labels',
    'store',
    'feature_ids',
    'not_feature_ids',
  ];
  for (const facet of facets) {
    if (facet.name === 'must_have') {
      throw new Error('The must_have filter is not supported by API v2');
    }
    const entries = 'filters' in facet ? facet.filters : [facet];
    if (facet.name === 'price' || facet.name === 'reduced_by') {
      if (entries.length !== 1 || 'value' in entries[0]) {
        throw new Error(`API v2 requires one numeric range for ${facet.name}`);
      }
      const range = entries[0];
      if (range.from === undefined && range.to === undefined) {
        throw new Error(`API v2 requires a range endpoint for ${facet.name}`);
      }
      if (
        filters[facet.name] !== undefined ||
        (facet.name === 'price' &&
          (filters.min_price !== undefined || filters.max_price !== undefined))
      ) {
        throw new Error(`API v2 requires one numeric range for ${facet.name}`);
      }
      if (facet.name === 'price') {
        if (range.from !== undefined) filters.min_price = range.from;
        if (range.to !== undefined) filters.max_price = range.to;
      } else {
        filters.reduced_by = { ...range };
      }
    } else if (valueNames.includes(facet.name)) {
      const values: string[] = [];
      for (const entry of entries) {
        if (!('value' in entry)) {
          throw new Error(`API v2 requires values for ${facet.name}`);
        }
        for (const value of entry.value) {
          if (typeof value !== 'string' && typeof value !== 'number') {
            throw new Error(
              `API v2 requires string or numeric values for ${facet.name}`
            );
          }
          values.push(String(value));
        }
      }
      if (values.length) {
        filters[facet.name] = [
          ...new Set([
            ...((filters[facet.name] as string[] | undefined) ?? []),
            ...values,
          ]),
        ];
      }
    } else {
      throw new Error(`Unsupported API v2 filter: ${facet.name}`);
    }
  }
  return filters;
};

export const performFacettedSearch = async (
  domain: string,
  parameters: Record<string, string>,
  request: FacettedSearchApiRequest,
  credentials: AuthCredentials | null
): Promise<FacettedSearchApiResponse> => {
  try {
    const query = new URLSearchParams({
      ...parameters,
      garment_format: 'detailed',
      include_fashion_ids: 'true',
    });
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (credentials) headers['x-dressipi-jwt'] = credentials.access_token;
    const { data } = await httpPost<FacettedSearchApiResponse>(
      `https://${domain}/api/v2/facetted?${query}`,
      {
        filters: createFilters(request?.facets),
        ...(request?.root_event_id !== undefined
          ? { root_event_id: request.root_event_id }
          : {}),
      },
      { headers }
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
      `An error occurred while performing the facetted search: ${failure.message}`
    );
  }
};
