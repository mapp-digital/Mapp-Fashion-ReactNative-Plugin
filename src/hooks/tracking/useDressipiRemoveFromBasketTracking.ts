import useDeepCompareEffect from 'use-deep-compare-effect';
import { TrackingItem } from '../../types/tracking';
import { useDressipiTracking } from '../useDressipiTracking';

/**
 * Custom hook to track remove from basket events.
 * This hook uses the Dressipi tracking service to send
 * the remove from basket event to the tracking system.
 *
 * @param {TrackingItem} item - The item to be removed from the basket.
 * @return {void} This hook does not return anything,
 * it simply triggers the tracking event.
 */
export const useDressipiRemoveFromBasketTracking = (
  item: TrackingItem
): void => {
  const { removeFromBasket } = useDressipiTracking();

  useDeepCompareEffect(() => {
    removeFromBasket(item);
  }, [item, removeFromBasket]);
};
