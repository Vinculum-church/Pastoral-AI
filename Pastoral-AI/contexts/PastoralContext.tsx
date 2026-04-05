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

function normalizePastoralType(type: PastoralType | string): PastoralType {
  if (type === 'perseveranca') return PastoralType.CATEQUESE;
  if (Object.values(PastoralType).includes(type as PastoralType)) return type as PastoralType;
  return PastoralType.CATEQUESE;
}

export const PastoralProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pastoralType, _setPastoralType] = useState<PastoralType>(PastoralType.CATEQUESE);

  const setPastoralType = (type: PastoralType | string) => {
    _setPastoralType(normalizePastoralType(type));
  };

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
