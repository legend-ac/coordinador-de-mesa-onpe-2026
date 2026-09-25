import React, { useState } from 'react';
import { MesaMember, MesaId, MESAS_DISPONIBLES } from '../types';
import { QRCodeDisplay } from './QRCodeDisplay';
import { Printer, X, Download, ShieldCheck, CheckSquare, Phone, QrCode } from 'lucide-react';
import { getWhatsAppUrl, COORDINADOR_INFO } from '../utils/whatsapp';

interface ClipboardSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MesaMember[];
  selectedMesa: MesaId;
}

export const ClipboardSheetModal: React.FC<ClipboardSheetModalProps> = ({
  isOpen,
  onClose,
  members,
  selectedMesa: initialMesa,
}) => {
  const [activeMesa, setActiveMesa] = useState<MesaId>(initialMesa || 'Mesa 51');

  if (!isOpen) return null;

  const currentMesaMembers = members
    .filter((m) => m.mesa === activeMesa)
    .sort((a, b) => a.orden - b.orden);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Modal Toolbar (hidden when printing) */}
        <div className="print:hidden bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm sm:text-base font-bold">
                Ficha de Portapapeles Físico (Clipboard) con Códigos QR
              </h2>
              <p className="text-xs text-slate-400">
                Imprime esta hoja para tenerla en tu carpeta de campo y escanear contactos con el celular
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mesa Selector */}
            <div className="inline-flex p-0.5 bg-slate-800 rounded-lg text-xs">
              {MESAS_DISPONIBLES.map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveMesa(m)}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    activeMesa === m ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Content */}
        <div className="p-6 sm:p-8 bg-white text-slate-900 print:p-0 print:m-0 print:text-black">
          
          {/* Header of the Sheet */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#002B49] text-white flex items-center justify-center font-black text-xl">
                ONPE
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase">
                  FICHA DE CONTROL Y ESCANEO DE MIEMBROS DE MESA
                </h1>
                <p className="text-xs text-slate-600">
                  Elecciones Regionales y Municipales 2026 • Jornada: Domingo 4 de Octubre
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-[#002B49] text-white font-black text-base px-3 py-1 rounded-md mb-0.5">
                {activeMesa}
              </div>
              <p className="text-[11px] text-slate-600">
                Coordinador: <strong>{COORDINADOR_INFO.nombre}</strong>
              </p>
            </div>
          </div>

          {/* Instructions bar */}
          <div className="bg-slate-100 rounded-lg p-2.5 mb-4 text-[11px] text-slate-700 flex items-center justify-between border border-slate-200">
            <span>
              📲 <strong>Escaneo rápido:</strong> Apunta la cámara de tu smartphone a cualquier código QR para abrir el chat de WhatsApp con el mensaje oficial ya redactado.
            </span>
            <span className="font-bold">Capacitación: Dom 27 Set</span>
          </div>

          {/* Members Table with QR Codes */}
          <div className="space-y-3">
            {currentMesaMembers.map((member, idx) => {
              const waUrl = getWhatsAppUrl(member.celular, member.nombreCompleto);
              const isPresidente = member.cargo === 'Presidente';

              return (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border ${
                    isPresidente ? 'border-amber-400 bg-amber-50/40' : 'border-slate-300 bg-slate-50/30'
                  } print:border-slate-400`}
                >
                  {/* Left: Prelación, Cargo, Name, DNI, Phone */}
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded ${
                        isPresidente ? 'bg-amber-200 text-amber-950 font-black' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {member.cargo}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        member.estadoContacto === 'Confirmado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {member.estadoContacto}
                      </span>
                      {member.verificado === 'Sí' && (
                        <span className="text-xs font-bold text-emerald-700">✓ Verificado</span>
                      )}
                    </div>

                    <div className="text-sm font-black text-slate-900">
                      {member.nombreCompleto || <span className="text-slate-400 italic font-normal">[Nombre no registrado aún]</span>}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                      <span>DNI: <strong>{member.dni || '—'}</strong></span>
                      <span>Celular: <strong>{member.celular || '—'}</strong></span>
                      {member.observaciones && (
                        <span className="text-slate-500 italic truncate max-w-xs">Obs: {member.observaciones}</span>
                      )}
                    </div>
                  </div>

                  {/* Center: Attendance Checkboxes for Election Day */}
                  <div className="border-l border-r border-slate-300 px-4 text-center hidden sm:block print:block">
                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Asistencia Día D</p>
                    <div className="flex items-center gap-3 text-[11px]">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 border-2 border-slate-700 rounded-sm mb-0.5"></div>
                        <span className="text-[9px]">06:00 AM</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 border-2 border-slate-700 rounded-sm mb-0.5"></div>
                        <span className="text-[9px]">07:00 AM</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: QR Code for WhatsApp hands-free scanning */}
                  <div className="flex-shrink-0 pl-3 flex flex-col items-center">
                    {waUrl ? (
                      <div className="flex flex-col items-center">
                        <QRCodeDisplay
                          url={waUrl}
                          title={member.nombreCompleto || member.cargo}
                          size={70}
                          className="p-1 border border-slate-300 rounded-lg shadow-none"
                        />
                        <span className="text-[9px] text-slate-500 mt-0.5 font-mono">Escanear WhatsApp</span>
                      </div>
                    ) : (
                      <div className="w-16 h-16 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400 text-center p-1">
                        Sin cel
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer signature line */}
          <div className="mt-6 pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500">
            <div>
              <p>Mesa: <strong>{activeMesa}</strong> • Local de Votación ERM 2026</p>
              <p className="text-[10px]">Documento de uso interno del Coordinador de Mesa ONPE.</p>
            </div>
            <div className="text-center pt-6 border-t border-slate-400 w-48">
              <p className="font-bold text-slate-800">{COORDINADOR_INFO.nombre}</p>
              <p className="text-[10px]">Firma Coordinador de Mesa ONPE</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
