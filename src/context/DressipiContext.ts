import { Context, createContext } from "react";
import { ContextConfiguration } from "../types/context";

/**
 * The DressipiContext is a React context that provides data
 * for the Dressipi application, including the namespace ID, domain,
 * client ID, tracker instance, authentication credentials 
 * and a queue for events.
 */
export const DressipiContext: Context<ContextConfiguration> = 
  createContext<ContextConfiguration>({
    namespaceId: "",
    domain: "",
    clientId: "",
    tracker: null,
    queue: null,
    credentials: null,
    refresh: () => {},
  });