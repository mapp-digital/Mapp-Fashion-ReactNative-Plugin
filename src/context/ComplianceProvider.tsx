import { useCallback, useEffect, useState } from 'react';
import { SecureStorageAdapter } from '../types/keychain';
import { Log } from '../utils/logger';
import {
  ComplianceConfiguration,
  ComplianceContext,
} from './ComplianceContext';

interface ComplianceProviderProps {
  children: React.ReactNode;
  storageAdapter: SecureStorageAdapter;
}

const COMPLIANCE_STORAGE_KEY = 'dressipi_user_compliance';

/**
 * Provider component for managing user compliance state.
 * Handles persisting compliance consent in secure storage.
 */
export const ComplianceProvider: React.FC<ComplianceProviderProps> = ({
  children,
  storageAdapter,
}) => {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load compliance state from storage on mount
  useEffect(() => {
    const loadComplianceState = async () => {
      try {
        const storedConsent = await storageAdapter.getItem(
          COMPLIANCE_STORAGE_KEY
        );
        if (storedConsent !== null) {
          setHasConsented(storedConsent === 'true');
        }
      } catch (error) {
        console.warn('Failed to load compliance state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadComplianceState();
  }, [storageAdapter]);

  // Function to update consent and persist to storage
  const setConsent = useCallback(
    async (consent: boolean) => {
      try {
        setIsLoading(true);
        await storageAdapter.setItem(
          COMPLIANCE_STORAGE_KEY,
          consent.toString()
        );
        setHasConsented(consent);
      } catch (error) {
        console.error('Failed to save compliance state:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [storageAdapter]
  );

  const contextValue: ComplianceConfiguration = {
    hasConsented,
    setConsent,
    isLoading,
  };

  Log.info('Compliance Status', 'ComplianceProvider.tsx', {
    'Has Consented': hasConsented,
  });

  return (
    <ComplianceContext.Provider value={contextValue}>
      {children}
    </ComplianceContext.Provider>
  );
};
