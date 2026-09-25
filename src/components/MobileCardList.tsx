import React, { useState } from 'react';
import {
  MesaMember,
  ContactStatus,
} from '../types';
import {
  MessageCircle,
  Copy,
  Check,
  QrCode,
  Phone,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  buildWhatsAppMessage,
  formatPeruPhone,
  launchWhatsAppBusiness,
  getWhatsAppUrl,
} from '../utils/whatsapp';
import { QRCodeDisplay } from './QRCodeDisplay';

interface MobileCardListProps {
  members: MesaMember[];
  onUpdateMember: (id: string, updates: Partial<MesaMember>) => void;
  isReadOnly?: boolean;
}

export const MobileCardList: React.FC<MobileCardListProps> = ({
  members,
  onUpdateMember,
  isReadOnly = false,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrMember, setQrMember] = useState<MesaMember | null>(null);
  const [unlockedMemberIds, setUnlockedMemberIds] = useState<Record<string, boolean>>({});

  const toggleMemberLock = (id: string) => {
    setUnlockedMemberIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (id: string, nombre: string) => {
    const msg = buildWhatsAppMessage(nombre);
    navigator.clipboard.writeText(msg);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMesaBadge = () => {
    return 'bg-[#001726] text-white border-[#213555]';
  };

  const getCargoBadge = (cargo: string) => {
    if (cargo === 'Presidente') {
      return {
        badge: 'text-white bg-[#D31027] border-red-400 font-black',
        icon: '👑',
        label: 'PRESIDENTE',
      };
    }
    if (cargo === 'Secretario') {
      return {
        badge: 'text-white bg-[#00223A] border-blue-400 font-bold',
        icon: '✍️',
        label: 'SECRETARIO',
      };
    }
    if (cargo === 'Tercer miembro') {
      return {
        badge: 'text-white bg-[#001726] border-[#213555] font-bold',
        icon: '📋',
        label: 'TERCER MIEMBRO',
      };
    }
    return {
      badge: 'text-slate-300 bg-[#0A111D] border-[#16253B]',
      icon: '🔹',
      label: cargo,
    };
  };

  const statusList: { value: ContactStatus; label: string; activeClass: string }[] = [
    {
      value: 'Pendiente',
      label: 'Pendiente',
      activeClass: 'bg-[#001726] text-white border-slate-500 font-bold',
    },
    {
      value: 'Confirmado',
      label: 'Confirmado',
      activeClass: 'bg-[#00223A] text-white border-blue-400 font-bold',
    },
    {
      value: 'No responde',
      label: 'No responde',
      activeClass: 'bg-[#2A080C] text-red-300 border-red-700 font-bold',
    },
    {
      value: 'Número incorrecto',
      label: 'Incorrecto',
      activeClass: 'bg-[#D31027] text-white border-red-500 font-bold',
    },
  ];

  if (members.length === 0) {
    return (
      <div className="bg-[#0A111D] text-white rounded-xl p-8 text-center border border-[#16253B] shadow-xs sm:hidden">
        <p className="text-slate-400 text-xs font-medium">No hay miembros para mostrar en este filtro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:hidden pb-16 text-white">
      {members.map((member) => {
        const cleanPhone = formatPeruPhone(member.celular);
        const hasValidPhone = Boolean(cleanPhone && cleanPhone.length >= 9);
        const isCopied = copiedId === member.id;
        const posInMesa = ((member.orden - 1) % 9) + 1;
        const cargoBadge = getCargoBadge(member.cargo);

        const hasFilledData = Boolean(member.nombreCompleto?.trim() || member.dni?.trim() || member.celular?.trim());
        const isItemLocked = isReadOnly || (hasFilledData && !unlockedMemberIds[member.id]);

        return (
          <div
            key={member.id}
            className={`bg-[#0A111D] rounded-xl p-3.5 border transition-all shadow-md ${
              member.verificado === 'Sí'
                ? 'border-blue-500 bg-[#001D33]/25'
                : 'border-[#16253B]'
            }`}
          >
            {/* Row 1: Position, Cargo, Mesa, Candado & Verificado */}
            <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-[#16253B] flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${getMesaBadge()}`}>
                  {member.mesa}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${cargoBadge.badge}`}>
                  <span className="mr-1">{cargoBadge.icon}</span>
                  <span>{cargoBadge.label}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Individual per-cargo lock toggle */}
                {hasFilledData && (
                  <button
                    type="button"
                    onClick={() => toggleMemberLock(member.id)}
                    className={`p-1 rounded-md border text-xs font-bold cursor-pointer ${
                      isItemLocked
                        ? 'bg-[#00223A] text-white border-blue-400'
                        : 'bg-[#D31027] text-white border-red-400'
                    }`}
                    title={isItemLocked ? 'Cargo con datos protegido. Clic para editar.' : 'Desbloqueado para editar.'}
                  >
                    {isItemLocked ? <Lock className="w-3.5 h-3.5 text-blue-300" /> : <Unlock className="w-3.5 h-3.5 text-white" />}
                  </button>
                )}

                {/* 1-Tap Verified Toggle */}
                {isReadOnly ? (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      member.verificado === 'Sí'
                        ? 'bg-[#00223A] text-white border-blue-400'
                        : 'bg-[#050912] text-slate-500 border-[#16253B]'
                    }`}
                  >
                    {member.verificado === 'Sí' ? '✓ Verificado' : 'No verificado'}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateMember(member.id, { verificado: member.verificado === 'Sí' ? 'No' : 'Sí' })
                    }
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                      member.verificado === 'Sí'
                        ? 'bg-[#00223A] text-white border-blue-400'
                        : 'bg-[#050912] text-slate-400 border-[#16253B]'
                    }`}
                  >
                    {member.verificado === 'Sí' ? '✓ Verificado' : 'No verificado'}
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: Nombre Completo */}
            <div className="mt-2.5">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Nombre completo:</span>
                {isItemLocked && hasFilledData && (
                  <span className="text-white font-bold text-[10px] flex items-center gap-0.5">
                    <Lock className="w-3 h-3 text-red-500" /> Bloqueado contra cambios
                  </span>
                )}
              </label>
              {isItemLocked ? (
                <div className="text-xs sm:text-sm font-semibold text-white bg-[#050912] p-2 rounded-lg border border-[#16253B]">
                  {member.nombreCompleto || <span className="text-slate-500 italic">Sin nombre registrado</span>}
                </div>
              ) : (
                <input
                  type="text"
                  value={member.nombreCompleto || ''}
                  onChange={(e) => onUpdateMember(member.id, { nombreCompleto: e.target.value })}
                  placeholder="Ingresar nombres y apellidos..."
                  className="w-full text-xs sm:text-sm font-semibold text-white bg-[#050912] border border-[#16253B] rounded-lg px-2.5 py-1.5 focus:border-red-500 focus:outline-none"
                />
              )}
            </div>

            {/* Row 3: DNI & Celular */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  DNI (8 dígitos):
                </label>
                {isItemLocked ? (
                  <div className="font-mono text-center text-xs font-bold text-white bg-[#050912] p-1.5 rounded-lg border border-[#16253B]">
                    {member.dni || '—'}
                  </div>
                ) : (
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={member.dni || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      onUpdateMember(member.id, { dni: val });
                    }}
                    placeholder="8 dígitos"
                    className="w-full font-mono text-center text-xs font-bold text-white bg-[#050912] border border-[#16253B] rounded-lg px-2 py-1.5 focus:border-red-500 focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Celular:
                </label>
                {isItemLocked ? (
                  <div className="font-mono text-center text-xs font-bold text-white bg-[#050912] p-1.5 rounded-lg border border-[#16253B]">
                    {member.celular || '—'}
                  </div>
                ) : (
                  <input
                    type="tel"
                    inputMode="tel"
                    maxLength={12}
                    value={member.celular || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d+]/g, '');
                      onUpdateMember(member.id, { celular: val });
                    }}
                    placeholder="9 dígitos..."
                    className="w-full font-mono text-center text-xs font-bold text-white bg-[#050912] border border-[#16253B] rounded-lg px-2 py-1.5 focus:border-red-500 focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Row 4: WhatsApp Business Button & QR Code Button */}
            <div className="mt-2.5">
              {hasValidPhone ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => launchWhatsAppBusiness(member.celular, member.nombreCompleto)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#D31027] hover:bg-[#B70E22] text-white border border-red-400 rounded-lg text-xs font-black shadow-xs cursor-pointer"
                    title="Abrir mensaje directamente en WhatsApp Business"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-white" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrMember(member)}
                    className="p-2 bg-[#001726] text-white border border-[#213555] rounded-lg text-xs font-bold cursor-pointer"
                    title="Ver código QR para escanear"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(member.id, member.nombreCompleto)}
                    className="p-2 bg-[#050912] text-slate-400 border border-[#16253B] rounded-lg text-xs cursor-pointer hover:text-white"
                    title="Copiar mensaje"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              ) : (
                <div className="w-full py-1.5 text-center text-[11px] text-slate-500 bg-[#050912] border border-[#16253B] rounded-lg flex items-center justify-center gap-1">
                  <Phone className="w-3 h-3 opacity-40 text-slate-600" />
                  <span>Ingresa celular para habilitar WhatsApp</span>
                </div>
              )}
            </div>

            {/* Row 5: Segmented Estado Buttons */}
            <div className="mt-2.5 pt-2 border-t border-[#16253B]">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                Estado de contacto:
              </label>
              {isItemLocked ? (
                <div className="text-xs font-bold text-white p-1.5 bg-[#050912] rounded-lg border border-[#16253B]">
                  Estado actual: <strong>{member.estadoContacto}</strong>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {statusList.map((st) => {
                    const isSelected = member.estadoContacto === st.value;
                    return (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => onUpdateMember(member.id, { estadoContacto: st.value })}
                        className={`text-[11px] py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                          isSelected
                            ? st.activeClass
                            : 'bg-[#050912] text-slate-400 border-[#16253B]'
                        }`}
                      >
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Row 6: Observaciones */}
            <div className="mt-2">
              {isItemLocked ? (
                <div className="text-xs text-slate-400 p-1.5 bg-[#050912] rounded-lg border border-[#16253B]">
                  {member.observaciones || <span className="italic text-slate-500">Sin observaciones</span>}
                </div>
              ) : (
                <input
                  type="text"
                  value={member.observaciones || ''}
                  onChange={(e) => onUpdateMember(member.id, { observaciones: e.target.value })}
                  placeholder="Observaciones..."
                  className="w-full text-xs text-slate-200 bg-[#050912] border border-[#16253B] rounded-lg px-2.5 py-1 focus:border-red-500 focus:outline-none"
                />
              )}
            </div>
          </div>
        );
      })}

      {/* QR Code Quick Modal for Single Member */}
      {qrMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0A111D] text-white rounded-2xl max-w-xs w-full p-4 border border-[#16253B] shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white uppercase">
                QR WhatsApp de {qrMember.cargo}
              </span>
              <button
                onClick={() => setQrMember(null)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <QRCodeDisplay
              url={getWhatsAppUrl(qrMember.celular, qrMember.nombreCompleto) || ''}
              title={qrMember.nombreCompleto || qrMember.cargo}
              subtitle={`${qrMember.mesa} • ${qrMember.celular}`}
              size={180}
            />

            <p className="text-[11px] text-slate-400 text-center">
              Escanea este QR con otro celular para abrir WhatsApp directamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
