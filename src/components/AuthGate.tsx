import React, { useState } from 'react';
import {
  Lock, ShieldCheck, KeyRound, AlertCircle,
  Eye, EyeOff, UserPlus, ArrowLeft, Loader2, UserCheck, WifiOff,
} from 'lucide-react';
import { getDoc, setDoc } from 'firebase/firestore';
import { getPerfilDocRef } from '../firebase';
import { CoordinadorPerfil } from '../types';
import { CoordinatorProvider } from '../context/CoordinatorContext';

// ─── localStorage: única fuente de verdad para el login ──────────────────────
// Nunca necesitamos Firestore para verificar el PIN.
// Firestore solo se usa al registrarse por primera vez, con fallback offline.

const CACHE_KEY = 'onpe_coord_v4';

function readCache(): CoordinadorPerfil | null {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); }
  catch { return null; }
}

function writeCache(p: CoordinadorPerfil) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(p));
}

export function updateCachedCoordinator(changes: Partial<CoordinadorPerfil>) {
  const current = readCache();
  if (current) writeCache({ ...current, ...changes });
}

export const logoutSecuritySession = () => {
  localStorage.removeItem(CACHE_KEY);
  sessionStorage.clear();
  window.location.reload();
};

// ─── Timeout helper ───────────────────────────────────────────────────────────
function withTimeout<T>(p: Promise<T>, ms = 4000): Promise<T> {
  return Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
const Err: React.FC<{ msg: string }> = ({ msg }) => (
  <div className="flex items-center gap-2 p-2.5 bg-[#2A080C] border border-red-800 rounded-xl text-red-300 text-xs">
    <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{msg}</span>
  </div>
);

// ─── AuthGate ─────────────────────────────────────────────────────────────────
interface AuthGateProps { children: React.ReactNode; }

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  // ✅ Lectura sincrónica de localStorage → 0ms, sin red
  const [cached, setCached] = useState<CoordinadorPerfil | null>(readCache);
  const [authed, setAuthed] = useState<CoordinadorPerfil | null>(null);

  // Si hay caché, mostramos PIN directamente. Si no, mostramos DNI o registro.
  const [step, setStep] = useState<'quick' | 'dni' | 'register'>(() =>
    readCache() ? 'quick' : 'dni'
  );

  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [dni, setDni] = useState('');
  const [offline, setOffline] = useState(false); // Firestore no disponible
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Registro
  const [rNombre, setRNombre] = useState('');
  const [rCelular, setRCelular] = useState('');
  const [rMesas, setRMesas] = useState('51, 52, 53');
  const [rPin, setRPin] = useState('');
  const [rPin2, setRPin2] = useState('');
  const [showRPin, setShowRPin] = useState(false);

  // ✅ Autenticado → render inmediato
  if (authed) {
    return <CoordinatorProvider initialPerfil={authed}>{children}</CoordinatorProvider>;
  }

  const authenticate = (p: CoordinadorPerfil) => {
    writeCache(p);
    setCached(p);
    setAuthed(p);
  };

  // ── QUICK-PIN: coordinador que ya inició sesión ────────────────────────────
  // Verificación 100% local, sin red, sin Firestore.
  const handleQuickPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cached) { setStep('dni'); return; }
    if (pin.trim() === cached.pin) {
      setErr(null);
      authenticate(cached);
      // Refresco silencioso en background (no bloquea)
      getDoc(getPerfilDocRef(cached.dni))
        .then(s => {
          if (!s.exists()) return;
          const refreshed = s.data() as CoordinadorPerfil;
          writeCache(refreshed);
          setCached(refreshed);
        })
        .catch(() => {});
    } else {
      setErr('PIN incorrecto. Intenta de nuevo.');
      setPin('');
    }
  };

  // ── DNI → va directo a registro (sin Firestore check en el camino crítico) ─
  const handleDni = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDni = dni.trim().replace(/\D/g, '');
    if (cleanDni.length < 6) { setErr('Ingresa un DNI válido.'); return; }

    setErr(null);
    setLoading(true);

    try {
      // Intenta buscar el perfil en Firestore (4s timeout)
      const snap = await withTimeout(getDoc(getPerfilDocRef(cleanDni)), 4000);
      if (snap.exists()) {
        // Coordinador ya registrado → cachear y mostrar quick-pin
        const perfil = snap.data() as CoordinadorPerfil;
        writeCache(perfil);
        setCached(perfil);
        setPin('');
        setStep('quick');
      } else {
        setStep('register');
      }
    } catch {
      // Firestore no disponible (timeout) → ir a registro en modo offline
      setOffline(true);
      setStep('register');
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTRO ──────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDni = dni.trim().replace(/\D/g, '');
    if (!rNombre.trim()) { setErr('Ingresa tu nombre completo.'); return; }
    if (rPin.length < 4) { setErr('El PIN debe tener mínimo 4 dígitos.'); return; }
    if (rPin !== rPin2) { setErr('Los PINs no coinciden.'); return; }

    const mesasNums = rMesas.split(/[,;\s]+/).filter(s => /^\d+$/.test(s.trim()));
    if (mesasNums.length === 0) { setErr('Ingresa al menos un número de mesa.'); return; }
    const mesas = mesasNums.map(n => `Mesa ${n.trim()}`);

    const perfil: CoordinadorPerfil = {
      dni: cleanDni,
      nombreCompleto: rNombre.trim(),
      celular: rCelular.trim() || undefined,
      mesas,
      pin: rPin,
      rol: 'Coordinador de Mesa',
      createdAt: new Date().toISOString(),
    };

    setLoading(true);
    setErr(null);

    // Intentar guardar en Firestore (no bloqueante si falla)
    try {
      await withTimeout(setDoc(getPerfilDocRef(cleanDni), perfil, { merge: true }), 5000);
    } catch {
      // Firestore no disponible: guardamos solo en localStorage (funciona igual)
      setOffline(true);
    }

    // Siempre autenticamos (localStorage es suficiente para operar)
    authenticate(perfil);
    setLoading(false);
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050912] flex items-center justify-center p-4 antialiased text-white select-none">
      <div className="max-w-sm w-full bg-[#0A111D] border border-[#16253B] rounded-3xl shadow-2xl overflow-hidden">

        <div className="bg-[#00223A] px-6 py-5 text-center border-b border-[#16253B]">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D31027] flex items-center justify-center shadow-lg border border-red-400 mb-3">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-base font-black text-white">Sistema ONPE 2026</h1>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {step === 'register' ? 'Crear cuenta de coordinador' : 'Acceso de Coordinador de Mesa'}
          </p>
        </div>

        <div className="p-6 space-y-4">

          {/* ── QUICK PIN: usuario retornante ─────────────────────────────── */}
          {step === 'quick' && cached && (
            <form onSubmit={handleQuickPin} className="space-y-4">
              <div className="bg-[#00223A] border border-blue-400/30 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#001726] border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase text-red-400 tracking-wider">Bienvenido de nuevo</p>
                  <p className="text-sm font-black text-white truncate">{cached.nombreCompleto}</p>
                  <p className="text-[10px] text-slate-400 truncate">{cached.mesas.join(' · ')}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Ingresa tu PIN:</span>
                  <button type="button" onClick={() => setShowPin(!showPin)} className="text-xs flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer">
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {showPin ? 'Ocultar' : 'Ver'}
                  </button>
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={8}
                  value={pin}
                  onChange={e => { setPin(e.target.value); setErr(null); }}
                  placeholder="••••"
                  autoFocus
                  className="w-full px-3 py-3 bg-[#050912] text-white font-mono text-center tracking-[0.4em] font-black text-xl rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none mt-1"
                />
              </div>

              {err && <Err msg={err} />}

              <button type="submit" className="w-full py-3 bg-[#D31027] hover:bg-[#B70E22] text-white font-black text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /> Ingresar
              </button>

              <button type="button" onClick={() => { setStep('dni'); setErr(null); setPin(''); }}
                className="w-full text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 cursor-pointer py-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Soy otro coordinador
              </button>
            </form>
          )}

          {/* ── DNI ───────────────────────────────────────────────────────── */}
          {step === 'dni' && (
            <form onSubmit={handleDni} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Tu número de DNI:</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={dni}
                  onChange={e => { setDni(e.target.value.replace(/\D/g, '')); setErr(null); }}
                  placeholder="Ej: 76164805"
                  autoFocus
                  className="w-full px-3 py-2.5 bg-[#050912] text-white font-mono text-center tracking-[0.25em] font-bold text-lg rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                  Primera vez → crearás tu cuenta. Ya tienes cuenta → ingresa tu DNI y encontraremos tu perfil.
                </p>
              </div>
              {err && <Err msg={err} />}
              <button
                type="submit"
                disabled={loading || dni.length < 6}
                className="w-full py-3 bg-[#D31027] hover:bg-[#B70E22] text-white font-black text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Verificando...</span></>
                  : <><KeyRound className="w-4 h-4" /><span>Continuar</span></>}
              </button>
            </form>
          )}

          {/* ── REGISTRO ──────────────────────────────────────────────────── */}
          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="bg-[#00223A] border border-blue-400/20 rounded-xl p-3 text-center">
                <UserPlus className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-white">Crear cuenta de Coordinador</p>
                <p className="text-[10px] text-slate-400">DNI: {dni}</p>
                {offline && (
                  <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-yellow-400">
                    <WifiOff className="w-3 h-3" /> Modo sin conexión — datos guardados localmente
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={rNombre}
                  onChange={e => setRNombre(e.target.value)}
                  placeholder="Ej: Andy Córdova Ríos"
                  autoFocus
                  className="w-full px-3 py-2 bg-[#050912] text-white text-sm rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Mesas asignadas * <span className="text-slate-500 font-normal">(números separados por coma)</span>
                </label>
                <input
                  type="text"
                  value={rMesas}
                  onChange={e => setRMesas(e.target.value)}
                  placeholder="51, 52, 53"
                  className="w-full px-3 py-2 bg-[#050912] text-white font-mono text-sm rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Celular <span className="text-slate-500 font-normal">(opcional)</span></label>
                <input
                  type="tel"
                  value={rCelular}
                  onChange={e => setRCelular(e.target.value.replace(/\D/g, ''))}
                  placeholder="916305297"
                  className="w-full px-3 py-2 bg-[#050912] text-white font-mono text-sm rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">PIN * (4-8 dígitos)</label>
                  <input
                    type={showRPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={8}
                    value={rPin}
                    onChange={e => setRPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-2 bg-[#050912] text-white font-mono text-center tracking-widest font-bold text-lg rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Confirmar PIN *</label>
                  <input
                    type={showRPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={8}
                    value={rPin2}
                    onChange={e => setRPin2(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-2 bg-[#050912] text-white font-mono text-center tracking-widest font-bold text-lg rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
              <button type="button" onClick={() => setShowRPin(!showRPin)}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer">
                {showRPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showRPin ? 'Ocultar PINs' : 'Mostrar PINs'}
              </button>

              {err && <Err msg={err} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#D31027] hover:bg-[#B70E22] text-white font-black text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Creando cuenta...</span></>
                  : <><UserPlus className="w-4 h-4" /><span>Crear cuenta y Entrar</span></>}
              </button>

              <button type="button" onClick={() => { setStep('dni'); setErr(null); }}
                className="w-full text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1 cursor-pointer py-1">
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
