import useDeepCompareEffect from 'use-deep-compare-effect';
import { Identification } from '../../types/tracking';
import { useDressipiTracking } from '../useDressipiTracking';

/**
 * Custom hook to track user identification events.
 * This hook uses the Dressipi tracking service to send
 * the identification event to the tracking system.
 *
 * @param {Identification} identification - The identification object
 * containing user details.
 * @return {void} This hook does not return anything,
 * it simply triggers the tracking event.
 */
export const useDressipiIdentifyTracking = (
  identification: Identification
): void => {
  const { identify } = useDressipiTracking();

  useDeepCompareEffect(() => {
    identify(identification);
  }, [identification, identify]);
};
