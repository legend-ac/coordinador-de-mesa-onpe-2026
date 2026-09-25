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
  UserCheck,
} from 'lucide-react';
import { getDoc, setDoc } from 'firebase/firestore';
import { getPerfilDocRef } from '../firebase';
import { CoordinadorPerfil } from '../types';
import { CoordinatorProvider } from '../context/CoordinatorContext';

// ─── Caché persistente en localStorage ────────────────────────────────────────
// localStorage sobrevive recargas, cierres de pestaña y reinicios del navegador.
// Esto permite login INSTANTÁNEO sin tocar Firestore para usuarios que ya registraron.

const CACHE_KEY = 'onpe_coord_profile_v3';

function readLocalProfile(): CoordinadorPerfil | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) as CoordinadorPerfil;
  } catch {}
  return null;
}

function writeLocalProfile(perfil: CoordinadorPerfil) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(perfil));
  // Además, marcar sesión activa
  sessionStorage.setItem('onpe_coordinator_profile', JSON.stringify(perfil));
  sessionStorage.setItem('onpe_auth_granted', 'true');
}

/** Cierra sesión y limpia todo el caché */
export const logoutSecuritySession = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.clear();
    window.location.reload();
  }
};

// ─── Tipos de pantalla ─────────────────────────────────────────────────────────
type Step = 'quick-pin' | 'dni' | 'pin-existing' | 'register';

interface AuthGateProps {
  children: React.ReactNode;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
const Err: React.FC<{ msg: string }> = ({ msg }) => (
  <div className="flex items-center gap-2 p-2.5 bg-[#2A080C] border border-red-800 rounded-xl text-red-300 text-xs">
    <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{msg}</span>
  </div>
);
const Spin = () => <Loader2 className="w-4 h-4 animate-spin" />;

// ─── AuthGate ─────────────────────────────────────────────────────────────────
export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {

  // ✅ LECTURA SINCRÓNICA DE localStorage: 0ms, sin red, sin async.
  // Si hay perfil guardado → pantalla de "bienvenido de nuevo + PIN".
  // Si no hay perfil → pantalla de DNI.
  const [cachedProfile] = useState<CoordinadorPerfil | null>(readLocalProfile);
  const [step, setStep] = useState<Step>(() => readLocalProfile() ? 'quick-pin' : 'dni');
  const [authedPerfil, setAuthedPerfil] = useState<CoordinadorPerfil | null>(null);

  // Formularios
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [dniInput, setDniInput] = useState('');
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
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Si ya está autenticado → render inmediato sin ningún delay
  if (authedPerfil) {
    return (
      <CoordinatorProvider initialPerfil={authedPerfil}>
        {children}
      </CoordinatorProvider>
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const authenticate = (perfil: CoordinadorPerfil) => {
    writeLocalProfile(perfil); // guarda en localStorage Y sessionStorage
    setAuthedPerfil(perfil);
  };

  // ── Quick PIN (usuario que ya inició sesión antes) ────────────────────────────
  // Verifica el PIN contra el caché local — CERO llamadas a red.
  const handleQuickPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cachedProfile) { setStep('dni'); return; }
    if (!pinInput.trim()) { setError('Ingresa tu PIN.'); return; }

    if (pinInput.trim() === cachedProfile.pin) {
      setError(null);
      authenticate(cachedProfile);
      // Refresco silencioso de Firestore en background (no bloquea el login)
      getDoc(getPerfilDocRef(cachedProfile.dni))
        .then(snap => { if (snap.exists()) writeLocalProfile(snap.data() as CoordinadorPerfil); })
        .catch(() => {}); // ignorar errores offline
    } else {
      setError('PIN incorrecto.');
      setPinInput('');
    }
  };

  // ── Paso 1: DNI → buscar en Firestore ─────────────────────────────────────
  const handleDni = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDni = dniInput.trim().replace(/\D/g, '');
    if (cleanDni.length < 6) { setError('Ingresa un DNI válido (mínimo 6 dígitos).'); return; }

    setIsLoading(true);
    setError(null);

    try {
      const snap = await getDoc(getPerfilDocRef(cleanDni));
      if (snap.exists()) {
        setFoundPerfil(snap.data() as CoordinadorPerfil);
        setStep('pin-existing');
      } else {
        setStep('register');
      }
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Paso 2a: PIN del coordinador existente ─────────────────────────────────
  const handlePinExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundPerfil) return;
    if (!pinInput.trim()) { setError('Ingresa tu PIN.'); return; }

    if (pinInput.trim() === foundPerfil.pin) {
      setError(null);
      authenticate(foundPerfil);
    } else {
      setError('PIN incorrecto. Intenta nuevamente.');
      setPinInput('');
    }
  };

  // ── Paso 2b: Registro nuevo coordinador ──────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDni = dniInput.trim().replace(/\D/g, '');
    if (!regNombre.trim()) { setError('Ingresa tu nombre completo.'); return; }
    if (regPin.length < 4) { setError('El PIN debe tener al menos 4 dígitos.'); return; }
    if (regPin !== regPinConfirm) { setError('Los PINs no coinciden.'); return; }

    const mesasRaw = regMesas.split(/[,;\s]+/).map(s => s.trim()).filter(s => /^\d+$/.test(s));
    if (mesasRaw.length === 0) { setError('Ingresa al menos un número de mesa.'); return; }
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

    setIsLoading(true);
    setError(null);

