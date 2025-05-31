import type { ReactNativeTracker } from "@snowplow/react-native-tracker";
import { RefObject, useMemo, useRef } from "react";
import { createTracker } from "../tracking/tracker";
import { ProviderProps } from "../types/context";
import { Queue, QueueableEvents, QueuedEvent } from "../types/tracking";
import { DressipiContext } from "./DressipiContext";

const DressipiProvider = ({ 
  children,
  namespaceId, 
  domain, 
  clientId 
}: ProviderProps) => {
  /**
   * Create a reference object to the queue of events 
   * to be sent to the tracker.
   */
  const queue: RefObject<Queue<QueueableEvents> | null> 
    = useRef<Queue<QueueableEvents> | null>([]);

  const tracker: ReactNativeTracker | null = useMemo(() => {
    /**
     * Create a tracker instance using the provided namespaceId, domain 
     * and clientId.
     * This tracker will be used to send events to Snowplow.
     */
    const trackerInstance: ReactNativeTracker | null = 
      createTracker(namespaceId, domain, clientId);

    /**
     * If the tracker instance is created successfully,
     * process queued events and return the tracker. Otherwise, return null.
     */
    if (!trackerInstance) {
      return null;
    }

    /**
     * Process the queued events by iterating over each event
     * and calling the corresponding method of the tracker instance.
     * Each queued event contains the event name and the data to be sent.
     */
    queue.current?.forEach((queuedEvent: QueuedEvent<QueueableEvents>) => {
      (trackerInstance[queuedEvent.event] as Function)
        .apply(trackerInstance, queuedEvent.data);
    });

    /**
     * Clear the queue after processing the events.
     * This ensures that the queue is empty for future events.
     */
    queue.current = [];

    return trackerInstance;
  }, [namespaceId, domain, clientId]);

  return (
    <DressipiContext.Provider value={{
      namespaceId,
      domain,
      clientId,
      tracker,
      queue,
      refresh: () => {}
    }}>
      {children}
    </DressipiContext.Provider>
  )
};

export default DressipiProvider;
