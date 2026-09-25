import ExcelJS from 'exceljs';
import { MesaMember, MesaId, CargoTipo, ContactStatus, VerificadoTipo } from '../types';

/**
 * Normalizes string for fuzzy comparison
 */
function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Normalizes cargo string to match official CargoTipo
 */
function normalizeCargo(rawCargo: string): CargoTipo {
  const norm = normalizeHeader(rawCargo);
  if (norm.includes('presidente')) return 'Presidente';
  if (norm.includes('secretario')) return 'Secretario';
  if (norm.includes('tercer')) return 'Tercer miembro';
  if (norm.includes('1') && norm.includes('suplente')) return '1.er suplente';
  if (norm.includes('2') && norm.includes('suplente')) return '2.º suplente';
  if (norm.includes('3') && norm.includes('suplente')) return '3.er suplente';
  if (norm.includes('4') && norm.includes('suplente')) return '4.º suplente';
  if (norm.includes('5') && norm.includes('suplente')) return '5.º suplente';
  if (norm.includes('6') && norm.includes('suplente')) return '6.º suplente';
  return rawCargo as CargoTipo;
}

/**
 * Reads an uploaded .xlsx or .xls file and robustly parses table members,
 * supporting both exact ONPE format and custom spreadsheets with columns in any order.
 */
export async function parseExcelFile(file: File): Promise<Partial<MesaMember>[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.getWorksheet('Control de Mesas') || workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No se encontró la hoja de cálculo en el archivo.');
  }

  // 1. Identify header columns dynamically from row 1
  let colMesa = 1;
  let colCargo = 2;
  let colNombre = 3;
  let colDni = 4;
  let colCelular = 5;
  let colEstado = 7;
  let colObs = 8;
  let colVerif = 9;

  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNum) => {
    const val = normalizeHeader(String(cell.value || ''));
    if (val.includes('mesa')) colMesa = colNum;
    else if (val.includes('cargo') || val.includes('condicion')) colCargo = colNum;
    else if (val.includes('nombre') || val.includes('apellidos') || val.includes('titular')) colNombre = colNum;
    else if (val.includes('dni') || val.includes('documento')) colDni = colNum;
    else if (val.includes('celular') || val.includes('telefono') || val.includes('movil')) colCelular = colNum;
    else if (val.includes('estado')) colEstado = colNum;
    else if (val.includes('observ') || val.includes('nota')) colObs = colNum;
    else if (val.includes('verif')) colVerif = colNum;
  });

  const results: Partial<MesaMember>[] = [];

  worksheet.eachRow((row, rowNumber) => {
    // Skip header
    if (rowNumber === 1) return;

    // Helper to get raw string safely from cell (supports formulas and hyperlinks)
    const getVal = (col: number) => {
      const cell = row.getCell(col);
      if (!cell || cell.value === null || cell.value === undefined) return '';
      if (typeof cell.value === 'object') {
        if ('result' in cell.value && cell.value.result !== undefined) {
          return String(cell.value.result).trim();
        }
        if ('text' in cell.value && cell.value.text !== undefined) {
          return String(cell.value.text).trim();
        }
      }
      return String(cell.value).trim();
    };

    const mesaVal = getVal(colMesa) as MesaId;
    const rawCargo = getVal(colCargo);
    const cargoVal = normalizeCargo(rawCargo);

    // Clean DNI & Celular from formatting
    let dni = getVal(colDni).replace(/\D/g, '');
    let celular = getVal(colCelular).replace(/[^\d+]/g, '');
    const nombreCompleto = getVal(colNombre);
    const observaciones = getVal(colObs);
    const rawEstado = getVal(colEstado);
    const rawVerif = getVal(colVerif);

    // Standardize Estado
    let estadoContacto: ContactStatus = 'Pendiente';
    const normEstado = normalizeHeader(rawEstado);
    if (normEstado.includes('confirm')) estadoContacto = 'Confirmado';
    else if (normEstado.includes('no responde')) estadoContacto = 'No responde';
    else if (normEstado.includes('incorrecto')) estadoContacto = 'Número incorrecto';

    const verificado: VerificadoTipo = normalizeHeader(rawVerif) === 'si' || normalizeHeader(rawVerif) === 'sí' ? 'Sí' : 'No';

    // Push if at least mesa, cargo, or person details exist
    if (nombreCompleto || dni || celular || (mesaVal && cargoVal)) {
      results.push({
        mesa: mesaVal || undefined,
        cargo: cargoVal || undefined,
        nombreCompleto,
        dni,
        celular,
        estadoContacto,
        observaciones,
        verificado,
      });
    }
  });

  return results;
}
