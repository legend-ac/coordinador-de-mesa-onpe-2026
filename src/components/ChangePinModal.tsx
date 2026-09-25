import React, { useState } from 'react';
import { KeyRound, Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPinChanged: (newPin: string) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  onPinChanged,
}) => {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPin.length < 4) {
      setError('El nuevo PIN debe tener al menos 4 dígitos.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('La confirmación del PIN no coincide.');
      return;
    }

    try {
      setIsSaving(true);
      const pinRef = doc(db, 'system_config', 'security_access');
      await setDoc(
        pinRef,
        {
          pin: newPin,
          updatedAt: new Date().toISOString(),
          coordinator: 'Andy Cordova',
        },
        { merge: true }
      );

      onPinChanged(newPin);
      setSuccess('¡Clave personalizada actualizada con éxito!');
      setIsSaving(false);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setError('Error al actualizar el PIN en la nube.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0A111D] text-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#16253B] space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#16253B]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#00223A] border border-blue-400 text-white flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Cambiar Clave PIN</h3>
              <p className="text-[11px] text-slate-400">Protección Andy Cordova</p>
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
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nuevo PIN Numérico (ej: 4 a 8 dígitos):
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center font-mono font-bold tracking-widest text-lg bg-[#050912] border border-[#16253B] rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Confirma el Nuevo PIN:
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center font-mono font-bold tracking-widest text-lg bg-[#050912] border border-[#16253B] rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-[#2A080C] border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 bg-[#00223A] border border-blue-400 rounded-xl text-white text-xs flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{success}</span>
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
              <span>Guardar Nueva Clave</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
