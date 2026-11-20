import { getBasketItems } from '../services/curated-items';
import {
  BasketItemsApiRequest,
  BasketItemsState,
} from '../types/curated-items';
import { useCuratedItems } from './useCuratedItems';

/** Recommendations based on supplied basket identifiers, or an empty basket. */
export const useBasketItems = (
  request: BasketItemsApiRequest = {}
): BasketItemsState => useCuratedItems(request, getBasketItems);
