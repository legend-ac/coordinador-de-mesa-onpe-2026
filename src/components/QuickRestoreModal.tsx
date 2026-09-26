import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react';
import { MesaMember } from '../types';
import { parseExcelFile } from '../utils/excelImport';

interface QuickRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreFromExcel: (members: Partial<MesaMember>[]) => Promise<void>;
}

/** Importación deliberadamente limitada al formato que descarga la aplicación. */
export const QuickRestoreModal: React.FC<QuickRestoreModalProps> = ({ isOpen, onClose, onRestoreFromExcel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  if (!isOpen) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage(null);
    setIsProcessing(true);
    try {
      const rows = await parseExcelFile(file);
      await onRestoreFromExcel(rows);
      setMessage({ text: `${rows.length} registros ubicados por mesa y cargo. Ya se están guardando.`, ok: true });
      window.setTimeout(onClose, 1300);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'No se pudo procesar el archivo Excel.', ok: false });
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="excel-title" className="w-full max-w-md rounded-2xl border-2 border-[#00223A] bg-white p-5 text-[#0b0b0b] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#00223A]/15 pb-4">
          <div className="flex gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#00223A] text-white"><FileSpreadsheet className="h-5 w-5" /></div>
            <div>
              <h2 id="excel-title" className="font-black text-[#00223A]">Importar datos desde Excel</h2>
              <p className="mt-0.5 text-xs text-black/65">Solo se actualizan las filas que coinciden en mesa y cargo.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-black/55 hover:bg-[#f5f1ea] hover:text-black" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>

        <ol className="my-4 space-y-2 text-sm">
          <li className="flex gap-2"><b className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#00223A] text-[11px] text-white">1</b><span>Descarga la <strong>Plantilla Excel</strong> desde la pantalla principal.</span></li>
          <li className="flex gap-2"><b className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#00223A] text-[11px] text-white">2</b><span>Completa los datos sin cambiar las columnas <strong>Mesa</strong> ni <strong>Cargo</strong>.</span></li>
          <li className="flex gap-2"><b className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#D31027] text-[11px] text-white">3</b><span>Selecciona el archivo para cargarlo automáticamente.</span></li>
        </ol>

        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D31027] bg-[#fdf4f5] px-4 text-center hover:bg-[#fbe5e8]">
          <Upload className={`mb-2 h-7 w-7 text-[#D31027] ${isProcessing ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-black text-[#00223A]">{isProcessing ? 'Leyendo y guardando…' : 'Elegir archivo .xlsx o .xls'}</span>
          <span className="mt-1 text-xs text-black/60">No borra registros que no estén en el archivo.</span>
          <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={isProcessing} className="hidden" />
        </label>

        {message && (
          <p className={`mt-4 flex gap-2 rounded-lg border p-3 text-xs font-semibold ${message.ok ? 'border-[#00223A]/25 bg-[#eef4f6] text-[#00223A]' : 'border-[#D31027]/40 bg-[#fdf0f1] text-[#8c0a1a]'}`}>
            {message.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}{message.text}
          </p>
        )}
      </div>
    </div>
  );
};
