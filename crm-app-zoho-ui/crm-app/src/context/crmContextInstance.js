import { createContext, useContext } from 'react';

export const CRMContext = createContext(null);

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used inside CRMProvider');
  return ctx;
}

