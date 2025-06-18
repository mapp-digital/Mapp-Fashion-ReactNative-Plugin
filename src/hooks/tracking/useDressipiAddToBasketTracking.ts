import useDeepCompareEffect from 'use-deep-compare-effect';
import { TrackingItem } from '../../types/tracking';
import { useDressipiTracking } from '../useDressipiTracking';

/**
 * Custom hook to track add to basket events.
 * This hook uses the Dressipi tracking service to send
 * the add to basket event to the tracking system.
 *
 * @param {TrackingItem} item - The item to be added to the basket.
 * @return {void} This hook does not return anything,
 * it simply triggers the tracking event.
 */
export const useDressipiAddToBasketTracking = (item: TrackingItem): void => {
  const { addToBasket } = useDressipiTracking();

  useDeepCompareEffect(() => {
    addToBasket(item);
  }, [item, addToBasket]);
};
