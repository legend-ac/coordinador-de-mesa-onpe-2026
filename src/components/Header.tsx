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
import { COORDINADOR_INFO } from '../utils/whatsapp';
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
          
          {/* Brand & Coordinator Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#D31027] text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm border border-white/20">
              ONPE
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                  Coordinador de Mesa
                </span>
                <span className="text-[10px] sm:text-xs bg-[#001726] text-white border border-[#213555] px-2 py-0.5 rounded font-mono font-bold truncate max-w-[190px]">
                  {mesas && mesas.length > 0 ? mesas.join(' • ') : 'Mesas 51, 52, 53'}
                </span>
                {isSyncing && (
                  <span className="w-2 h-2 rounded-full bg-[#D31027] animate-ping" title="Sincronizando..." />
                )}
              </div>
              <p className="text-[11px] text-slate-300 truncate hidden sm:block">
                Responsable: <strong className="text-white font-bold">{COORDINADOR_INFO.nombre}</strong> • Elecciones Regionales y Municipales 2026
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            
            {/* Seguro de Datos / Bloqueo contra modificaciones (Lock) */}
            <button
              onClick={onToggleReadOnly}
              type="button"
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                isReadOnly
                  ? 'bg-[#D31027] text-white border-red-500 shadow-md font-black'
                  : 'bg-[#001726] hover:bg-[#003358] text-white border-[#213555]'
              }`}
              title={isReadOnly ? 'Seguro ACTIVO: Datos protegidos contra cambios. Clic para desbloquear edición.' : 'Activar seguro de datos'}
            >
              {isReadOnly ? <Lock className="w-3.5 h-3.5 text-white" /> : <Unlock className="w-3.5 h-3.5 text-slate-300" />}
              <span className="hidden sm:inline">{isReadOnly ? 'Seguro Activo' : 'Poner Seguro'}</span>
            </button>

            {/* RECUPERAR / SUBIR EXCEL RELLENADO */}
            <button
              onClick={onOpenRestoreModal}
              type="button"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#D31027] hover:bg-[#B70E22] text-white text-xs font-black flex items-center gap-1 transition-all cursor-pointer border border-red-400 shadow-md"
              title="Subir tu archivo Excel con datos para colocarlos automáticamente"
            >
              <Upload className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Subir Mi Excel</span>
            </button>

            {/* Descargar Informe PDF Oficial para Imprimir */}
            <button
              onClick={onExportPDF}
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#001726] hover:bg-[#003358] text-white border border-[#213555] text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Descargar Informe Oficial en PDF para imprimir o enviar"
            >
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Informe PDF</span>
            </button>

            {/* Google Sheets en Vivo */}
            <button
              onClick={onOpenGoogleSheetsModal}
              type="button"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#001726] hover:bg-[#003358] text-white border border-[#213555] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Conectar y sincronizar datos en vivo con Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden sm:inline">Google Sheets</span>
            </button>

            {/* Download Excel Button */}
            <button
              onClick={onExportExcel}
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 active:bg-slate-200 text-[#00223A] text-xs font-black shadow-sm transition-all cursor-pointer border border-white"
              title="Descargar archivo Excel (.xlsx) oficial"
            >
              <Download className="w-3.5 h-3.5 text-[#00223A]" />
              <span>Excel (.xlsx)</span>
            </button>

            {/* Cambiar Clave PIN Personalizada */}
            <button
              onClick={onOpenChangePin}
              type="button"
              className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-[#001726] hover:bg-[#003358] text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-[#213555]"
              title="Cambiar mi clave PIN personalizada"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden md:inline">Clave</span>
            </button>

            {/* Official WhatsApp Message modal trigger */}
            <button
              onClick={onOpenWhatsAppModal}
              type="button"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#001726] hover:bg-[#003358] text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-[#213555]"
              title="Ver el mensaje oficial de WhatsApp Business"
            >
              <MessageSquare className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Download Project ZIP directly to PC */}
            <button
              onClick={onDownloadZip}
              type="button"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#001726] hover:bg-[#003358] text-slate-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-[#213555]"
              title="Descargar todo el código fuente del proyecto en un archivo .ZIP"
            >
              <FolderDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">ZIP</span>
            </button>

            {/* Hidden direct import file input */}
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
                title="Restablecer datos vacíos"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Bloquear / Cerrar Sesión Segura */}
            <button
              onClick={logoutSecuritySession}
              type="button"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#D31027]/20 hover:bg-[#D31027] text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-[#D31027]"
              title="Cerrar sesión y bloquear la pantalla con PIN"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400 group-hover:text-white" />
              <span className="hidden sm:inline">Bloquear</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
