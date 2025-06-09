import React from 'react';
import { DressipiProvider } from '../../context/DressipiProvider';

/**
 * Test wrapper component that provides DressipiProvider context
 * with mock configuration for testing.
 */
export const TestDressipiProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <DressipiProvider
      namespaceId="test-namespace"
      domain="test.dressipi.com"
      clientId="test-client-id"
    >
      {children}
    </DressipiProvider>
  );
};

/**
 * Custom render function that wraps components with test providers
 */
export const renderWithProviders = (ui: React.ReactElement) => {
  return {
    ...ui,
    wrapper: TestDressipiProvider,
  };
};