    try {
      await setDoc(getPerfilDocRef(cleanDni), nuevoPerfil);
      authenticate(nuevoPerfil);
    } catch {
      setError('Error al guardar. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050912] flex items-center justify-center p-4 antialiased text-white select-none">
      <div className="max-w-sm w-full bg-[#0A111D] border border-[#16253B] rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
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

          {/* ─── QUICK PIN: coordinador que ya inició sesión antes ─────────── */}
          {step === 'quick-pin' && cachedProfile && (
            <form onSubmit={handleQuickPin} className="space-y-4">
              {/* Badge de bienvenida */}
              <div className="bg-[#00223A] border border-blue-400/30 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#001726] border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase text-red-400 tracking-wider">Bienvenido de nuevo</p>
                  <p className="text-sm font-black text-white truncate">{cachedProfile.nombreCompleto}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    DNI {cachedProfile.dni} · {cachedProfile.mesas.join(' · ')}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Ingresa tu PIN:</span>
                  <button type="button" onClick={() => setShowPin(!showPin)} className="text-xs flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer">
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPin ? 'Ocultar' : 'Ver'}
                  </button>
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={8}
                  value={pinInput}
                  onChange={(e) => { setPinInput(e.target.value); setError(null); }}
                  placeholder="••••"
                  autoFocus
                  className="w-full px-3 py-3 bg-[#050912] text-white font-mono text-center tracking-[0.4em] font-black text-xl rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none"
                />
              </div>

              {error && <Err msg={error} />}

              <button
                type="submit"
                className="w-full py-3 bg-[#D31027] hover:bg-[#B70E22] text-white font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" /><span>Ingresar</span>
              </button>

              <button
                type="button"
                onClick={() => { setStep('dni'); setError(null); setPinInput(''); }}
                className="w-full text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 cursor-pointer py-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Soy otro coordinador
              </button>
            </form>
          )}

          {/* ─── DNI ──────────────────────────────────────────────────────── */}
          {step === 'dni' && (
            <form onSubmit={handleDni} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Ingresa tu número de DNI:</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={dniInput}
                  onChange={(e) => { setDniInput(e.target.value.replace(/\D/g, '')); setError(null); }}
                  placeholder="Ej: 76164805"
                  autoFocus
                  className="w-full px-3 py-2.5 bg-[#050912] text-white font-mono text-center tracking-[0.25em] font-bold text-lg rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                  Si es tu primera vez, crearás tu cuenta de coordinador.
                </p>
              </div>
              {error && <Err msg={error} />}
              <button
                type="submit"
                disabled={isLoading || dniInput.length < 6}
                className="w-full py-3 bg-[#D31027] hover:bg-[#B70E22] text-white font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Spin /> : <><KeyRound className="w-4 h-4" /><span>Continuar</span></>}
              </button>
            </form>
          )}

          {/* ─── PIN coordinador existente ─────────────────────────────────── */}
          {step === 'pin-existing' && foundPerfil && (
            <form onSubmit={handlePinExisting} className="space-y-4">
              <div className="bg-[#00223A] border border-blue-400/30 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#001726] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase text-red-400 tracking-wider">Coordinador encontrado</p>
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
                  onChange={(e) => { setPinInput(e.target.value); setError(null); }}
                  placeholder="••••"
                  autoFocus
                  className="w-full px-3 py-2.5 bg-[#050912] text-white font-mono text-center tracking-[0.35em] font-black text-lg rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none"
                />
              </div>
              {error && <Err msg={error} />}
              <button type="submit" className="w-full py-3 bg-[#D31027] hover:bg-[#B70E22] text-white font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /><span>Ingresar al Sistema</span>
              </button>
              <button type="button" onClick={() => { setStep('dni'); setError(null); setPinInput(''); setFoundPerfil(null); }} className="w-full text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1 cursor-pointer py-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Cambiar DNI
              </button>
            </form>
          )}

          {/* ─── REGISTRO ─────────────────────────────────────────────────── */}
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
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Mesas asignadas * <span className="text-slate-500 font-normal">(números, ej: 51, 52)</span></label>
                <input type="text" value={regMesas} onChange={(e) => setRegMesas(e.target.value)} placeholder="51, 52, 53" className="w-full px-3 py-2 bg-[#050912] text-white font-mono text-sm rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Celular</label>
                  <input type="tel" value={regCelular} onChange={(e) => setRegCelular(e.target.value.replace(/\D/g,''))} placeholder="916305297" className="w-full px-3 py-2 bg-[#050912] text-white font-mono text-sm rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none" />
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
                  <input type={showRegPin ? 'text' : 'password'} inputMode="numeric" maxLength={8} value={regPin} onChange={(e) => setRegPin(e.target.value.replace(/\D/g,''))} placeholder="••••" className="w-full px-3 py-2 bg-[#050912] text-white font-mono text-center tracking-widest font-bold text-lg rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Confirmar PIN *</label>
                  <input type={showRegPin ? 'text' : 'password'} inputMode="numeric" maxLength={8} value={regPinConfirm} onChange={(e) => setRegPinConfirm(e.target.value.replace(/\D/g,''))} placeholder="••••" className="w-full px-3 py-2 bg-[#050912] text-white font-mono text-center tracking-widest font-bold text-lg rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none" />
                </div>
              </div>
              <button type="button" onClick={() => setShowRegPin(!showRegPin)} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer">
                {showRegPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} {showRegPin ? 'Ocultar PINs' : 'Ver PINs'}
              </button>
              {error && <Err msg={error} />}
              <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#D31027] hover:bg-[#B70E22] text-white font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? <Spin /> : <><UserPlus className="w-4 h-4" /><span>Registrarme y Entrar</span></>}
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
