import React, { useRef } from 'react';
import {
  Download,
  Upload,
  MessageSquare,
  RefreshCw,
  FolderDown,
  LogOut,
  KeyRound,
  Lock,
  Unlock,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useCoordinator } from '../context/CoordinatorContext';
import { logoutSecuritySession } from './AuthGate';

interface HeaderProps {
  mesas: string[];
  onExportExcel: () => void;
  onExportPDF: () => void;
  onImportExcel: (file: File) => void;
  onOpenWhatsAppModal: () => void;
  onOpenGoogleSheetsModal: () => void;
  onOpenRestoreModal: () => void;
  onDownloadZip: () => void;
  onResetData: () => void;
  isSyncing: boolean;
  onOpenChangePin: () => void;
  isReadOnly: boolean;
  onToggleReadOnly: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mesas,
  onExportExcel,
  onExportPDF,
  onImportExcel,
  onOpenWhatsAppModal,
  onOpenGoogleSheetsModal,
  onOpenRestoreModal,
  onDownloadZip,
  onResetData,
  isSyncing,
  onOpenChangePin,
  isReadOnly,
  onToggleReadOnly,
}) => {
  const { perfil } = useCoordinator();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportExcel(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header className="bg-[#00223A] text-white border-b border-[#0A111D] sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2">

          {/* Brand & Coordinator */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#D31027] text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm border border-white/20">
              ONPE
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                  Coordinador de Mesa
                </span>
                <span className="text-[10px] sm:text-xs bg-[#001726] text-white border border-[#213555] px-2 py-0.5 rounded font-mono font-bold truncate max-w-[200px]">
                  {mesas && mesas.length > 0 ? mesas.join(' • ') : 'Sin mesas'}
                </span>
                {isSyncing && (
                  <span className="w-2 h-2 rounded-full bg-[#D31027] animate-ping" title="Sincronizando..." />
                )}
              </div>
              <p className="text-[11px] text-slate-300 truncate hidden sm:block">
                Responsable:{' '}
                <strong className="text-white font-bold">{perfil.nombreCompleto}</strong>
                {perfil.dni && <span className="text-slate-400"> · DNI {perfil.dni}</span>}
                {' • '}Elecciones Regionales y Municipales 2026
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

            {/* Seguro de datos */}
            <button
              onClick={onToggleReadOnly}
              type="button"
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                isReadOnly
                  ? 'bg-[#D31027] text-white border-red-500 shadow-md font-black'
                  : 'bg-[#001726] hover:bg-[#003358] text-white border-[#213555]'
              }`}
              title={isReadOnly ? 'Seguro ACTIVO — clic para desbloquear' : 'Activar seguro de datos'}
            >
              {isReadOnly ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-slate-300" />}
              <span className="hidden sm:inline">{isReadOnly ? 'Seguro Activo' : 'Poner Seguro'}</span>
            </button>

            {/* Subir Excel */}
            <button
              onClick={onOpenRestoreModal}
              type="button"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#D31027] hover:bg-[#B70E22] text-white text-xs font-black flex items-center gap-1 transition-all cursor-pointer border border-red-400 shadow-md"
              title="Subir Excel con datos"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Subir Mi Excel</span>
            </button>

            {/* Informe PDF */}
            <button
              onClick={onExportPDF}
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#001726] hover:bg-[#003358] text-white border border-[#213555] text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Descargar Informe PDF"
            >
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Informe PDF</span>
            </button>

            {/* Google Sheets */}
            <button
              onClick={onOpenGoogleSheetsModal}
              type="button"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#001726] hover:bg-[#003358] text-white border border-[#213555] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Sincronizar con Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden sm:inline">Google Sheets</span>
            </button>

            {/* Excel */}
            <button
              onClick={onExportExcel}
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-[#00223A] text-xs font-black shadow-sm transition-all cursor-pointer border border-white"
              title="Descargar Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-[#00223A]" />
              <span>Excel</span>
            </button>

            {/* Cambiar PIN */}
            <button
              onClick={onOpenChangePin}
              type="button"
              className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-[#001726] hover:bg-[#003358] text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-[#213555]"
              title="Cambiar PIN"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden md:inline">Clave</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={onOpenWhatsAppModal}
              type="button"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#001726] hover:bg-[#003358] text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-[#213555]"
              title="Mensaje WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* ZIP */}
            <button
              onClick={onDownloadZip}
              type="button"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#001726] hover:bg-[#003358] text-slate-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-[#213555]"
              title="Descargar código fuente .ZIP"
            >
              <FolderDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">ZIP</span>
            </button>

            {/* Input oculto para importar */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Reset */}
            {!isReadOnly && (
              <button
                onClick={onResetData}
                type="button"
                className="p-1.5 rounded-lg bg-[#001726] hover:bg-[#D31027] text-slate-400 hover:text-white text-xs transition-all cursor-pointer hidden sm:flex items-center border border-[#213555]"
                title="Reiniciar datos"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Cerrar sesión */}
            <button
              onClick={logoutSecuritySession}
              type="button"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#D31027]/20 hover:bg-[#D31027] text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-[#D31027]"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Salir</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
