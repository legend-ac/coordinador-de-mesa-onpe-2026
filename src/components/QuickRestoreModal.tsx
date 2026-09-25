import React, { useState } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { MesaMember } from '../types';
import { parseExcelFile } from '../utils/excelImport';

interface QuickRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreFromExcel: (members: Partial<MesaMember>[]) => Promise<void>;
}

export const QuickRestoreModal: React.FC<QuickRestoreModalProps> = ({
  isOpen,
  onClose,
  onRestoreFromExcel,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [cachedBackupFound] = useState<MesaMember[] | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = localStorage.getItem('onpe_members_data_backup');
        if (item) {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed) && parsed.some((m) => m.nombreCompleto || m.dni || m.celular)) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }
    return null;
  });

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMsg(null);
    setSuccessMsg(null);
    setIsProcessing(true);

    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        setStatusMsg('No se detectaron datos en el archivo seleccionado.');
        setIsProcessing(false);
        return;
      }
      await onRestoreFromExcel(rows);
      setSuccessMsg(`¡${rows.length} registros cargados y colocados automáticamente en tus mesas!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMsg(err.message || 'Error al procesar el archivo Excel.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreFromCache = () => {
    if (cachedBackupFound) {
      onRestoreFromExcel(cachedBackupFound);
      setSuccessMsg('¡Datos previos restaurados exitosamente!');
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0A111D] text-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#16253B] space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#16253B]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#00223A] border border-blue-400 text-white flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Subir Mi Archivo Excel</h3>
              <p className="text-xs text-slate-400">Los datos se colocan automáticamente en cada mesa y cargo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone */}
        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center p-7 border-2 border-dashed border-[#D31027] rounded-xl bg-[#001726]/60 hover:bg-[#00223A]/80 cursor-pointer transition-all text-center">
            <Upload className="w-9 h-9 text-red-500 mb-2 animate-bounce" />
            <span className="text-sm font-black text-white">
              {isProcessing ? 'Procesando archivo...' : 'Selecciona tu archivo Excel (.xlsx o .xls)'}
            </span>
            <span className="text-xs text-slate-300 mt-1">
              Coloca los nombres, DNIs, teléfonos, cargos y mesas automáticamente al instante.
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
            />
          </label>
        </div>

        {/* Local Backup shortcut if available */}
        {cachedBackupFound && (
          <div className="p-3 bg-[#00223A]/80 border border-blue-500/40 rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-white flex-shrink-0" />
              <span className="text-xs text-slate-200">
                Se detectó una copia guardada en la memoria local de tu navegador.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRestoreFromCache}
              className="px-3 py-1.5 bg-[#D31027] hover:bg-[#B70E22] text-white rounded-lg text-xs font-black whitespace-nowrap cursor-pointer"
            >
              Restaurar copia
            </button>
          </div>
        )}

        {/* Status Messages */}
        {statusMsg && (
          <div className="flex items-center gap-2 p-2.5 bg-[#2A080C] border border-red-800 rounded-xl text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-2.5 bg-[#00223A] border border-blue-400 rounded-xl text-white text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#16253B]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-400 hover:text-white hover:bg-[#00223A] cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
