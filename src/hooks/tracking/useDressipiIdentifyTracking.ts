import useDeepCompareEffect from 'use-deep-compare-effect';
import { IdentifyEventPayload } from '../../types/tracking';
import { useDressipiTracking } from '../useDressipiTracking';

/**
 * Custom hook to track user identification events.
 * This hook uses the Dressipi tracking service to send
 * the identification event to the tracking system.
 *
 * @param {IdentifyEventPayload} identification - The identification object
 * containing user details.
 * @return {void} This hook does not return anything,
 * it simply triggers the tracking event.
 */
export const useDressipiIdentifyTracking = (
  identification: IdentifyEventPayload
): void => {
  const { identify } = useDressipiTracking();

  useDeepCompareEffect(() => {
    // Only track if we have meaningful identification data
    const hasValidData = identification.customerId || identification.email;

    if (hasValidData) {
      identify(identification);
    }
  }, [identification, identify]);
};
