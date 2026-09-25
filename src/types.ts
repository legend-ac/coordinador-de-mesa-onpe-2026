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
  id: string; // e.g. "mesa_1_pos_1"
  mesaSlot?: number; // 1, 2, 3 (preserves mesa slot ordering)
  mesa: string; // e.g. "Mesa 51" or user's custom number "Mesa 045120"
  cargo: CargoTipo;
  nombreCompleto: string;
  dni: string;
  celular: string;
  estadoContacto: ContactStatus;
  observaciones: string;
  verificado: VerificadoTipo;
  orden: number; // 1 to 27
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

export const INITIAL_MEMBERS_DATA: MesaMember[] = DEFAULT_MESAS.flatMap((mesa, mesaIndex) =>
  CARGOS_ORDENADOS.map((cargo, cargoIndex) => {
    const slot = mesaIndex + 1;
    const pos = cargoIndex + 1;
    const orden = mesaIndex * 9 + pos;
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
      orden,
    };
  })
);
