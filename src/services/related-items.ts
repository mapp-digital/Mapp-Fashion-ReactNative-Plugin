import type { AxiosError } from 'axios';
import { RelatedItemsMethod } from '../enums/RelatedItemsMethod';
import { AuthenticationError } from '../errors/AuthenticationError';
import { RelatedItemsGarmentNotFoundError } from '../errors/RelatedItemsGarmentNotFoundError';
import { AuthCredentials } from '../types/auth';
import {
  RelatedItemsApiResponse,
  RelatedItemsAPIResponseItem,
} from '../types/related-items';
import { httpGet } from '../utils/httpLogging';

const endpoints: Record<RelatedItemsMethod, string> = {
  [RelatedItemsMethod.Outfits]: 'outfits',
  [RelatedItemsMethod.PartnerOutfits]: 'partner_outfits',
  [RelatedItemsMethod.SimilarItems]: 'similar',
};
const allMethods = Object.values(RelatedItemsMethod);

/** Keep the existing combined hook while querying each requested v2 operation. */
export const getRelatedItems = async (
  domain: string,
  parameters: Record<string, string>,
  itemId: string,
  credentials: AuthCredentials | null
): Promise<RelatedItemsApiResponse> => {
  try {
    const methods = parameters.methods
      ? [...new Set(parameters.methods.split(','))]
      : allMethods;
    if (
      methods.some(method => !allMethods.includes(method as RelatedItemsMethod))
    ) {
      throw new Error('Unknown related items method');
    }
    const headers: Record<string, string> = credentials
      ? { 'x-dressipi-jwt': credentials.access_token }
      : {};

    const fetchMethod = async (method: RelatedItemsMethod) => {
      const query = new URLSearchParams({
        id: itemId,
        garment_format: 'detailed',
        include_fashion_ids: 'true',
        // Preserve the complete outfits exposed by the existing hook.
        exclude_source_garment:
          method === RelatedItemsMethod.SimilarItems ? 'true' : 'false',
      });
      const identifierType = parameters.identifier_type;
      if (identifierType) {
        query.set(
          'identifier_type',
          identifierType === 'dressipi-id'
            ? 'fashion-id'
            : identifierType === 'ean'
              ? 'gtin'
              : identifierType
        );
      }
      for (const key of ['max_reduced_by', 'locale', 'language']) {
        if (parameters[key] !== undefined) query.set(key, parameters[key]);
      }
      if (method === RelatedItemsMethod.SimilarItems) {
        if (parameters.max_similar_items !== undefined) {
          query.set('max_items', parameters.max_similar_items);
        }
      } else if (parameters.outfits_per_occasion !== undefined) {
        query.set('outfits_per_occasion', parameters.outfits_per_occasion);
      }
      const { data } = await httpGet<RelatedItemsApiResponse>(
        `https://${domain}/api/v2/items/${endpoints[method]}?${query}`,
        { headers }
      );
      return { method, data };
    };

    const responses = await Promise.all(
      methods.map(method => fetchMethod(method as RelatedItemsMethod))
    );
    const hasResults = responses.some(({ method, data }) =>
      method === RelatedItemsMethod.SimilarItems
        ? Boolean(data.similar_items?.items.length)
        : Boolean(data[method]?.length)
    );
    if (parameters.try_all_methods === 'true' && !hasResults) {
      responses.push(
        ...(await Promise.all(
          allMethods
            .filter(method => !methods.includes(method))
            .map(fetchMethod)
        ))
      );
    }

    const combined: RelatedItemsApiResponse = {
      event_id: responses[0].data.event_id,
      source: null,
      garment_data: [],
      event_ids: {},
    };
    const garments = new Map<number, RelatedItemsAPIResponseItem>();
    for (const { method, data } of responses) {
      combined.source ??= data.source;
      combined.event_ids![method] = data.event_id;
      for (const item of data.garment_data) garments.set(item.id, item);
      if (method === RelatedItemsMethod.Outfits)
        combined.outfits = data.outfits;
      if (method === RelatedItemsMethod.PartnerOutfits) {
        combined.partner_outfits = data.partner_outfits;
      }
      if (method === RelatedItemsMethod.SimilarItems) {
        combined.similar_items = data.similar_items;
      }
    }
    combined.garment_data = [...garments.values()];
    return combined;
  } catch (error) {
    const failure = error as AxiosError<{ error?: { message?: string } }>;
    const status = failure.response?.status ?? failure.status;
    if (status === 401 || status === 403) {
      throw new AuthenticationError(
        'Authentication failed. Please check your credentials.'
      );
    }
    if (
      status === 422 ||
      failure.response?.data?.error?.message === 'Garment not found'
    ) {
      throw new RelatedItemsGarmentNotFoundError('Garment not found');
    }
    throw new Error(
      `An error occurred while fetching the related items: ${failure.message}`
    );
  }
};
