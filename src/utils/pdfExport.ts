import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CoordinadorPerfil, MesaMember } from '../types';

const NAVY: [number, number, number] = [0, 34, 58];
const RED: [number, number, number] = [211, 16, 39];

/** Crea un informe imprimible: cada mesa siempre ocupa una página A4 propia. */
export async function generateMesaReportPDF(
  members: MesaMember[],
  activeMesaFilter = 'TODAS',
  coordinator?: CoordinadorPerfil,
): Promise<void> {
  const mesas = activeMesaFilter === 'TODAS'
    ? Array.from(new Set(members.map((member) => member.mesa))).filter(Boolean)
    : [activeMesaFilter];
  const reportMesas = mesas.length ? mesas : ['Mesa sin asignar'];
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const emittedAt = new Date().toLocaleString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  reportMesas.forEach((mesa, pageIndex) => {
    if (pageIndex > 0) doc.addPage();
    const mesaMembers = members
      .filter((member) => member.mesa === mesa)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));
    const confirmed = mesaMembers.filter((member) => member.estadoContacto === 'Confirmado').length;
    const verified = mesaMembers.filter((member) => member.verificado === 'Sí').length;
    const withPhone = mesaMembers.filter((member) => member.celular.trim()).length;

    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(...RED);
    doc.rect(0, 28, pageWidth, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('ONPE · CONTROL DE MIEMBROS DE MESA', 14, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Elecciones Regionales y Municipales 2026', 14, 18);
    doc.text(`Emitido: ${emittedAt}`, pageWidth - 14, 18, { align: 'right' });

    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`INFORME · ${mesa}`, 14, 43);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`Coordinador: ${coordinator?.nombreCompleto || 'No registrado'} · DNI: ${coordinator?.dni || '—'}`, 14, 50);
    doc.text(`Contacto: ${coordinator?.celular || 'No registrado'}`, 14, 55);

    const stats = [['Miembros', mesaMembers.length], ['Con celular', withPhone], ['Confirmados', confirmed], ['Verificados', verified]];
    const statWidth = (pageWidth - 28 - 9) / 4;
    stats.forEach(([label, value], index) => {
      const x = 14 + index * (statWidth + 3);
      doc.setFillColor(index === 3 ? 252 : 245, index === 3 ? 235 : 241, index === 3 ? 237 : 234);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(x, 62, statWidth, 16, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(index === 3 ? RED[0] : NAVY[0], index === 3 ? RED[1] : NAVY[1], index === 3 ? RED[2] : NAVY[2]);
      doc.text(String(value), x + statWidth / 2, 68.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(String(label).toUpperCase(), x + statWidth / 2, 74, { align: 'center' });
    });

    autoTable(doc, {
      startY: 86,
      head: [['N°', 'Cargo', 'Nombre completo', 'DNI', 'Celular', 'Estado', 'Verif.', 'Observaciones']],
      body: mesaMembers.map((member, index) => [
        String(index + 1), member.cargo, member.nombreCompleto || '—', member.dni || '—',
        member.celular || '—', member.estadoContacto, member.verificado === 'Sí' ? 'SÍ' : 'NO', member.observaciones || '—',
      ]),
      theme: 'grid',
      margin: { left: 14, right: 14, bottom: 38 },
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 7.5, halign: 'center' },
      bodyStyles: { fontSize: 7.2, textColor: [15, 23, 42], cellPadding: 2, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 25 }, 2: { cellWidth: 42 },
        3: { cellWidth: 18, halign: 'center' }, 4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 24, halign: 'center' }, 6: { cellWidth: 12, halign: 'center' }, 7: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const status = String(data.cell.raw);
          if (status === 'Confirmado') data.cell.styles.textColor = NAVY;
          if (status === 'No responde' || status === 'Número incorrecto') data.cell.styles.textColor = RED;
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    const signatureY = pageHeight - 30;
    doc.setDrawColor(100, 116, 139);
    doc.line(pageWidth / 2 - 34, signatureY, pageWidth / 2 + 34, signatureY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(coordinator?.nombreCompleto || 'Coordinador de mesa', pageWidth / 2, signatureY + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Coordinador de mesa', pageWidth / 2, signatureY + 8, { align: 'center' });
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`ONPE · ${reportMesas[page - 1]}`, 14, pageHeight - 11);
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - 14, pageHeight - 11, { align: 'right' });
  }

  const safeName = (coordinator?.nombreCompleto || 'Coordinador').replace(/\s+/g, '_');
  doc.save(`Informe_Mesas_ONPE_${safeName}.pdf`);
}
