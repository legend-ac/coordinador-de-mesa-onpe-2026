import ExcelJS from 'exceljs';
import { MesaMember, MESAS_DISPONIBLES } from '../types';
import { formatPeruPhone, getWhatsAppUrl, COORDINADOR_INFO } from './whatsapp';

/**
 * Creates and downloads a fully automated, beautifully styled Excel (.xlsx) file
 * tailored for Andy Cordova - ONPE Table Coordinator ERM 2026.
 */
export async function generateAndDownloadExcel(members: MesaMember[], fileName = 'Control_Mesas_ONPE_Andy_Cordova.xlsx') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = `${COORDINADOR_INFO.nombre} - Coordinador ONPE`;
  workbook.lastModifiedBy = `${COORDINADOR_INFO.nombre} - Coordinador ONPE`;
  workbook.created = new Date();
  workbook.modified = new Date();

  // --------------------------------------------------------------------------
  // HOJA 1: Control de Mesas
  // --------------------------------------------------------------------------
  const sheet = workbook.addWorksheet('Control de Mesas', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  // Exactly 9 columns requested:
  // 1. Mesa
  // 2. Cargo / condición
  // 3. Nombre completo
  // 4. DNI
  // 5. Celular
  // 6. Contactar por WhatsApp
  // 7. Estado de contacto
  // 8. Observaciones
  // 9. Verificado
  sheet.columns = [
    { header: 'Mesa', key: 'mesa', width: 14 },
    { header: 'Cargo / condición', key: 'cargo', width: 20 },
    { header: 'Nombre completo', key: 'nombreCompleto', width: 34 },
    { header: 'DNI', key: 'dni', width: 14 },
    { header: 'Celular', key: 'celular', width: 16 },
    { header: 'Contactar por WhatsApp', key: 'whatsapp', width: 26 },
    { header: 'Estado de contacto', key: 'estadoContacto', width: 22 },
    { header: 'Observaciones', key: 'observaciones', width: 42 },
    { header: 'Verificado', key: 'verificado', width: 14 },
  ];

  // Header styling (ONPE Navy Blue)
  const headerRow = sheet.getRow(1);
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF002B49' }, // ONPE Navy
    };
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF001C30' } },
      left: { style: 'thin', color: { argb: 'FF00385F' } },
      bottom: { style: 'medium', color: { argb: 'FF001C30' } },
      right: { style: 'thin', color: { argb: 'FF00385F' } },
    };
  });

  // Base encoded message template for Excel HYPERLINK formulas
  // "🗳️ Hola, " & [Nombre] & ". Soy Andy Cordova, personal de la ONPE y coordinador de mesa a tu cargo para las Elecciones Regionales y Municipales 2026. ..."
  const preMsg = encodeURIComponent(
    '🗳️ Hola, '
  );
  const postMsg = encodeURIComponent(
    '. Soy Andy Cordova, personal de la ONPE y coordinador de mesa a tu cargo para las Elecciones Regionales y Municipales 2026.\n\nEstaré orientándote y acompañándote durante el proceso y el día de las elecciones, este 4 de octubre.\n\n📚 Puedes capacitarte de las siguientes formas:\n\n1️⃣ ONPEduca (plataforma virtual):\nhttps://capacitate.onpe.gob.pe/\n\n2️⃣ Capacitación presencial oficial:\n✅ Participando en las jornadas nacionales de capacitación presencial, los domingos 27 de setiembre en los colegios autorizados.\n\n3️⃣ Capacitación personalizada en oficina zonal:\nUbicada aproximadamente 6 casas más arriba del colegio San Martín 2007. Si deseas acercarte, avísame por este medio y con gusto te capacito. 🙌\n\nCualquier consulta, puedes escribirme. ¡Nos vemos!'
  );

  // Grouping colors for the 3 tables to visually distinguish without saturation
  const mesaColors: Record<string, { bg: string; badgeBg: string; badgeFg: string; border: string }> = {
    'Mesa 51': { bg: 'FFF8FAFD', badgeBg: 'FFEBF2FA', badgeFg: 'FF0D47A1', border: 'FFBBDEFB' },
    'Mesa 52': { bg: 'FFFFFFFF', badgeBg: 'FFE8F5E9', badgeFg: 'FF1B5E20', border: 'FFC8E6C9' },
    'Mesa 53': { bg: 'FFFDFBF7', badgeBg: 'FFF3E5F5', badgeFg: 'FF4A148C', border: 'FFE1BEE7' },
  };

  // Add all 27 rows (exactly 9 per mesa)
  members.forEach((member, index) => {
    const rowNumber = index + 2; // header is row 1
    const colorInfo = mesaColors[member.mesa] || { bg: 'FFFFFFFF', badgeBg: 'FFF1F5F9', badgeFg: 'FF1E293B', border: 'FFE2E8F0' };

    // Standard Peru clean phone check
    const cleanPhone = formatPeruPhone(member.celular);
    const hasPhone = cleanPhone && cleanPhone.length >= 9;

    // Direct link if phone is present
    const directUrl = hasPhone ? getWhatsAppUrl(member.celular, member.nombreCompleto) : null;

    // Excel Dynamic Formula for WhatsApp button:
    // Takes Celular from column E and Nombre from column C of the exact same row:
    // Checks if E{rowNumber} is not empty; formats with 51 prefix if 9 digits, and links to WhatsApp.
    const formulaWhatsApp = `IF(OR(ISBLANK(E${rowNumber}), E${rowNumber}=""), "—", HYPERLINK("https://wa.me/" & IF(LEN(SUBSTITUTE(TRIM(E${rowNumber})," ",""))=9, "51" & SUBSTITUTE(TRIM(E${rowNumber})," ",""), SUBSTITUTE(TRIM(E${rowNumber})," ","")) & "?text=${preMsg}" & SUBSTITUTE(SUBSTITUTE(TRIM(C${rowNumber})," ","%20"),"#","") & "${postMsg}", "💬 Enviar mensaje"))`;

    const row = sheet.addRow({
      mesa: member.mesa,
      cargo: member.cargo,
      nombreCompleto: member.nombreCompleto || '',
      dni: member.dni || '',
      celular: member.celular || '',
      whatsapp: directUrl
        ? { text: '💬 Enviar mensaje', hyperlink: directUrl }
        : { formula: formulaWhatsApp, result: '💬 Enviar mensaje' },
      estadoContacto: member.estadoContacto || 'Pendiente',
      observaciones: member.observaciones || '',
      verificado: member.verificado || 'No',
    });

    row.height = 26;

    // Apply cell formatting and data validations
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      // Base font
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle' };

      // Base background per mesa for subtle visual hierarchy
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colorInfo.bg },
      };

      // Borders
      const isLastOfMesa = (index + 1) % 9 === 0;
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: isLastOfMesa
          ? { style: 'medium', color: { argb: 'FF002B49' } }
          : { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Column-specific formatting:
      // Col 1: Mesa
      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colorInfo.badgeFg } };
      }

      // Col 2: Cargo
      if (colNumber === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        if (member.cargo === 'Presidente') {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        }
      }

      // Col 3: Nombre completo
      if (colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      }

      // Col 4: DNI (Formato texto '@' para evitar truncar ceros)
      if (colNumber === 4) {
        cell.numFmt = '@';
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Col 5: Celular (Formato texto '@' para evitar truncar ceros)
      if (colNumber === 5) {
        cell.numFmt = '@';
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Col 6: WhatsApp
      if (colNumber === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: hasPhone ? 'FF008000' : 'FF2563EB' },
          underline: hasPhone ? true : undefined,
        };
      }

      // Col 7: Estado de contacto (Data validation dropdown + colors)
      if (colNumber === 7) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: ['"Pendiente,Confirmado,No responde,Número incorrecto"'],
          showErrorMessage: true,
          errorTitle: 'Estado inválido',
          error: 'Por favor seleccione uno de los estados permitidos: Pendiente, Confirmado, No responde o Número incorrecto.',
        };

        // Static color fill based on current state
        if (member.estadoContacto === 'Confirmado') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Green
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } };
        } else if (member.estadoContacto === 'Pendiente') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } }; // Yellow
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF854D0E' } };
        } else if (member.estadoContacto === 'No responde' || member.estadoContacto === 'Número incorrecto') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Red
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF991B1B' } };
        }
      }

      // Col 8: Observaciones
      if (colNumber === 8) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }

      // Col 9: Verificado (Data validation dropdown + color)
      if (colNumber === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: ['"Sí,No"'],
          showErrorMessage: true,
          errorTitle: 'Valor inválido',
          error: 'Por favor seleccione "Sí" o "No".',
        };

        if (member.verificado === 'Sí') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } };
        } else {
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF64748B' } };
        }
      }
    });
  });

  // Conditional Formatting Rules for Estado de contacto & Verificado in Excel
  // When users change cell values in Excel, colors auto-update!
  sheet.addConditionalFormatting({
    ref: 'G2:G28',
    rules: [
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['"Confirmado"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFDCFCE7' } },
          font: { bold: true, color: { argb: 'FF166534' } },
        },
        priority: 1,
      },
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['"Pendiente"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEF9C3' } },
          font: { bold: true, color: { argb: 'FF854D0E' } },
        },
        priority: 2,
      },
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['"No responde"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEE2E2' } },
          font: { bold: true, color: { argb: 'FF991B1B' } },
        },
        priority: 3,
      },
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['"Número incorrecto"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEE2E2' } },
          font: { bold: true, color: { argb: 'FF991B1B' } },
        },
        priority: 4,
      },
    ],
  });

  sheet.addConditionalFormatting({
    ref: 'I2:I28',
    rules: [
      {
        type: 'cellIs',
        operator: 'equal',
        formulae: ['"Sí"'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFDCFCE7' } },
          font: { bold: true, color: { argb: 'FF166534' } },
        },
        priority: 1,
      },
    ],
  });

  // --------------------------------------------------------------------------
  // HOJA 2: Resumen y Estadísticas (Panel automático por mesa)
  // --------------------------------------------------------------------------
  const summarySheet = workbook.addWorksheet('Resumen y Estadísticas', {
    pageSetup: { orientation: 'portrait', fitToPage: true, fitToWidth: 1 }
  });

  summarySheet.columns = [
    { width: 22 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
  ];

  // Title Banner
  summarySheet.mergeCells('A1:E1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'RESUMEN OFICIAL DE COORDINACIÓN DE MESAS - ONPE 2026';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002B49' } };
  summarySheet.getRow(1).height = 36;

  // Subtitle
  summarySheet.mergeCells('A2:E2');
  const subTitleCell = summarySheet.getCell('A2');
  subTitleCell.value = `Coordinador: Andy Cordova  |  Jornada Electoral: 4 de Octubre  |  Total Mesas: 3 (51, 52 y 53)`;
  subTitleCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF475569' } };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(2).height = 22;

  // Header row for Summary Table
  const tableHeaderRow = summarySheet.getRow(4);
  tableHeaderRow.height = 28;
  const summaryHeaders = ['Mesa', 'Total Miembros', 'Con Celular', 'Confirmados', 'Verificados'];
  summaryHeaders.forEach((h, i) => {
    const c = summarySheet.getCell(4, i + 1);
    c.value = h;
    c.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F3F66' } };
    c.border = {
      top: { style: 'thin', color: { argb: 'FF001C30' } },
      bottom: { style: 'thin', color: { argb: 'FF001C30' } },
      left: { style: 'thin', color: { argb: 'FF001C30' } },
      right: { style: 'thin', color: { argb: 'FF001C30' } },
    };
  });

  // Table rows mapping to exact row spans in 'Control de Mesas':
  // Mesa 51: rows 2 to 10
  // Mesa 52: rows 11 to 19
  // Dynamically compute mesaSpans based on members
  const uniqueMesasInMembers: string[] = [];
  members.forEach((m) => {
    if (m.mesa && !uniqueMesasInMembers.includes(m.mesa)) {
      uniqueMesasInMembers.push(m.mesa);
    }
  });

  const mesaSpans = uniqueMesasInMembers.map((mesa, idx) => {
    const startRow = idx * 9 + 2;
    const endRow = startRow + 8;
    return { mesa, startRow, endRow };
  });

  mesaSpans.forEach((m, idx) => {
    const rowIdx = 5 + idx;
    const r = summarySheet.getRow(rowIdx);
    r.height = 24;

    // Calculate current live values for the pre-calculated formula result
    const currentMesaMembers = members.filter((x) => x.mesa === m.mesa);
    const withPhoneCount = currentMesaMembers.filter((x) => Boolean(x.celular && x.celular.trim())).length;
    const confirmedCount = currentMesaMembers.filter((x) => x.estadoContacto === 'Confirmado').length;
    const verifiedCount = currentMesaMembers.filter((x) => x.verificado === 'Sí').length;

    // Col A: Mesa
    const cellA = summarySheet.getCell(rowIdx, 1);
    cellA.value = m.mesa;
    cellA.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF002B49' } };
    cellA.alignment = { vertical: 'middle', horizontal: 'center' };

    // Col B: Total Miembros (9)
    const cellB = summarySheet.getCell(rowIdx, 2);
    cellB.value = currentMesaMembers.length || 9;
    cellB.font = { name: 'Segoe UI', size: 10 };
    cellB.alignment = { vertical: 'middle', horizontal: 'center' };

    // Col C: Con Celular (Formula: COUNTIF on Celular column E)
    const cellC = summarySheet.getCell(rowIdx, 3);
    cellC.value = {
      formula: `COUNTIF('Control de Mesas'!E${m.startRow}:E${m.endRow}, "<>")`,
      result: withPhoneCount,
    };
    cellC.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0284C7' } };
    cellC.alignment = { vertical: 'middle', horizontal: 'center' };

    // Col D: Confirmados (Formula: COUNTIF on Estado column G)
    const cellD = summarySheet.getCell(rowIdx, 4);
    cellD.value = {
      formula: `COUNTIF('Control de Mesas'!G${m.startRow}:G${m.endRow}, "Confirmado")`,
      result: confirmedCount,
    };
    cellD.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF16A34A' } };
    cellD.alignment = { vertical: 'middle', horizontal: 'center' };

    // Col E: Verificados (Formula: COUNTIF on Verificado column I)
    const cellE = summarySheet.getCell(rowIdx, 5);
    cellE.value = {
      formula: `COUNTIF('Control de Mesas'!I${m.startRow}:I${m.endRow}, "Sí")`,
      result: verifiedCount,
    };
    cellE.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } };
    cellE.alignment = { vertical: 'middle', horizontal: 'center' };

    // Style borders and bg
    [cellA, cellB, cellC, cellD, cellE].forEach((c) => {
      c.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: idx % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' },
      };
      c.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  // TOTAL Row
  const totalRowIdx = 5 + mesaSpans.length;
  const tr = summarySheet.getRow(totalRowIdx);
  tr.height = 26;

  const totalMembersCount = members.length;
  const totalPhoneCount = members.filter((x) => Boolean(x.celular && x.celular.trim())).length;
  const totalConfirmedCount = members.filter((x) => x.estadoContacto === 'Confirmado').length;
  const totalVerifiedCount = members.filter((x) => x.verificado === 'Sí').length;

  const totA = summarySheet.getCell(totalRowIdx, 1);
  totA.value = 'TOTAL GENERAL';
  totA.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  totA.alignment = { vertical: 'middle', horizontal: 'center' };

  const totB = summarySheet.getCell(totalRowIdx, 2);
  totB.value = { formula: `SUM(B5:B${totalRowIdx - 1})`, result: totalMembersCount };
  totB.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  totB.alignment = { vertical: 'middle', horizontal: 'center' };

  const totC = summarySheet.getCell(totalRowIdx, 3);
  totC.value = { formula: `SUM(C5:C${totalRowIdx - 1})`, result: totalPhoneCount };
  totC.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  totC.alignment = { vertical: 'middle', horizontal: 'center' };

  const totD = summarySheet.getCell(totalRowIdx, 4);
  totD.value = { formula: `SUM(D5:D${totalRowIdx - 1})`, result: totalConfirmedCount };
  totD.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  totD.alignment = { vertical: 'middle', horizontal: 'center' };

  const totE = summarySheet.getCell(totalRowIdx, 5);
  totE.value = { formula: `SUM(E5:E${totalRowIdx - 1})`, result: totalVerifiedCount };
  totE.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  totE.alignment = { vertical: 'middle', horizontal: 'center' };

  [totA, totB, totC, totD, totE].forEach((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002B49' } };
    c.border = {
      top: { style: 'medium', color: { argb: 'FF001C30' } },
      bottom: { style: 'medium', color: { argb: 'FF001C30' } },
      left: { style: 'thin', color: { argb: 'FF00385F' } },
      right: { style: 'thin', color: { argb: 'FF00385F' } },
    };
  });

  // Additional instructions and tips inside the sheet
  const notesStartRow = 11;
  summarySheet.getCell(notesStartRow, 1).value = '📋 INSTRUCCIONES Y RECOMENDACIONES:';
  summarySheet.getCell(notesStartRow, 1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF002B49' } };

  const tips = [
    '1. La columna "Contactar por WhatsApp" contiene enlaces automatizados con el mensaje oficial pre-redactado para Andy Cordova (ONPE ERM 2026).',
    '2. Si el número celular tiene 9 dígitos, se le antepone automáticamente el código internacional de Perú (+51).',
    '3. Las columnas DNI y Celular están formateadas como texto para preservar los ceros a la izquierda sin alteraciones numéricas.',
    '4. Las listas desplegables en "Estado de contacto" y "Verificado" permiten un seguimiento ágil y estandarizado con formato condicional.',
    '5. Este archivo se sincroniza con la base de datos en tiempo real de Firebase Firestore.',
  ];

  tips.forEach((tip, idx) => {
    const tipRow = summarySheet.getRow(notesStartRow + 1 + idx);
    summarySheet.mergeCells(`A${notesStartRow + 1 + idx}:E${notesStartRow + 1 + idx}`);
    const c = summarySheet.getCell(`A${notesStartRow + 1 + idx}`);
    c.value = tip;
    c.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF334155' } };
    tipRow.height = 20;
  });

  // Write buffer and initiate download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
