export type MesaId = string;

export type CargoTipo =
  | 'Presidente'
  | 'Secretario'
  | 'Tercer miembro'
  | '1.er suplente'
  | '2.º suplente'
  | '3.er suplente'
  | '4.º suplente'
  | '5.º suplente'
  | '6.º suplente';

export type ContactStatus = 'Pendiente' | 'Confirmado' | 'No responde' | 'Número incorrecto';

export type VerificadoTipo = 'Sí' | 'No';

export interface MesaMember {
  id: string;
  mesaSlot?: number;
  mesa: string;
  cargo: CargoTipo;
  nombreCompleto: string;
  dni: string;
  celular: string;
  estadoContacto: ContactStatus;
  observaciones: string;
  verificado: VerificadoTipo;
  orden: number;
  updatedAt?: string;
}

/** Perfil de cada coordinador — almacenado en Firestore */
export interface CoordinadorPerfil {
  dni: string;
  nombreCompleto: string;
  email?: string;
  celular?: string;
  /** Nombres de las mesas asignadas, e.g. ['Mesa 51','Mesa 52','Mesa 53'] */
  mesas: string[];
  pin: string;
  rol?: string;
  oficina?: string;
  createdAt: string;
  updatedAt?: string;
}

export const CARGOS_ORDENADOS: CargoTipo[] = [
  'Presidente',
  'Secretario',
  'Tercer miembro',
  '1.er suplente',
  '2.º suplente',
  '3.er suplente',
  '4.º suplente',
  '5.º suplente',
  '6.º suplente',
];

export const DEFAULT_MESAS = ['Mesa 51', 'Mesa 52', 'Mesa 53'];
export const MESAS_DISPONIBLES = DEFAULT_MESAS;

/**
 * Genera los miembros vacíos iniciales para las mesas dadas.
 * Función pura — no depende de ningún estado externo.
 */
export function generateInitialMembers(mesas: string[]): MesaMember[] {
  return mesas.flatMap((mesa, mesaIndex) =>
    CARGOS_ORDENADOS.map((cargo, cargoIndex) => {
      const slot = mesaIndex + 1;
      const pos = cargoIndex + 1;
      return {
        id: `mesa_${slot}_pos_${pos}`,
        mesaSlot: slot,
        mesa,
        cargo,
        nombreCompleto: '',
        dni: '',
        celular: '',
        estadoContacto: 'Pendiente' as ContactStatus,
        observaciones: '',
        verificado: 'No' as VerificadoTipo,
        orden: mesaIndex * CARGOS_ORDENADOS.length + pos,
      };
    })
  );
}

// Compatibilidad con código existente
export const INITIAL_MEMBERS_DATA: MesaMember[] = generateInitialMembers(DEFAULT_MESAS);
