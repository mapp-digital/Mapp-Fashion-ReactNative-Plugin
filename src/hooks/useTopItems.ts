import { getTopItems } from '../services/curated-items';
import { TopItemsApiRequest, TopItemsState } from '../types/curated-items';
import { useCuratedItems } from './useCuratedItems';

/** Curated recommendations for a profile, without a source product. */
export const useTopItems = (request: TopItemsApiRequest = {}): TopItemsState =>
  useCuratedItems(request, getTopItems);
