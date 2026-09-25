import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
} from 'lucide-react';
import { MesaMember } from '../types';
import { googleSignIn, getAccessToken } from '../firebase';
import { syncMembersToGoogleSheets } from '../utils/googleSheetsSync';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MesaMember[];
  onSuccessToast: (msg: string) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  members,
  onSuccessToast,
}) => {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(() => {
    return localStorage.getItem('onpe_google_sheets_url') || '';
  });
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('onpe_google_sheets_id') || '';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSync = async () => {
    setError(null);
    setIsSyncing(true);

    try {
      let token = await getAccessToken();
      if (!token) {
        const signResult = await googleSignIn();
        if (!signResult?.accessToken) {
          throw new Error('No se autorizó el acceso a Google Sheets.');
        }
        token = signResult.accessToken;
      }

      const result = await syncMembersToGoogleSheets(token, members, spreadsheetId || undefined);
      setSpreadsheetId(result.spreadsheetId);
      setSpreadsheetUrl(result.spreadsheetUrl);

      localStorage.setItem('onpe_google_sheets_id', result.spreadsheetId);
      localStorage.setItem('onpe_google_sheets_url', result.spreadsheetUrl);

      onSuccessToast('¡Datos sincronizados exitosamente con Google Sheets!');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error al conectar con Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0A111D] text-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#16253B] space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#16253B]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#00223A] border border-blue-400 text-white flex items-center justify-center font-bold shadow-sm">
              <FileSpreadsheet className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Google Sheets en Vivo</h3>
              <p className="text-xs text-slate-400">Excel en la nube sincronizado en tiempo real</p>
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

        {/* Description */}
        <div className="text-xs text-slate-300 space-y-2 bg-[#050912] p-3.5 rounded-xl border border-[#16253B]">
          <p>
            Al presionar <strong>"Sincronizar con Google Sheets"</strong>, la aplicación conectará directamente con tu cuenta de Google (<span className="text-white font-bold underline">andyc9750@gmail.com</span>) y mantendrá actualizada tu hoja de cálculo en vivo.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-white font-medium">
            <CheckCircle2 className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>Actualización directa con tu cuenta oficial ONPE.</span>
          </div>
        </div>

        {/* Existing Spreadsheet Link */}
        {spreadsheetUrl && (
          <div className="p-3 bg-[#00223A] border border-blue-400/50 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-white text-xs font-bold">
              <FileCheck className="w-4 h-4 text-red-500" />
              <span>Hoja de Google Sheets Vinculada:</span>
            </div>
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D31027] hover:bg-[#B70E22] text-white rounded-lg text-xs font-black shadow-xs cursor-pointer w-full justify-center transition-all"
            >
              <span>Abrir Hoja en Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-[#2A080C] border border-red-900 rounded-xl text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#16253B]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:bg-[#00223A] hover:text-white cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSync}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D31027] hover:bg-[#B70E22] active:bg-red-800 text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Conectando con Google...' : spreadsheetUrl ? 'Actualizar Google Sheets' : 'Conectar con Google Sheets'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
