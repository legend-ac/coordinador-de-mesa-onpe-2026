import React, { createContext, useContext, useState } from 'react';
import { CoordinadorPerfil } from '../types';

interface CoordinatorContextType {
  perfil: CoordinadorPerfil;
  /** Actualiza el perfil en memoria (no escribe en Firestore por sí solo) */
  setPerfil: React.Dispatch<React.SetStateAction<CoordinadorPerfil>>;
}

const CoordinatorContext = createContext<CoordinatorContextType | null>(null);

export const CoordinatorProvider: React.FC<{
  initialPerfil: CoordinadorPerfil;
  children: React.ReactNode;
}> = ({ initialPerfil, children }) => {
  const [perfil, setPerfil] = useState<CoordinadorPerfil>(initialPerfil);
  return (
    <CoordinatorContext.Provider value={{ perfil, setPerfil }}>
      {children}
    </CoordinatorContext.Provider>
  );
};

/** Hook para leer el perfil del coordinador activo. Lanza error si se usa fuera del provider. */
export const useCoordinator = (): CoordinatorContextType => {
  const ctx = useContext(CoordinatorContext);
  if (!ctx) throw new Error('useCoordinator debe usarse dentro de <CoordinatorProvider>');
  return ctx;
};
