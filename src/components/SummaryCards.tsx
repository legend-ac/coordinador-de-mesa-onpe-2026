import React from 'react';
import { MesaMember } from '../types';
import { Phone, CheckCircle, ShieldCheck } from 'lucide-react';

interface SummaryCardsProps {
  members: MesaMember[];
  mesas: string[];
  selectedMesa: string | 'TODAS';
  onSelectMesa: (mesa: string | 'TODAS') => void;
  onEditMesa?: (mesa: string) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  members,
  mesas,
  selectedMesa,
  onSelectMesa,
}) => {
  const getMetrics = (mesaMembers: MesaMember[]) => {
    const total = mesaMembers.length;
    const withPhone = mesaMembers.filter((m) => Boolean(m.celular && m.celular.trim())).length;
    const confirmed = mesaMembers.filter((m) => m.estadoContacto === 'Confirmado').length;
    const verified = mesaMembers.filter((m) => m.verificado === 'Sí').length;
    return { total, withPhone, confirmed, verified };
  };

  const totalMetrics = getMetrics(members);

  // Active metrics for the compact mobile strip
  const activeMetrics =
    selectedMesa === 'TODAS'
      ? totalMetrics
      : getMetrics(members.filter((m) => m.mesa === selectedMesa));

  return (
    <>
      {/* 1. MOBILE COMPACT METRICS STRIP (Pure ONPE: Red, White, Navy, Black) */}
      <div className="sm:hidden bg-white rounded-xl p-3 border border-[#00223A]/25 shadow-sm mb-3 text-[#00223A]">
        <div className="grid grid-cols-3 gap-2 text-center divide-x divide-[#00223A]/15">
          {/* Con Celular */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[#00223A] font-bold flex items-center gap-1 uppercase tracking-tight">
              <Phone className="w-3 h-3 text-[#00223A]" />
              Con Celular
            </span>
            <span className="text-sm font-black text-[#00223A] mt-0.5">
              {activeMetrics.withPhone} <span className="text-[10px] text-black/50 font-normal">/ {activeMetrics.total}</span>
            </span>
          </div>

          {/* Confirmados */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[#D31027] font-bold flex items-center gap-1 uppercase tracking-tight">
              <CheckCircle className="w-3 h-3 text-[#D31027]" />
              Confirmados
            </span>
            <span className="text-sm font-black text-[#D31027] mt-0.5">
              {activeMetrics.confirmed} <span className="text-[10px] text-black/50 font-normal">/ {activeMetrics.total}</span>
            </span>
          </div>

          {/* Verificados */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[#00223A] font-bold flex items-center gap-1 uppercase tracking-tight">
              <ShieldCheck className="w-3 h-3 text-[#00223A]" />
              Verificados
            </span>
            <span className="text-sm font-black text-[#00223A] mt-0.5">
              {activeMetrics.verified} <span className="text-[10px] text-black/50 font-normal">/ {activeMetrics.total}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. DESKTOP METRICS CARDS (Pure ONPE: Azul Marino, Blanco, Rojo, Negro) */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {mesas.map((mesa) => {
          const mesaMembers = members.filter((m) => m.mesa === mesa);
          const stats = getMetrics(mesaMembers);
          const isSelected = selectedMesa === mesa;

          return (
            <div
              key={mesa}
              onClick={() => onSelectMesa(isSelected ? 'TODAS' : mesa)}
              className={`rounded-xl p-3.5 border transition-all cursor-pointer shadow-xs ${
                isSelected
                  ? 'bg-[#00223A] border-red-500 ring-2 ring-red-500/50 text-white'
                  : 'bg-white border-[#00223A]/25 hover:border-[#00223A] text-[#00223A]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-[#f5f1ea] border border-[#00223A]/20 text-[#00223A] truncate max-w-[130px]">
                  {mesa}
                </span>
                <span className="text-xs font-bold text-red-400">
                  {stats.confirmed}/{mesaMembers.length || 9} Conf.
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-black/60">
                  <span>Con Celular:</span>
                  <span className="font-bold text-[#00223A]">{stats.withPhone} / {mesaMembers.length || 9}</span>
                </div>
                <div className="flex justify-between text-black/60">
                  <span>Confirmados:</span>
                  <span className="font-bold text-[#00223A]">{stats.confirmed} / {mesaMembers.length || 9}</span>
                </div>
                <div className="flex justify-between text-black/60">
                  <span>Verificados:</span>
                  <span className="font-bold text-[#00223A]">{stats.verified} / {mesaMembers.length || 9}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Global summary card */}
        <div
          onClick={() => onSelectMesa('TODAS')}
          className={`rounded-xl p-3.5 border transition-all cursor-pointer shadow-xs ${
            selectedMesa === 'TODAS'
              ? 'bg-[#00223A] border-red-500 ring-2 ring-red-500/50 text-white'
              : 'bg-white border-[#00223A]/25 text-[#00223A] hover:border-[#00223A]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-[#D31027]">
              Total ({mesas.length} Mesas)
            </span>
            <span className="text-xs font-bold text-[#00223A]">
              {totalMetrics.confirmed}/{totalMetrics.total} Conf.
            </span>
          </div>

          <div className="space-y-1 text-xs text-black/60">
            <div className="flex justify-between">
              <span>Total con celular:</span>
              <span className="font-bold text-[#00223A]">{totalMetrics.withPhone} / {totalMetrics.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Total confirmados:</span>
              <span className="font-bold text-[#D31027]">{totalMetrics.confirmed} / {totalMetrics.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Total verificados:</span>
              <span className="font-bold text-[#00223A]">{totalMetrics.verified} / {totalMetrics.total}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
