import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, X, Share2, PlusSquare, HelpCircle } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already installed in standalone mode or dismissed, don't show
  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-[#00223A] text-white px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between shadow-md border-b border-[#D31027]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#D31027] text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-extrabold text-white">
                📲 Instalar en tu Celular
              </span>
              <span className="text-[10px] bg-[#D31027] text-white px-1.5 py-0.2 rounded font-semibold hidden xs:inline">
                App Oficial ONPE
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              Úsala a pantalla completa y sin depender de escribir la URL.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Main Action Button */}
          <button
            type="button"
            onClick={async () => {
              if (isInstallable) {
                const res = await install();
                if (!res) setShowGuideModal(true);
              } else {
                setShowGuideModal(true);
              }
            }}
            className="inline-flex items-center gap-1.5 bg-[#D31027] hover:bg-[#B70E22] text-white font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-xl shadow-md cursor-pointer transition-all border border-red-400"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Instalar App</span>
          </button>

          {/* Quick Info / Guide */}
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="¿Cómo instalar en mi celular?"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Dismiss */}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            title="Ocultar barra"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0A111D] text-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-[#16253B] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#16253B]">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#D31027]" />
                <h3 className="text-sm font-bold text-white">Instalar en la pantalla de inicio</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              {isIOS ? (
                <>
                  <p className="font-semibold text-white">En iPhone / iPad (Safari):</p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                    <li className="flex items-start gap-1.5">
                      <span>1. Presiona el botón</span>
                      <Share2 className="w-4 h-4 text-white inline flex-shrink-0" />
                      <span><strong>Compartir</strong> abajo en Safari.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span>2. Selecciona</span>
                      <PlusSquare className="w-4 h-4 text-white inline flex-shrink-0" />
                      <span><strong>"Agregar a pantalla de inicio"</strong>.</span>
                    </li>
                    <li>3. Presiona <strong>Agregar</strong> en la esquina superior derecha.</li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="font-semibold text-white">En Android (Chrome / Edge):</p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                    <li>1. Abre el menú del navegador (los 3 puntos arriba a la derecha <strong>⋮</strong>).</li>
                    <li>2. Toca <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.</li>
                    <li>3. Confirma tocando <strong>Instalar</strong>.</li>
                  </ol>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-[#16253B] flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-[#00223A] hover:bg-[#003358] text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-[#213555]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
