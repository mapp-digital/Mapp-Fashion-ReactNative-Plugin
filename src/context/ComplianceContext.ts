import { Context, createContext } from 'react';

/**
 * Interface representing the compliance configuration state.
 */
export type ComplianceConfiguration = {
  hasConsented: boolean | null; // null = not set, true = accepted, false = rejected
  setConsent: (consent: boolean) => Promise<void>;
  isLoading: boolean;
};

/**
 * The ComplianceContext is a React context that provides compliance
 * state management for data tracking consent.
 */
export const ComplianceContext: Context<ComplianceConfiguration> =
  createContext<ComplianceConfiguration>({
    hasConsented: null,
    setConsent: async () => {},
    isLoading: false,
  });
