import type { ReactNativeTracker } from "@snowplow/react-native-tracker";
import { RefObject, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { createTracker } from "../tracking/tracker";
import { ProviderProps } from "../types/context";
import { Queue, QueueableEvents, QueuedEvent } from "../types/tracking";
import { DressipiContext } from "./DressipiContext";

/**
 * The DressipiProvider component is a React context provider
 * that initializes and provides the Snowplow tracker instance,
 * authentication credentials, and a queue for events to be sent.
 * 
 * @param {ProviderProps} props - The properties for the provider.
 * @returns {JSX.Element} The DressipiContext provider.
 */
export const DressipiProvider = ({ 
  children,
  namespaceId, 
  domain, 
  clientId 
}: ProviderProps) => {
  /**
   * Create a reference object to the queue of events 
   * to be sent to the tracker.
   */
  const queue: RefObject<Queue<QueueableEvents>> 
    = useRef<Queue<QueueableEvents>>([]);

  const { networkUserId, credentials, refresh } = useAuth(clientId, domain);

  const tracker: ReactNativeTracker | null = useMemo(() => {
    /**
     * Create a tracker instance using the provided namespaceId, domain 
     * and clientId.
     * This tracker will be used to send events to Snowplow.
     * If the networkUserId is not available, return null.
     */
    return networkUserId 
      ? createTracker(namespaceId, domain, networkUserId)
      : null;
  }, [namespaceId, domain, networkUserId]);

  useEffect(() => {
    /**
     * If the tracker instance is created successfully,
     * process queued events and return the tracker. Otherwise, return null.
     */
    if (!tracker) return;

    /**
     * Retrieve the queued events from the queue.
     */
    const eventsToProcess: QueuedEvent<QueueableEvents>[] = [...queue.current];

    /**
     * Clear the queue after processing the events.
     * This ensures that the queue is empty for future events.
     */
    queue.current = [];

    /**
     * Process the queued events by iterating over each event
     * and calling the corresponding method of the tracker instance.
     * Each queued event contains the event name and the data to be sent.
     */
    eventsToProcess.forEach((queuedEvent: QueuedEvent<QueueableEvents>) => {
      (tracker[queuedEvent.event] as Function)
        .apply(tracker, queuedEvent.data);
    });
  }, [tracker]);

  /**
   * The DressipiProvider component provides the DressipiContext
   * to its children, allowing them to access the namespaceId, domain,
   * clientId, tracker instance, queue of events, authentication credentials,
   * and a refresh function for updating the authentication state.
   */
  return (
    <DressipiContext.Provider value={{
      namespaceId,
      domain,
      clientId,
      tracker,
      queue,
      credentials,
      refreshAuthentication: refresh,
    }}>
      {children}
    </DressipiContext.Provider>
  )
};
