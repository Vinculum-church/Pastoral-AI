import React from 'react';
import FielEntrance from './FielEntrance';
import FielDashboard from './FielDashboard';
import { useFiel } from '../contexts/FielContext';

const FielPage: React.FC = () => {
  const { session } = useFiel();
  return session ? <FielDashboard /> : <FielEntrance />;
};

export default FielPage;
