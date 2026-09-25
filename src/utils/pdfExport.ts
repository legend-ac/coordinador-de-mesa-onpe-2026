import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CoordinadorPerfil, MesaMember } from '../types';

/**
 * Generates an official, printable ONPE PDF report for Mesa Coordinator Andy Córdova.
 * Colors: Navy Blue (#00223A), Red (#D31027), White (#FFFFFF), Black/Dark Grey.
 */
export async function generateMesaReportPDF(
  members: MesaMember[],
  activeMesaFilter: string = 'TODAS',
  coordinator?: CoordinadorPerfil,
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Pure ONPE Header Colors: Navy & Red
  const onpeNavy: [number, number, number] = [0, 34, 58]; // #00223A
  const onpeRed: [number, number, number] = [211, 16, 39]; // #D31027

  // Top Header Banner
  doc.setFillColor(...onpeNavy);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // ONPE Accent strip (Red)
  doc.setFillColor(...onpeRed);
  doc.rect(0, 28, pageWidth, 2.5, 'F');

  // Title in Banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('OFICINA NACIONAL DE PROCESOS ELECTORALES - ONPE', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('ELECCIONES REGIONALES Y MUNICIPALES 2026', 14, 18);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.text('Informe Oficial de Control y Contactabilidad de Miembros de Mesa', 14, 23);

  // Coordinator info badge (white box)
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  let currentY = 36;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.text(`COORDINADOR DE MESA:`, 18, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${coordinator?.nombreCompleto || 'No registrado'} (DNI: ${coordinator?.dni || 'No registrado'})`, 63, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text(`CONTACTO OFICIAL:`, 18, currentY + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${coordinator?.celular || 'No registrado'} · Coordinador de Mesa`, 63, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text(`MESAS A CARGO:`, 18, currentY + 16);
  doc.setFont('helvetica', 'normal');
  const distinctMesas = Array.from(new Set(members.map((m) => m.mesa))).join(', ');
  doc.text(`${distinctMesas || 'Mesas 51, 52, 53'} | Filtro informe: ${activeMesaFilter}`, 63, currentY + 16);

  // Timestamp
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  doc.setFontSize(7.5);
  doc.text(`Fecha de emisión: ${dateStr} - ${timeStr}`, pageWidth - 16, currentY + 6, { align: 'right' });

  // Summary Metrics Bar
  const filterList = activeMesaFilter === 'TODAS' ? members : members.filter((m) => m.mesa === activeMesaFilter);
  const total = filterList.length;
  const confirmados = filterList.filter((m) => m.estadoContacto === 'Confirmado').length;
  const pendientes = filterList.filter((m) => m.estadoContacto === 'Pendiente').length;
  const verificados = filterList.filter((m) => m.verificado === 'Sí').length;

  currentY += 24;

  const statBoxWidth = (pageWidth - 28 - 12) / 4;

  // Box 1: Total
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY, statBoxWidth, 12, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${total}`, 14 + statBoxWidth / 2, currentY + 5.5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL MIEMBROS', 14 + statBoxWidth / 2, currentY + 9.5, { align: 'center' });

  // Box 2: Confirmados (Navy Blue)
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(14 + statBoxWidth + 4, currentY, statBoxWidth, 12, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 34, 58);
  doc.text(`${confirmados}`, 14 + statBoxWidth + 4 + statBoxWidth / 2, currentY + 5.5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(0, 34, 58);
  doc.text('CONFIRMADOS', 14 + statBoxWidth + 4 + statBoxWidth / 2, currentY + 9.5, { align: 'center' });

  // Box 3: Pendientes
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14 + (statBoxWidth + 4) * 2, currentY, statBoxWidth, 12, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(`${pendientes}`, 14 + (statBoxWidth + 4) * 2 + statBoxWidth / 2, currentY + 5.5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PENDIENTES', 14 + (statBoxWidth + 4) * 2 + statBoxWidth / 2, currentY + 9.5, { align: 'center' });

  // Box 4: Verificados (Red Accent)
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14 + (statBoxWidth + 4) * 3, currentY, statBoxWidth, 12, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(211, 16, 39);
  doc.text(`${verificados}`, 14 + (statBoxWidth + 4) * 3 + statBoxWidth / 2, currentY + 5.5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(211, 16, 39);
  doc.text('VERIFICADOS', 14 + (statBoxWidth + 4) * 3 + statBoxWidth / 2, currentY + 9.5, { align: 'center' });

  // Build Table Data
  const sorted = [...filterList].sort((a, b) => (a.orden || 0) - (b.orden || 0));

  const tableRows = sorted.map((m) => {
    const posInMesa = ((m.orden - 1) % 9) + 1;
    return [
      posInMesa.toString(),
      m.mesa,
      m.cargo,
      m.nombreCompleto || '—',
      m.dni || '—',
      m.celular || '—',
      m.estadoContacto,
      m.verificado === 'Sí' ? 'SÍ' : 'NO',
      m.observaciones || '—',
    ];
  });

  // Table Generation using autoTable
  autoTable(doc, {
    startY: currentY + 16,
    head: [['N°', 'Mesa', 'Cargo / Condición', 'Nombre Completo', 'DNI', 'Celular', 'Estado Contacto', 'Verif.', 'Observaciones']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: onpeNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 26, fontStyle: 'bold' },
      3: { cellWidth: 46 },
      4: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'center', cellWidth: 22 },
      7: { halign: 'center', cellWidth: 12 },
      8: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rawRow = data.row.raw as any;
        const rawCargo = Array.isArray(rawRow) ? rawRow[2] : '';
        if (rawCargo === 'Presidente') {
          data.cell.styles.fillColor = [254, 242, 242]; // Red soft tint
        } else if (rawCargo === 'Secretario') {
          data.cell.styles.fillColor = [239, 246, 255]; // Blue tint
        }

        // Color Contact Status
        if (data.column.index === 6) {
          const val = data.cell.raw;
          if (val === 'Confirmado') {
            data.cell.styles.textColor = [0, 34, 58];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'No responde' || val === 'Número incorrecto') {
            data.cell.styles.textColor = [211, 16, 39];
          } else if (val === 'Pendiente') {
            data.cell.styles.textColor = [71, 85, 105];
          }
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 24 },
  });

  // Footer on each page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `ONPE - Elecciones Regionales y Municipales 2026 · Coordinador: ${coordinator?.nombreCompleto || 'No registrado'}`,
      14,
      pageHeight - 11
    );
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 11, { align: 'right' });

    // Official Signature Space on last page
    if (i === pageCount) {
      const sigY = pageHeight - 34;
      doc.setDrawColor(100, 116, 139);
      doc.line(pageWidth / 2 - 35, sigY, pageWidth / 2 + 35, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(`${coordinator?.nombreCompleto || 'Coordinador de Mesa'}`, pageWidth / 2, sigY + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`Coordinador de Mesa ONPE - DNI ${coordinator?.dni || 'No registrado'}`, pageWidth / 2, sigY + 7.5, { align: 'center' });
    }
  }

  // Save the PDF
  const safeName = (coordinator?.nombreCompleto || 'Coordinador').replace(/\s+/g, '_');
  const filename = `Informe_Oficial_Mesas_ONPE_${safeName}.pdf`;
  doc.save(filename);
}
