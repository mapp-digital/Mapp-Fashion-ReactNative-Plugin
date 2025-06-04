import { DressipiContext } from "@/src/context/DressipiContext";
import {
  addToBasket as addToBasketEventFunction,
  identify as identifyEventFunction,
  order as orderEventFunction,
  productDetailPageView as productDisplayPageViewEventFunction,
  productListPageView as productListPageViewEventFunction,
  removeFromBasket as removeFromBasketEventFunction,
} from "@/src/tracking/trackerEvents";
import { QueueableEvents, QueueableFunction, QueuedEvent, Tracking, TrackingItem } from "@/src/types/tracking";
import { useCallback, useContext, useMemo } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";


export const useDressipiTracking = (): Tracking => {
  const { namespaceId, queue, tracker } = useContext(DressipiContext);

  const trackEvent = useCallback(
    async (eventFunction: QueueableFunction, ...args: any[]) => {
      if (!queue?.current && !tracker) return;
      
      try {
        const event: QueuedEvent<QueueableEvents> = 
          await eventFunction(...args);

        if (queue?.current) {
          queue.current.push(event);
        } else if (tracker?.[event.event]) {
          (tracker[event.event] as Function).apply(tracker, event.data);
        }
      } catch (error) {
        console.error("Error tracking event:", error);
      }
    }, [queue, tracker]
  );

   return useMemo(() => ({
    order: (...args) => trackEvent(orderEventFunction, ...args),
    addToBasket: (...args) => trackEvent(addToBasketEventFunction, ...args),
    removeFromBasket: 
      (...args) => trackEvent(removeFromBasketEventFunction, ...args),
    identify: 
      (...args) => trackEvent(identifyEventFunction(namespaceId), ...args),
    productDisplayPage: 
      (...args) => trackEvent(productDisplayPageViewEventFunction, ...args),
    productListPage: 
      (...args) => trackEvent(productListPageViewEventFunction, ...args),
  }), [namespaceId, trackEvent]);
}

export const useDressipiProductDisplayPageTracking = (
  item: TrackingItem
): void => {
  const { productDisplayPage } = useDressipiTracking();

  useDeepCompareEffect(() => {
    productDisplayPage(item);
  }, [item, productDisplayPage]);
};