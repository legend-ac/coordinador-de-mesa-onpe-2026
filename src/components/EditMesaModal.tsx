import React, { useState, useEffect } from 'react';
import { Edit3, Check, X, ShieldAlert } from 'lucide-react';

interface EditMesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMesa: string;
  onSaveMesaName: (oldMesa: string, newMesa: string) => Promise<void>;
  existingMesas: string[];
}

export const EditMesaModal: React.FC<EditMesaModalProps> = ({
  isOpen,
  onClose,
  currentMesa,
  onSaveMesaName,
  existingMesas,
}) => {
  const [newMesaName, setNewMesaName] = useState(currentMesa);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNewMesaName(currentMesa);
    setError(null);
  }, [currentMesa, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMesaName.trim();
    if (!trimmed) {
      setError('El número o nombre de mesa no puede estar vacío.');
      return;
    }

    if (trimmed.toLowerCase() === currentMesa.toLowerCase()) {
      onClose();
      return;
    }

    if (existingMesas.some((m) => m.toLowerCase() === trimmed.toLowerCase() && m !== currentMesa)) {
      setError(`Ya existe otra mesa con el nombre "${trimmed}".`);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSaveMesaName(currentMesa, trimmed);
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsSaving(false);
      setError('Error al actualizar el número de mesa en la base de datos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0A111D] text-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#16253B] space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#16253B]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#00223A] border border-blue-400 text-white flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Editar Número de Mesa</h3>
              <p className="text-[11px] text-slate-400">Actualiza los 9 miembros automáticamente</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Nombre o Número de Mesa:
            </label>
            <input
              type="text"
              value={newMesaName}
              onChange={(e) => setNewMesaName(e.target.value)}
              placeholder="Ej: Mesa 51, Mesa 042918"
              className="w-full bg-[#050912] border border-[#16253B] rounded-xl px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none font-bold"
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Al guardar, se renombrará en los 9 miembros de esta mesa en tiempo real.
            </p>
          </div>

          {error && (
            <div className="p-2.5 bg-[#2A080C] border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#16253B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-[#D31027] hover:bg-[#B70E22] text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {isSaving ? <Check className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Guardar Cambio</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
