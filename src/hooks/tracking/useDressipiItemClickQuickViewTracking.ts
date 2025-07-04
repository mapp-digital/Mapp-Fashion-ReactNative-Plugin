import useDeepCompareEffect from 'use-deep-compare-effect';
import { ItemClickQuickViewEventPayload } from '../../types/tracking';
import { useDressipiTracking } from '../useDressipiTracking';

/**
 * Custom hook to track item click quick view events.
 * This hook uses the Dressipi tracking service to send
 * the item click quick view event to the tracking system.
 *
 * @param {ItemClickQuickViewEventPayload} itemClickQuickViewPayload - The item
 * click quick view payload.
 * @return {void} This hook does not return anything,
 * it simply triggers the tracking event.
 */
export const useDressipiItemClickQuickViewTracking = (
  itemClickQuickViewPayload: ItemClickQuickViewEventPayload
): void => {
  const { itemClickQuickView } = useDressipiTracking();

  useDeepCompareEffect(() => {
    itemClickQuickView(itemClickQuickViewPayload);
  }, [itemClickQuickViewPayload, itemClickQuickView]);
};
