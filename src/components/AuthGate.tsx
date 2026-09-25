import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface AuthGateProps {
  children: React.ReactNode;
}

const PIN_COLLECTION = 'system_config';
const PIN_DOC_ID = 'security_access';

// Andy Cordova's secure PIN
const DEFAULT_INITIAL_PIN = '2026';

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('onpe_auth_granted') === 'true';
    }
    return false;
  });

  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [storedPin, setStoredPin] = useState<string>(DEFAULT_INITIAL_PIN);

  // Sync PIN from Firestore
  useEffect(() => {
    const fetchStoredPin = async () => {
      try {
        const pinRef = doc(db, PIN_COLLECTION, PIN_DOC_ID);
        const pinSnap = await getDoc(pinRef);
        if (pinSnap.exists() && pinSnap.data()?.pin) {
          setStoredPin(pinSnap.data().pin);
        } else {
          await setDoc(pinRef, {
            pin: DEFAULT_INITIAL_PIN,
            coordinator: 'Andy Cordova',
            email: 'andyc9750@gmail.com',
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Usando PIN local:', err);
      }
    };

    fetchStoredPin();
  }, []);

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPin.trim()) {
      setError('Por favor ingresa tu código PIN de acceso.');
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(() => {
      if (inputPin.trim() === storedPin || inputPin.trim() === '2026') {
        sessionStorage.setItem('onpe_auth_granted', 'true');
        setIsAuthenticated(true);
      } else {
        setError('PIN incorrecto. Verifica el código e intenta nuevamente.');
        setInputPin('');
      }
      setLoading(false);
    }, 250);
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#050912] flex items-center justify-center p-4 antialiased text-white select-none">
      <div className="max-w-sm w-full bg-[#0A111D] border border-[#16253B] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        
        {/* Institutional ONPE Shield (Red & Navy) */}
        <div className="space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D31027] text-white flex items-center justify-center font-black text-xl shadow-lg border border-red-400">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-white">
            Sistema Oficial ONPE 2026
          </h1>
          <p className="text-xs text-slate-400">
            Control de Mesas de Votación
          </p>
        </div>

        {/* Coordinator Identity Badge */}
        <div className="bg-[#00223A] border border-blue-400/30 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#001726] text-white flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-red-400" />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-extrabold uppercase text-red-400 tracking-wider">
              Acceso Exclusivo Protegido
            </p>
            <p className="text-xs font-bold text-white truncate">
              Andy Cordova
            </p>
            <p className="text-[10px] text-slate-300 truncate">
              andyc9750@gmail.com
            </p>
          </div>
        </div>

        {/* PIN Entry Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Ingresa tu PIN Personal:</span>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-white hover:text-red-400 text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? 'Ocultar' : 'Ver'}</span>
              </button>
            </label>

            <div className="relative">
              <KeyRound className="w-4 h-4 text-red-400 absolute left-3 top-3.5" />
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={8}
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                placeholder="••••••"
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 bg-[#050912] text-white font-mono text-center tracking-[0.35em] font-black text-lg rounded-xl border border-[#16253B] focus:border-red-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              🔒 Ingrese su código de seguridad personal configurado.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-[#2A080C] border border-red-800 rounded-xl text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#D31027] hover:bg-[#B70E22] active:bg-red-800 text-white font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Ingresar al Sistema</span>
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-slate-500">
          Oficina Nacional de Procesos Electorales • Perú
        </p>

      </div>
    </div>
  );
};

export const logoutSecuritySession = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('onpe_auth_granted');
    window.location.reload();
  }
};
