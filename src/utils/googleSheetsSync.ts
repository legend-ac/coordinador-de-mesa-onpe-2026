import { MesaMember } from '../types';

export interface GoogleSheetsSyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Creates or updates an official Google Spreadsheet with the live table members.
 */
export async function syncMembersToGoogleSheets(
  accessToken: string,
  members: MesaMember[],
  existingSpreadsheetId?: string
): Promise<GoogleSheetsSyncResult> {
  let spreadsheetId = existingSpreadsheetId;
  let spreadsheetUrl = '';

  // 1. If no spreadsheet ID exists yet, create a new Google Spreadsheet
  if (!spreadsheetId) {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `ONPE 2026 - Control de Mesas (Andy Córdova)`,
        },
        sheets: [
          {
            properties: {
              title: 'Mesas y Miembros',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const errJson = await createRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Error al crear la hoja en Google Sheets');
    }

    const createData = await createRes.json();
    spreadsheetId = createData.spreadsheetId;
    spreadsheetUrl = createData.spreadsheetUrl;
  } else {
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  // 2. Prepare spreadsheet header and formatted rows
  const headers = [
    'MESA',
    'POS',
    'CARGO / CONDICIÓN',
    'NOMBRE COMPLETO',
    'DNI',
    'CELULAR',
    'ESTADO CONTACTO',
    'OBSERVACIONES',
    'VERIFICADO',
    'ÚLTIMA ACTUALIZACIÓN',
  ];

  const sorted = [...members].sort((a, b) => (a.orden || 0) - (b.orden || 0));

  const rows = sorted.map((m) => {
    const posInMesa = ((m.orden - 1) % 9) + 1;
    return [
      m.mesa,
      posInMesa,
      m.cargo,
      m.nombreCompleto || '',
      m.dni || '',
      m.celular || '',
      m.estadoContacto || 'Pendiente',
      m.observaciones || '',
      m.verificado || 'No',
      m.updatedAt || new Date().toLocaleString('es-PE'),
    ];
  });

  const values = [headers, ...rows];

  // 3. Write data to sheet
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:J${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    }
  );

  if (!updateRes.ok) {
    const errJson = await updateRes.json().catch(() => ({}));
    throw new Error(errJson.error?.message || 'Error al actualizar datos en Google Sheets');
  }

  return {
    spreadsheetId: spreadsheetId!,
    spreadsheetUrl: spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}
