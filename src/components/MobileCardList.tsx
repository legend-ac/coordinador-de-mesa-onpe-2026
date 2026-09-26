import React from 'react';
import { CheckCircle2, MessageCircle, Phone } from 'lucide-react';
import { ContactStatus, MesaMember } from '../types';
import { useCoordinator } from '../context/CoordinatorContext';
import { formatPeruPhone, launchWhatsAppBusiness } from '../utils/whatsapp';

interface MobileCardListProps {
  members: MesaMember[];
  onUpdateMember: (id: string, updates: Partial<MesaMember>) => void;
  isReadOnly?: boolean;
}

const statuses: ContactStatus[] = ['Pendiente', 'Confirmado', 'No responde', 'Número incorrecto'];

/** Formulario de una sola columna para que cada dato se reconozca claramente en móvil. */
export const MobileCardList: React.FC<MobileCardListProps> = ({ members, onUpdateMember, isReadOnly = false }) => {
  const { perfil } = useCoordinator();
  const coordinatorInfo = { nombre: perfil.nombreCompleto, dni: perfil.dni, celular: perfil.celular || '', oficina: perfil.oficina };

  if (members.length === 0) {
    return <p className="rounded-xl border border-[#00223A]/20 bg-white p-6 text-center text-sm text-black/60">No hay registros para este filtro.</p>;
  }

  return (
    <div className="space-y-4 pb-6 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 xl:grid-cols-3">
      {members.map((member, index) => {
        const canMessage = formatPeruPhone(member.celular).length >= 9;
        const isVerified = member.verificado === 'Sí';
        return (
          <article key={member.id} className="overflow-hidden rounded-xl border border-[#00223A]/25 bg-white shadow-sm">
            <header className="flex items-center justify-between gap-3 bg-[#00223A] px-4 py-3 text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">{member.mesa} · Registro {index + 1}</p>
                <h2 className="mt-0.5 text-base font-black leading-tight">{member.cargo}</h2>
              </div>
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => onUpdateMember(member.id, { verificado: isVerified ? 'No' : 'Sí' })}
                className={`shrink-0 rounded-lg border px-3 py-2 text-[11px] font-black ${isVerified ? 'border-white bg-[#D31027] text-white' : 'border-white/50 bg-white text-[#00223A]'} disabled:opacity-60`}
              >
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />{isVerified ? 'VERIFICADO' : 'MARCAR'}
              </button>
            </header>

            <fieldset disabled={isReadOnly} className="space-y-4 p-4">
              <section aria-label="Datos personales" className="rounded-lg border border-[#00223A]/15 bg-[#f5f1ea] p-3">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#00223A]">1. Datos del miembro</p>
                <div className="space-y-3">
                  <label className="field-label">Nombre completo
                    <input value={member.nombreCompleto || ''} onChange={(event) => onUpdateMember(member.id, { nombreCompleto: event.target.value })} placeholder="Nombres y apellidos" className="field-input" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="field-label">DNI
                      <input inputMode="numeric" maxLength={8} value={member.dni || ''} onChange={(event) => onUpdateMember(member.id, { dni: event.target.value.replace(/\D/g, '') })} placeholder="00000000" className="field-input font-mono" />
                    </label>
                    <label className="field-label">Celular
                      <input inputMode="tel" maxLength={12} value={member.celular || ''} onChange={(event) => onUpdateMember(member.id, { celular: event.target.value.replace(/[^\d+]/g, '') })} placeholder="999 999 999" className="field-input font-mono" />
                    </label>
                  </div>
                </div>
              </section>

              <section aria-label="Seguimiento" className="rounded-lg border border-[#D31027]/25 bg-white p-3">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#D31027]">2. Seguimiento</p>
                <div className="space-y-3">
                  <label className="field-label">Estado de contacto
                    <select value={member.estadoContacto} onChange={(event) => onUpdateMember(member.id, { estadoContacto: event.target.value as ContactStatus })} className="field-input">
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                  <label className="field-label">Observaciones
                    <input value={member.observaciones || ''} onChange={(event) => onUpdateMember(member.id, { observaciones: event.target.value })} placeholder="Ej.: confirmó asistencia" className="field-input" />
                  </label>
                </div>
              </section>
            </fieldset>

            <footer className="border-t border-[#00223A]/15 bg-[#f5f1ea] p-3">
              {canMessage ? (
                <button type="button" onClick={() => launchWhatsAppBusiness(member.celular, member.nombreCompleto, coordinatorInfo)} className="action-primary w-full"><MessageCircle className="h-4 w-4" /> Enviar WhatsApp</button>
              ) : (
                <p className="flex items-center justify-center gap-1 text-xs font-medium text-black/55"><Phone className="h-3.5 w-3.5" /> Ingresa un celular para contactar</p>
              )}
            </footer>
          </article>
        );
      })}
    </div>
  );
};
