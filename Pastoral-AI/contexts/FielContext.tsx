import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface FielSession {
  email: string;
  paroquiaId: string;
  paroquiaNome: string;
  comunidadeId: string;
  comunidadeNome: string;
}

interface FielContextType {
  session: FielSession | null;
  setSession: (s: FielSession | null) => void;
  isFiel: boolean;
}

const FIEL_STORAGE_KEY = 'vinculum_fiel_session';

const FielContext = createContext<FielContextType | undefined>(undefined);

export const FielProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSessionState] = useState<FielSession | null>(() => {
    try {
      const stored = sessionStorage.getItem(FIEL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setSession = useCallback((s: FielSession | null) => {
    setSessionState(s);
    if (s) {
      sessionStorage.setItem(FIEL_STORAGE_KEY, JSON.stringify(s));
    } else {
      sessionStorage.removeItem(FIEL_STORAGE_KEY);
    }
  }, []);

  return (
    <FielContext.Provider value={{ session, setSession, isFiel: !!session }}>
      {children}
    </FielContext.Provider>
  );
};

export const useFiel = () => {
  const ctx = useContext(FielContext);
  if (!ctx) throw new Error('useFiel must be used within FielProvider');
  return ctx;
};
