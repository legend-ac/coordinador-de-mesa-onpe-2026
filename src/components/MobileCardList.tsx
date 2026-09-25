import React from 'react';
import { CheckCircle2, MessageCircle, Phone } from 'lucide-react';
import { ContactStatus, MesaMember } from '../types';
import { formatPeruPhone, launchWhatsAppBusiness } from '../utils/whatsapp';

interface MobileCardListProps {
  members: MesaMember[];
  onUpdateMember: (id: string, updates: Partial<MesaMember>) => void;
  isReadOnly?: boolean;
}

const statuses: ContactStatus[] = ['Pendiente', 'Confirmado', 'No responde', 'Número incorrecto'];

/** Edición directa en teléfono: una tarjeta es un cargo y no hay candados ocultos. */
export const MobileCardList: React.FC<MobileCardListProps> = ({ members, onUpdateMember, isReadOnly = false }) => {
  if (members.length === 0) {
    return <p className="rounded-xl border border-black/20 bg-white p-6 text-center text-sm text-black/60">No hay registros para este filtro.</p>;
  }

  return (
    <div className="space-y-3 pb-6 sm:hidden">
      {members.map((member) => {
        const canMessage = formatPeruPhone(member.celular).length >= 9;
        return (
          <article key={member.id} className="overflow-hidden rounded-xl border border-black/15 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-black/10 bg-[#00223A] px-3 py-2.5 text-white">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">{member.mesa}</p>
                <h2 className="truncate text-sm font-black">{member.cargo}</h2>
              </div>
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => onUpdateMember(member.id, { verificado: member.verificado === 'Sí' ? 'No' : 'Sí' })}
                className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-black ${member.verificado === 'Sí' ? 'border-white bg-[#D31027] text-white' : 'border-white/40 bg-black/20 text-white'} disabled:opacity-70`}
              >
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />{member.verificado === 'Sí' ? 'VERIFICADO' : 'VERIFICAR'}
              </button>
            </div>

            <fieldset disabled={isReadOnly} className="space-y-3 p-3">
              <label className="field-label">Nombre completo
                <input value={member.nombreCompleto || ''} onChange={(e) => onUpdateMember(member.id, { nombreCompleto: e.target.value })} placeholder="Nombres y apellidos" className="field-input" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="field-label">DNI
                  <input inputMode="numeric" maxLength={8} value={member.dni || ''} onChange={(e) => onUpdateMember(member.id, { dni: e.target.value.replace(/\D/g, '') })} placeholder="00000000" className="field-input font-mono" />
                </label>
                <label className="field-label">Celular
                  <input inputMode="tel" maxLength={12} value={member.celular || ''} onChange={(e) => onUpdateMember(member.id, { celular: e.target.value.replace(/[^\d+]/g, '') })} placeholder="999 999 999" className="field-input font-mono" />
                </label>
              </div>
              <label className="field-label">Estado de contacto
                <select value={member.estadoContacto} onChange={(e) => onUpdateMember(member.id, { estadoContacto: e.target.value as ContactStatus })} className="field-input">
                  {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label className="field-label">Observaciones
                <input value={member.observaciones || ''} onChange={(e) => onUpdateMember(member.id, { observaciones: e.target.value })} placeholder="Opcional" className="field-input" />
              </label>
            </fieldset>

            <div className="border-t border-black/10 p-3">
              {canMessage ? (
                <button type="button" onClick={() => launchWhatsAppBusiness(member.celular, member.nombreCompleto)} className="action-primary w-full"><MessageCircle className="h-4 w-4" /> Enviar WhatsApp</button>
              ) : (
                <p className="flex items-center justify-center gap-1 text-xs font-medium text-black/50"><Phone className="h-3.5 w-3.5" /> Ingresa un celular para contactar</p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};
