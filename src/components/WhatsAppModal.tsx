import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, MessageCircle, MapPin, GraduationCap, Calendar } from 'lucide-react';
import { COORDINADOR_INFO, buildWhatsAppMessage, getWhatsAppUrl } from '../utils/whatsapp';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMemberName?: string;
  targetMemberPhone?: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  targetMemberName = 'Juan Pérez',
  targetMemberPhone = '987654321',
}) => {
  const [testName, setTestName] = useState(targetMemberName);
  const [testPhone, setTestPhone] = useState(targetMemberPhone);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentMessage = buildWhatsAppMessage(testName);
  const waUrl = getWhatsAppUrl(testPhone, testName);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0A111D] text-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#16253B] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header (ONPE Navy) */}
        <div className="bg-[#00223A] border-b border-[#0A111D] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D31027] rounded-xl text-white">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Mensaje Oficial Automatizado de WhatsApp</h2>
              <p className="text-xs text-slate-300">
                Elecciones Regionales y Municipales 2026 • ONPE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#001726] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 bg-[#050912]">

          {/* Coordinator profile card */}
          <div className="p-4 bg-[#0A111D] rounded-xl border border-[#16253B] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Coordinador Responsable ONPE
              </span>
              <span className="text-[11px] bg-[#D31027] text-white px-2 py-0.5 rounded-full font-bold">
                Oficial ERM 2026
              </span>
            </div>
            <p className="text-sm font-semibold text-white">
              {COORDINADOR_INFO.nombre}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-400" />
                <span>Elecciones: 4 de Octubre</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-red-400" />
                <span>Capacitación: 27 de Set.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>Zonal: San Martín 2007</span>
              </div>
            </div>
          </div>

          {/* Test variables interactive box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0A111D] p-3.5 rounded-xl border border-[#16253B]">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nombre del miembro (personaliza el saludo):
              </label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Nombre completo"
                className="w-full text-xs sm:text-sm bg-[#050912] border border-[#16253B] rounded-lg px-3 py-1.5 focus:border-red-500 focus:outline-none text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Número de celular (Perú):
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Ej: 987654321"
                className="w-full text-xs sm:text-sm bg-[#050912] border border-[#16253B] rounded-lg px-3 py-1.5 focus:border-red-500 focus:outline-none text-white"
              />
            </div>
          </div>

          {/* Message Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white uppercase">
                Vista previa del mensaje generado
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#D31027] hover:bg-[#B70E22] px-3 py-1 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar texto'}</span>
              </button>
            </div>

            <div className="bg-[#0A111D] rounded-xl p-4 shadow-sm text-slate-200 text-xs sm:text-sm whitespace-pre-line leading-relaxed font-sans border border-[#16253B] max-h-60 overflow-y-auto">
              {currentMessage}
            </div>
          </div>

          {/* Technical verification points */}
          <div className="text-xs text-slate-400 space-y-1">
            <p>✅ Enlace oficial directo: <code className="bg-[#001726] border border-[#16253B] px-1 py-0.5 rounded text-white">https://wa.me/51[CELULAR]?text=...</code></p>
            <p>✅ Compatible con WhatsApp normal y WhatsApp Business en móviles y web.</p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-[#001726] px-6 py-4 border-t border-[#16253B] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-lg hover:bg-[#00223A] transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#D31027] hover:bg-[#B70E22] text-white rounded-lg font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-white" />
              <span>Abrir WhatsApp Directo</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          ) : (
            <button
              disabled
              className="w-full sm:w-auto px-5 py-2.5 bg-[#0A111D] text-slate-500 border border-[#16253B] rounded-lg font-medium text-xs cursor-not-allowed"
            >
              Ingresa un celular válido para probar
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
