import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PastoralType, PastoralConfig, PastoralLabels } from '../types';
import { PASTORAL_CONFIGS } from '../constants';

interface PastoralContextType {
  pastoralType: PastoralType;
  setPastoralType: (type: PastoralType) => void;
  config: PastoralConfig;
  labels: PastoralLabels;
}

const PastoralContext = createContext<PastoralContextType | undefined>(undefined);

export const PastoralProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pastoralType, setPastoralType] = useState<PastoralType>(PastoralType.CATEQUESE);

  const config = PASTORAL_CONFIGS[pastoralType];
  const labels = config.labels;

  return (
    <PastoralContext.Provider value={{ pastoralType, setPastoralType, config, labels }}>
      {children}
    </PastoralContext.Provider>
  );
};

export const usePastoral = () => {
  const context = useContext(PastoralContext);
  if (context === undefined) {
    throw new Error('usePastoral must be used within a PastoralProvider');
  }
  return context;
};
