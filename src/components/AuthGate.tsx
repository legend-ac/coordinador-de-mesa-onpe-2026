import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { getDoc, setDoc } from 'firebase/firestore';
import { getPerfilDocRef } from '../firebase';
import { CoordinadorPerfil } from '../types';
import { CoordinatorProvider } from '../context/CoordinatorContext';

type Step = 'dni' | 'pin' | 'register';

interface AuthGateProps {
  children: React.ReactNode;
}

// ─── Caché sincrónica de sessionStorage ──────────────────────────────────────
// Esto es PURO (no async) → el componente nunca muestra spinner en recarga.

function getSessionProfile(): CoordinadorPerfil | null {
  if (typeof window === 'undefined') return null;
  try {
    const dni = sessionStorage.getItem('onpe_coordinator_dni');
    const granted = sessionStorage.getItem('onpe_auth_granted');
    const raw = sessionStorage.getItem('onpe_coordinator_profile');
    if (dni && granted === 'true' && raw) {
      return JSON.parse(raw) as CoordinadorPerfil;
    }
  } catch {}
  return null;
}

function saveSession(perfil: CoordinadorPerfil) {
  sessionStorage.setItem('onpe_coordinator_dni', perfil.dni);
  sessionStorage.setItem('onpe_auth_granted', 'true');
  // Cacheamos el perfil completo → en recarga no hace falta llamar a Firestore
  sessionStorage.setItem('onpe_coordinator_profile', JSON.stringify(perfil));
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const ErrorAlert: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-2 p-2.5 bg-[#2A080C] border border-red-800 rounded-xl text-red-300 text-xs">
    <AlertCircle className="w-4 h-4 flex-shrink-0" />
    <span>{message}</span>
  </div>
);

const Spinner = () => <Loader2 className="w-4 h-4 animate-spin" />;

// ─── AuthGate ─────────────────────────────────────────────────────────────────

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  // ✅ INICIALIZACIÓN SINCRÓNICA: sin spinner, sin parpadeo para usuarios que ya tienen sesión.
  // getSessionProfile() se ejecuta en el mismo render inicial — 0 ms delay.
  const [coordinadorPerfil, setCoordinadorPerfil] = useState<CoordinadorPerfil | null>(
    getSessionProfile
  );

  // Si ya hay sesión cacheada, renderizamos directamente sin ningún useEffect ni Firestore call.
  // ▼ Esta comprobación se hace ANTES de declarar cualquier estado que no sea necesario.

  const [step, setStep] = useState<Step>('dni');
  const [dniInput, setDniInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [foundPerfil, setFoundPerfil] = useState<CoordinadorPerfil | null>(null);
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCelular, setRegCelular] = useState('');
  const [regMesas, setRegMesas] = useState('51, 52, 53');
  const [regOficina, setRegOficina] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regPinConfirm, setRegPinConfirm] = useState('');
  const [showRegPin, setShowRegPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Sesión activa → render inmediato, sin Firestore, sin delay
  if (coordinadorPerfil) {
    return (
      <CoordinatorProvider initialPerfil={coordinadorPerfil}>
        {children}
      </CoordinatorProvider>
    );
  }

  // ── Paso 1: DNI ─────────────────────────────────────────────────────────────
  const handleDniSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDni = dniInput.trim().replace(/\D/g, '');
    if (cleanDni.length < 6) { setError('Ingresa un DNI válido (mínimo 6 dígitos).'); return; }

    setIsProcessing(true);
    setError(null);

    try {
      const snap = await getDoc(getPerfilDocRef(cleanDni));
      if (snap.exists()) {
        setFoundPerfil(snap.data() as CoordinadorPerfil);
        setStep('pin');
      } else {
        setStep('register');
      }
    } catch {
      setError('Error de conexión. Verifica tu internet.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Paso 2: PIN ─────────────────────────────────────────────────────────────
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundPerfil) return;
    if (!pinInput.trim()) { setError('Ingresa tu PIN de acceso.'); return; }

    setIsProcessing(true);
    setError(null);

    setTimeout(() => {
      if (pinInput.trim() === foundPerfil.pin) {
        saveSession(foundPerfil); // ← guarda en sessionStorage
        setCoordinadorPerfil(foundPerfil);
      } else {
        setError('PIN incorrecto. Intenta nuevamente.');
        setPinInput('');
      }
      setIsProcessing(false);
    }, 150);
  };

  // ── Paso 3: Registro ────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDni = dniInput.trim().replace(/\D/g, '');
    if (!regNombre.trim()) { setError('Ingresa tu nombre completo.'); return; }
    if (regPin.length < 4) { setError('El PIN debe tener al menos 4 dígitos.'); return; }
    if (regPin !== regPinConfirm) { setError('Los PINs no coinciden.'); return; }

    const mesasRaw = regMesas.split(/[,;\s]+/).map(s => s.trim()).filter(s => /^\d+$/.test(s));
    if (mesasRaw.length === 0) { setError('Ingresa al menos un número de mesa (ej: 51, 52).'); return; }
    const mesas = mesasRaw.map(n => `Mesa ${n}`);

    const nuevoPerfil: CoordinadorPerfil = {
      dni: cleanDni,
      nombreCompleto: regNombre.trim(),
      email: regEmail.trim() || undefined,
      celular: regCelular.trim() || undefined,
      oficina: regOficina.trim() || undefined,
      mesas,
      pin: regPin,
      rol: 'Coordinador de Mesa',
      createdAt: new Date().toISOString(),
    };

    setIsProcessing(true);
    setError(null);

    try {
      await setDoc(getPerfilDocRef(cleanDni), nuevoPerfil);
      saveSession(nuevoPerfil); // ← guarda en sessionStorage
      setCoordinadorPerfil(nuevoPerfil);
    } catch {
      setError('Error al guardar en la base de datos. Revisa tu conexión.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── UI de autenticación ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050912] flex items-center justify-center p-4 antialiased text-white select-none">
      <div className="max-w-sm w-full bg-[#0A111D] border border-[#16253B] rounded-3xl shadow-2xl overflow-hidden">

        <div className="bg-[#00223A] px-6 py-5 text-center border-b border-[#16253B]">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D31027] flex items-center justify-center shadow-lg border border-red-400 mb-3">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-base font-black tracking-tight text-white">Sistema ONPE 2026</h1>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {step === 'register' ? 'Registro de Coordinador' : 'Acceso de Coordinador de Mesa'}
          </p>
        </div>

        <div className="p-6 space-y-4">

          {/* DNI */}
          {step === 'dni' && (
            <form onSubmit={handleDniSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Ingresa tu número de DNI:</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={dniInput}
                  onChange={(e) => setDniInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej: 76164805"
                  autoFocus
                  className="w-full px-3 py-2.5 bg-[#050912] text-white font-mono text-center tracking-[0.25em] font-bold text-lg rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                  Si es tu primera vez, crearás tu cuenta de coordinador.
                </p>
              </div>
              {error && <ErrorAlert message={error} />}
              <button
                type="submit"
                disabled={isProcessing || dniInput.length < 6}
                className="w-full py-3 bg-[#D31027] hover:bg-[#B70E22] text-white font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Spinner /> : <><KeyRound className="w-4 h-4" /><span>Continuar</span></>}
              </button>
            </form>
          )}

          {/* PIN */}
          {step === 'pin' && foundPerfil && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="bg-[#00223A] border border-blue-400/30 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#001726] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase text-red-400 tracking-wider">Coordinador registrado</p>
                  <p className="text-xs font-bold text-white truncate">{foundPerfil.nombreCompleto}</p>
                  <p className="text-[10px] text-slate-400 truncate">DNI: {foundPerfil.dni} • {foundPerfil.mesas.join(' · ')}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>PIN de acceso:</span>
                  <button type="button" onClick={() => setShowPin(!showPin)} className="text-xs flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer">
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {showPin ? 'Ocultar' : 'Ver'}
                  </button>
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={8}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-full px-3 py-2.5 bg-[#050912] text-white font-mono text-center tracking-[0.35em] font-black text-lg rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none"
                />
              </div>
              {error && <ErrorAlert message={error} />}
              <button type="submit" disabled={isProcessing} className="w-full py-3 bg-[#D31027] hover:bg-[#B70E22] text-white font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isProcessing ? <Spinner /> : <><Lock className="w-4 h-4" /><span>Ingresar al Sistema</span></>}
              </button>
              <button type="button" onClick={() => { setStep('dni'); setError(null); setPinInput(''); setFoundPerfil(null); }} className="w-full text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1 cursor-pointer py-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Cambiar DNI
              </button>
            </form>
          )}

          {/* Registro */}
          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="bg-[#00223A] border border-blue-400/20 rounded-xl p-3 text-center">
                <UserPlus className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-white">Nuevo Coordinador</p>
                <p className="text-[10px] text-slate-400">DNI: {dniInput} — Completa tu perfil</p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Nombre Completo *</label>
                <input type="text" value={regNombre} onChange={(e) => setRegNombre(e.target.value)} placeholder="Ej: Andy Córdova Ríos" autoFocus className="w-full px-3 py-2 bg-[#050912] text-white text-sm rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Mesas asignadas * <span className="text-slate-500 font-normal">(números, ej: 51, 52, 53)</span></label>
                <input type="text" value={regMesas} onChange={(e) => setRegMesas(e.target.value)} placeholder="51, 52, 53" className="w-full px-3 py-2 bg-[#050912] text-white font-mono text-sm rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Celular</label>
                  <input type="tel" value={regCelular} onChange={(e) => setRegCelular(e.target.value.replace(/\D/g, ''))} placeholder="916305297" className="w-full px-3 py-2 bg-[#050912] text-white font-mono text-sm rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Email</label>
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="correo@gmail.com" className="w-full px-3 py-2 bg-[#050912] text-white text-sm rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Oficina Zonal <span className="text-slate-500 font-normal">(opcional)</span></label>
                <input type="text" value={regOficina} onChange={(e) => setRegOficina(e.target.value)} placeholder="Ej: Calle San Martín 207" className="w-full px-3 py-2 bg-[#050912] text-white text-sm rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">PIN * (4-8 dígitos)</label>
                  <input type={showRegPin ? 'text' : 'password'} inputMode="numeric" maxLength={8} value={regPin} onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="w-full px-3 py-2 bg-[#050912] text-white font-mono text-center tracking-widest font-bold text-lg rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Confirmar PIN *</label>
                  <input type={showRegPin ? 'text' : 'password'} inputMode="numeric" maxLength={8} value={regPinConfirm} onChange={(e) => setRegPinConfirm(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="w-full px-3 py-2 bg-[#050912] text-white font-mono text-center tracking-widest font-bold text-lg rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none" />
                </div>
              </div>
              <button type="button" onClick={() => setShowRegPin(!showRegPin)} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer">
                {showRegPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} {showRegPin ? 'Ocultar PINs' : 'Ver PINs'}
              </button>
              {error && <ErrorAlert message={error} />}
              <button type="submit" disabled={isProcessing} className="w-full py-3 bg-[#D31027] hover:bg-[#B70E22] text-white font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isProcessing ? <Spinner /> : <><UserPlus className="w-4 h-4" /><span>Registrarme y Entrar</span></>}
              </button>
              <button type="button" onClick={() => { setStep('dni'); setError(null); }} className="w-full text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1 cursor-pointer py-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Volver
              </button>
            </form>
          )}

        </div>

        <div className="px-6 pb-4 text-center">
          <p className="text-[10px] text-slate-600">Oficina Nacional de Procesos Electorales • Perú 2026</p>
        </div>
      </div>
    </div>
  );
};

/** Cierra sesión y limpia todo el caché */
export const logoutSecuritySession = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('onpe_coordinator_dni');
    sessionStorage.removeItem('onpe_auth_granted');
    sessionStorage.removeItem('onpe_coordinator_profile');
    window.location.reload();
  }
};
