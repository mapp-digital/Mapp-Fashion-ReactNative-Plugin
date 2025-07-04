import useDeepCompareEffect from 'use-deep-compare-effect';
import { ItemClickPdpEventPayload } from '../../types/tracking';
import { useDressipiTracking } from '../useDressipiTracking';

/**
 * Custom hook to track item click PDP events.
 * This hook uses the Dressipi tracking service to send
 * the item click PDP event to the tracking system.
 *
 * @param {ItemClickPdpEventPayload} itemClickPdpPayload - The item click
 * PDP payload.
 * @return {void} This hook does not return anything,
 * it simply triggers the tracking event.
 */
export const useDressipiItemClickPdpTracking = (
  itemClickPdpPayload: ItemClickPdpEventPayload
): void => {
  const { itemClickPdp } = useDressipiTracking();

  useDeepCompareEffect(() => {
    itemClickPdp(itemClickPdpPayload);
  }, [itemClickPdpPayload, itemClickPdp]);
};
