import React from 'react';
import { FileDown, FileSpreadsheet, FileText, Lock, Unlock, Upload } from 'lucide-react';
import { useCoordinator } from '../context/CoordinatorContext';

interface HeaderProps {
  mesas: string[];
  onExportExcel: () => void;
  onExportPDF: () => void;
  onOpenRestoreModal: () => void;
  isSyncing: boolean;
  isReadOnly: boolean;
  onToggleReadOnly: () => void;
}

/** Barra de acciones deliberadamente corta: cargar, informar, exportar y proteger. */
export const Header: React.FC<HeaderProps> = ({
  mesas,
  onExportExcel,
  onExportPDF,
  onOpenRestoreModal,
  isSyncing,
  isReadOnly,
  onToggleReadOnly,
}) => {
  const { perfil } = useCoordinator();

  return (
    <header className="sticky top-0 z-30 border-b-4 border-[#D31027] bg-[#00223A] text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/30 bg-[#D31027] text-[10px] font-black tracking-wide">ONPE</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black leading-tight">Control de mesas</p>
              <p className="truncate text-[11px] text-white/80">
                {perfil.nombreCompleto} · {mesas.join(' · ')}
                {isSyncing && <span className="ml-1.5 font-bold text-white">Guardando…</span>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleReadOnly}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-black transition-colors ${
              isReadOnly ? 'border-white bg-[#D31027] text-white' : 'border-white/40 bg-black/20 text-white hover:bg-black/35'
            }`}
            aria-pressed={isReadOnly}
          >
            {isReadOnly ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            <span>{isReadOnly ? 'PROTEGIDO' : 'EDITAR'}</span>
          </button>
        </div>

        <nav aria-label="Acciones principales" className="mt-3 grid grid-cols-3 gap-2">
          <button type="button" onClick={onOpenRestoreModal} className="action-primary"><Upload className="h-4 w-4" /><span>Subir Excel</span></button>
          <button type="button" onClick={onExportPDF} className="action-secondary"><FileText className="h-4 w-4" /><span>Informe PDF</span></button>
          <button type="button" onClick={onExportExcel} className="action-secondary"><FileSpreadsheet className="h-4 w-4" /><span>Plantilla Excel</span><FileDown className="hidden h-3.5 w-3.5 sm:block" /></button>
        </nav>
      </div>
    </header>
  );
};
