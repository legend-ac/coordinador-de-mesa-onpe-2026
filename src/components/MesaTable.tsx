import React, { useState, useMemo } from 'react';
import {
  MesaMember,
  ContactStatus,
  VerificadoTipo,
} from '../types';
import {
  Search,
  MessageCircle,
  Copy,
  Check,
  QrCode,
  Eye,
  Phone,
  FileSpreadsheet,
  Edit3,
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

interface MesaTableProps {
  members: MesaMember[];
  mesas: string[];
  selectedMesa: string | 'TODAS';
  onSelectMesa: (mesa: string | 'TODAS') => void;
  onUpdateMember: (id: string, updates: Partial<MesaMember>) => void;
  onPreviewWhatsApp: (nombre: string, celular: string) => void;
  onOpenEditMesa?: (mesa: string) => void;
  isReadOnly?: boolean;
}

export const MesaTable: React.FC<MesaTableProps> = ({
  members,
  mesas,
  selectedMesa,
  onSelectMesa,
  onUpdateMember,
  onPreviewWhatsApp,
  onOpenEditMesa,
  isReadOnly = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [verificadoFilter, setVerificadoFilter] = useState<string>('TODOS');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModalMember, setQrModalMember] = useState<MesaMember | null>(null);

  // Per-member locked state
  const [unlockedMemberIds, setUnlockedMemberIds] = useState<Record<string, boolean>>({});

  const toggleMemberLock = (id: string) => {
    setUnlockedMemberIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        // Mesa filter
        if (selectedMesa !== 'TODAS' && m.mesa !== selectedMesa) return false;

        // Status filter
        if (statusFilter !== 'TODOS' && m.estadoContacto !== statusFilter) return false;

        // Verificado filter
        if (verificadoFilter !== 'TODOS' && m.verificado !== verificadoFilter) return false;

        // Search text
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = m.nombreCompleto?.toLowerCase().includes(q);
          const matchDni = m.dni?.includes(q);
          const matchPhone = m.celular?.includes(q);
          const matchCargo = m.cargo?.toLowerCase().includes(q);
          const matchObs = m.observaciones?.toLowerCase().includes(q);
          if (!matchName && !matchDni && !matchPhone && !matchCargo && !matchObs) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a.orden - b.orden);
  }, [members, selectedMesa, statusFilter, verificadoFilter, searchTerm]);

  const handleCopyMessage = (id: string, nombre: string) => {
    const msg = buildWhatsAppMessage(nombre);
    navigator.clipboard.writeText(msg);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Strictly ONPE Colors: Navy #00223A, Red #D31027, White #FFFFFF, Black #0A111D
  const getStatusBadgeStyle = (status: ContactStatus) => {
    switch (status) {
      case 'Confirmado':
        return 'bg-[#00223A] text-white border-blue-400 font-bold';
      case 'Pendiente':
        return 'bg-[#001726] text-slate-300 border-[#213555]';
      case 'No responde':
        return 'bg-[#2A080C] text-red-300 border-red-800';
      case 'Número incorrecto':
        return 'bg-[#D31027]/20 text-red-400 border-red-600';
      default:
        return 'bg-[#0A111D] text-slate-300 border-[#1E293B]';
    }
  };

  // Strictly ONPE styling for roles (Navy, Red, White)
  const getCargoVisuals = (cargo: string, posInMesa: number) => {
    if (cargo === 'Presidente') {
      return {
        badge: 'bg-[#D31027] text-white border-red-400 font-black',
        rowHighlight: 'bg-[#00223A]/30',
        icon: '👑',
        label: 'PRESIDENTE',
        posBadge: 'bg-[#D31027] text-white font-black',
      };
    }
    if (cargo === 'Secretario') {
      return {
        badge: 'bg-[#00223A] text-white border-blue-400 font-bold',
        rowHighlight: 'bg-[#001726]/30',
        icon: '✍️',
        label: 'SECRETARIO',
        posBadge: 'bg-[#003358] text-white border border-blue-400 font-bold',
      };
    }
    if (cargo === 'Tercer miembro') {
      return {
        badge: 'bg-[#001726] text-white border-[#213555] font-bold',
        rowHighlight: 'bg-[#001221]/20',
        icon: '📋',
        label: 'TERCER MIEMBRO',
        posBadge: 'bg-[#00223A] text-white font-bold',
      };
    }
    return {
      badge: 'bg-[#0A111D] text-slate-300 border-[#1B2A40]',
      rowHighlight: posInMesa % 2 === 0 ? 'bg-[#070D18]' : 'bg-[#0A1220]',
      icon: '🔹',
      label: cargo,
      posBadge: 'bg-[#0D1829] text-slate-300 font-medium',
    };
  };

  return (
    <div className="bg-[#0A111D] text-white rounded-2xl shadow-xl border border-[#16253B] overflow-hidden">
      
      {/* Table Toolbar & Filters */}
      <div className="p-3.5 sm:p-4 border-b border-[#16253B] bg-[#070C15] space-y-3">
        
        {/* Mesa Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex p-1 bg-[#001726] border border-[#16253B] rounded-xl overflow-x-auto max-w-full">
            <button
              onClick={() => onSelectMesa('TODAS')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedMesa === 'TODAS'
                  ? 'bg-[#00223A] text-white border border-blue-400 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({members.length})
            </button>
            {mesas.map((m) => {
              const count = members.filter((x) => x.mesa === m).length;
              const isSelected = selectedMesa === m;
              return (
                <div key={m} className="inline-flex items-center">
                  <button
                    onClick={() => onSelectMesa(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#00223A] text-white border border-blue-400 shadow-xs font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m} ({count})
                  </button>
                  {onOpenEditMesa && isSelected && !isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onOpenEditMesa(m)}
                      className="ml-0.5 mr-1 p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                      title="Editar número o nombre de esta mesa"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {isReadOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D31027] text-white border border-red-400">
                <Lock className="w-3 h-3 text-white" />
                Seguro Global Activo
              </span>
            )}
            <div className="text-xs text-slate-400 font-medium">
              Mostrando <strong>{filteredMembers.length}</strong> de {members.length} miembros
            </div>
          </div>
        </div>

        {/* Search & Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, DNI, celular..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-[#0A111D] text-white border border-[#16253B] rounded-xl focus:outline-none focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter by Estado */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 whitespace-nowrap">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs sm:text-sm bg-[#0A111D] text-white border border-[#16253B] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Confirmado">Confirmado</option>
              <option value="No responde">No responde</option>
              <option value="Número incorrecto">Número incorrecto</option>
            </select>
          </div>

          {/* Filter by Verificado */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 whitespace-nowrap">Verificado:</span>
            <select
              value={verificadoFilter}
              onChange={(e) => setVerificadoFilter(e.target.value)}
              className="w-full text-xs sm:text-sm bg-[#0A111D] text-white border border-[#16253B] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="TODOS">Todos</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(searchTerm || statusFilter !== 'TODOS' || verificadoFilter !== 'TODOS') && (
            <div className="flex items-center">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('TODOS');
                  setVerificadoFilter('TODOS');
                }}
                className="text-xs text-white underline hover:text-red-400 font-semibold"
              >
                Limpiar filtros
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Main Table with Frozen Headers */}
      <div className="overflow-x-auto max-h-[640px] relative scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          {/* Frozen Header Row */}
          <thead className="sticky top-0 z-20 bg-[#00223A] text-white shadow-md select-none border-b border-[#0A111D]">
            <tr className="text-xs uppercase tracking-wider font-semibold">
              <th scope="col" className="py-3 px-2 w-16 text-center text-white">Candado</th>
              <th scope="col" className="py-3 px-2 w-12 text-center text-white">N°</th>
              <th scope="col" className="py-3 px-3 w-28 text-center text-white">1. Mesa</th>
              <th scope="col" className="py-3 px-3 w-44 text-white">2. Cargo / Condición</th>
              <th scope="col" className="py-3 px-3 w-72 text-white">3. Nombre Completo</th>
              <th scope="col" className="py-3 px-2 w-32 text-center text-white">4. DNI</th>
              <th scope="col" className="py-3 px-2 w-32 text-center text-white">5. Celular</th>
              <th scope="col" className="py-3 px-3 w-56 text-center text-white">6. Contactar por WhatsApp</th>
              <th scope="col" className="py-3 px-3 w-40 text-center text-white">7. Estado</th>
              <th scope="col" className="py-3 px-3 min-w-[160px] text-white">8. Observaciones</th>
              <th scope="col" className="py-3 px-2 w-24 text-center text-white">9. Verificado</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#16253B] text-xs sm:text-sm bg-[#080D18]">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-slate-500">
                  <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-40 text-white" />
                  No se encontraron miembros con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member, index) => {
                const cleanPhone = formatPeruPhone(member.celular);
                const hasValidPhone = cleanPhone && cleanPhone.length >= 9;
                const isCopied = copiedId === member.id;

                const posInMesa = ((member.orden - 1) % 9) + 1;
                const visuals = getCargoVisuals(member.cargo, posInMesa);

                // Auto-lock condition: Has filled data AND is not explicitly unlocked by user
                const hasFilledData = Boolean(member.nombreCompleto?.trim() || member.dni?.trim() || member.celular?.trim());
                const isItemLocked = isReadOnly || (hasFilledData && !unlockedMemberIds[member.id]);

                const isFirstOfMesa = index === 0 || filteredMembers[index - 1].mesa !== member.mesa;

                return (
                  <tr
                    key={member.id}
                    className={`transition-colors hover:bg-[#00223A]/40 ${
                      isFirstOfMesa && index !== 0 ? 'border-t-2 border-red-600/50' : ''
                    } ${visuals.rowHighlight}`}
                  >
                    {/* CANDADO / BLOQUEADOR DE EDICIÓN EN LA PRIMERA COLUMNA */}
                    <td className="py-2 px-2 text-center align-middle whitespace-nowrap">
                      {hasFilledData ? (
                        <button
                          type="button"
                          onClick={() => toggleMemberLock(member.id)}
                          className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold shadow-2xs transition-all cursor-pointer ${
                            isItemLocked
                              ? 'bg-[#00223A] text-white border-blue-400 hover:bg-[#003358]'
                              : 'bg-[#D31027] text-white border-red-400 hover:bg-[#B70E22]'
                          }`}
                          title={isItemLocked ? 'Cargo bloqueado contra cambios. Clic para editar.' : 'Desbloqueado para editar. Clic para volver a bloquear.'}
                        >
                          {isItemLocked ? <Lock className="w-3.5 h-3.5 text-blue-300" /> : <Unlock className="w-3.5 h-3.5 text-white" />}
                          <span className="hidden md:inline">{isItemLocked ? 'Bloqueado' : 'Editar'}</span>
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[11px]" title="Vacío (Listo para llenar)">
                          Libre
                        </span>
                      )}
                    </td>

                    {/* Index / Position in Mesa (1 to 9) */}
                    <td className="py-2.5 px-2 text-center align-middle whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono ${visuals.posBadge}`}>
                        {posInMesa}
                      </span>
                    </td>

                    {/* 1. Mesa */}
                    <td className="py-2.5 px-3 text-center align-middle whitespace-nowrap">
                      <span className="inline-block font-extrabold text-[11px] px-2 py-0.5 rounded border bg-[#001726] text-white border-[#213555]">
                        {member.mesa}
                      </span>
                    </td>

                    {/* 2. Cargo / Condición */}
                    <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${visuals.badge}`}>
                          <span>{visuals.icon}</span>
                          <span>{visuals.label}</span>
                        </span>
                      </div>
                    </td>

                    {/* 3. Nombre Completo */}
                    <td className="py-2 px-3 align-middle">
                      {isItemLocked ? (
                        <div className="font-semibold text-white px-2.5 py-1.5 text-xs sm:text-sm bg-[#050912] rounded-lg border border-[#16253B] flex items-center justify-between">
                          <span className="truncate">{member.nombreCompleto || <span className="text-slate-500 italic">Sin nombre registrado</span>}</span>
                          {hasFilledData && (
                            <span title="Dato protegido contra modificaciones accidentales" className="ml-1 text-slate-400 flex items-center gap-0.5 text-[10px] font-bold">
                              <Lock className="w-3 h-3 text-white" />
                            </span>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={member.nombreCompleto || ''}
                          onChange={(e) => onUpdateMember(member.id, { nombreCompleto: e.target.value })}
                          placeholder="Ingresar nombres y apellidos..."
                          className="w-full bg-[#050912] text-white text-xs sm:text-sm font-semibold border border-[#16253B] focus:border-red-500 rounded-lg px-2.5 py-1.5 transition-all focus:outline-none"
                        />
                      )}
                    </td>

                    {/* 4. DNI (8 dígitos) */}
                    <td className="py-2 px-2 align-middle text-center">
                      {isItemLocked ? (
                        <span className="font-mono font-bold text-white text-xs sm:text-sm block py-1.5 bg-[#050912] rounded-lg border border-[#16253B]">
                          {member.dni || '—'}
                        </span>
                      ) : (
                        <input
                          type="text"
                          maxLength={8}
                          value={member.dni || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            onUpdateMember(member.id, { dni: val });
                          }}
                          placeholder="8 dígitos"
                          className="w-24 text-center font-mono font-bold bg-[#050912] text-white text-xs sm:text-sm border border-[#16253B] focus:border-red-500 rounded-lg px-2 py-1.5 transition-all focus:outline-none"
                        />
                      )}
                    </td>

                    {/* 5. Celular (9 dígitos) */}
                    <td className="py-2 px-2 align-middle text-center">
                      {isItemLocked ? (
                        <span className="font-mono font-bold text-white text-xs sm:text-sm block py-1.5 bg-[#050912] rounded-lg border border-[#16253B]">
                          {member.celular || '—'}
                        </span>
                      ) : (
                        <input
                          type="text"
                          maxLength={12}
                          value={member.celular || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d+]/g, '');
                            onUpdateMember(member.id, { celular: val });
                          }}
                          placeholder="9 dígitos..."
                          className="w-28 text-center font-mono font-bold bg-[#050912] text-white text-xs sm:text-sm border border-[#16253B] focus:border-red-500 rounded-lg px-2 py-1.5 transition-all focus:outline-none"
                        />
                      )}
                    </td>

                    {/* 6. Contactar por WhatsApp Business */}
                    <td className="py-2.5 px-3 align-middle text-center whitespace-nowrap">
                      {hasValidPhone ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => launchWhatsAppBusiness(member.celular, member.nombreCompleto)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#D31027] hover:bg-[#B70E22] text-white border border-red-400 rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer"
                            title={`Abrir directamente en WhatsApp Business con ${member.nombreCompleto || 'este miembro'}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-white" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setQrModalMember(member)}
                            className="p-1.5 text-white hover:bg-[#00223A] rounded-lg transition-colors border border-[#16253B] cursor-pointer"
                            title="Ver código QR para escanear"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyMessage(member.id, member.nombreCompleto)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#00223A] rounded transition-colors cursor-pointer"
                            title="Copiar texto del mensaje"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => onPreviewWhatsApp(member.nombreCompleto, member.celular)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#00223A] rounded transition-colors cursor-pointer"
                            title="Previsualizar mensaje completo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 bg-[#050912] rounded text-xs cursor-not-allowed border border-[#16253B]"
                          title="Ingresa un número celular para habilitar WhatsApp"
                        >
                          <Phone className="w-3 h-3 text-slate-600" />
                          <span>Sin celular</span>
                        </button>
                      )}
                    </td>

                    {/* 7. Estado de Contacto */}
                    <td className="py-2 px-3 align-middle text-center whitespace-nowrap">
                      {isItemLocked ? (
                        <span className={`text-xs font-bold rounded-lg px-2.5 py-1 border inline-block ${getStatusBadgeStyle(member.estadoContacto)}`}>
                          {member.estadoContacto}
                        </span>
                      ) : (
                        <select
                          value={member.estadoContacto}
                          onChange={(e) =>
                            onUpdateMember(member.id, { estadoContacto: e.target.value as ContactStatus })
                          }
                          className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border transition-all cursor-pointer focus:outline-none ${getStatusBadgeStyle(
                            member.estadoContacto
                          )}`}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Confirmado">Confirmado</option>
                          <option value="No responde">No responde</option>
                          <option value="Número incorrecto">Número incorrecto</option>
                        </select>
                      )}
                    </td>

                    {/* 8. Observaciones */}
                    <td className="py-2 px-3 align-middle">
                      {isItemLocked ? (
                        <span className="text-slate-300 text-xs px-2 py-1 block">
                          {member.observaciones || '—'}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={member.observaciones || ''}
                          onChange={(e) => onUpdateMember(member.id, { observaciones: e.target.value })}
                          placeholder="Añadir notas..."
                          className="w-full bg-[#050912] text-slate-200 text-xs border border-[#16253B] focus:border-red-500 rounded-lg px-2.5 py-1.5 transition-all focus:outline-none"
                        />
                      )}
                    </td>

                    {/* 9. Verificado (Sí / No) */}
                    <td className="py-2 px-2 align-middle text-center whitespace-nowrap">
                      {isItemLocked ? (
                        <span className={`text-xs font-black rounded-lg px-2 py-1 border inline-block ${
                          member.verificado === 'Sí'
                            ? 'bg-[#00223A] text-white border-blue-400'
                            : 'bg-[#050912] text-slate-500 border-[#16253B]'
                        }`}>
                          {member.verificado === 'Sí' ? '✓ Sí' : '✗ No'}
                        </span>
                      ) : (
                        <select
                          value={member.verificado}
                          onChange={(e) =>
                            onUpdateMember(member.id, { verificado: e.target.value as VerificadoTipo })
                          }
                          className={`text-xs font-black rounded-lg px-2 py-1.5 border transition-all cursor-pointer focus:outline-none ${
                            member.verificado === 'Sí'
                              ? 'bg-[#00223A] text-white border-blue-400'
                              : 'bg-[#050912] text-slate-400 border-[#16253B]'
                          }`}
                        >
                          <option value="Sí">✓ Sí</option>
                          <option value="No">✗ No</option>
                        </select>
                      )}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary Bar */}
      <div className="bg-[#001726] px-4 py-3 border-t border-[#16253B] text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
            Confirmado: <strong>{filteredMembers.filter((m) => m.estadoContacto === 'Confirmado').length}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            Pendiente: <strong>{filteredMembers.filter((m) => m.estadoContacto === 'Pendiente').length}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D31027]"></span>
            No responde: <strong>{filteredMembers.filter((m) => m.estadoContacto === 'No responde' || m.estadoContacto === 'Número incorrecto').length}</strong>
          </span>
        </div>
        <div className="text-slate-400 text-[11px] flex items-center gap-1">
          <Lock className="w-3 h-3 text-red-500" />
          <span>Paleta institucional ONPE: Blanco, Rojo (#D31027), Negro (#050912) y Azul Noche (#00223A).</span>
        </div>
      </div>

      {/* Pop-up modal for single QR Code on table view */}
      {qrModalMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0A111D] text-white rounded-2xl max-w-sm w-full p-5 border border-[#16253B] shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 uppercase">
                Código QR de WhatsApp
              </span>
              <button
                onClick={() => setQrModalMember(null)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <QRCodeDisplay
              url={getWhatsAppUrl(qrModalMember.celular, qrModalMember.nombreCompleto) || ''}
              title={qrModalMember.nombreCompleto || qrModalMember.cargo}
              subtitle={`${qrModalMember.mesa} • ${qrModalMember.celular}`}
              size={180}
            />

            <p className="text-[11px] text-slate-400 text-center">
              Escanea este QR con cualquier teléfono para abrir el chat de WhatsApp con el mensaje ya listo.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
