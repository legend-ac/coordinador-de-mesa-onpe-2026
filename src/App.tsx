/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * App.tsx — Multi-coordinador con Firestore.
 * FIXES:
 *  - Loop infinito de suscripción a Firestore (useCallback + useEffect circular)
 *  - Datos scoped por coordinador en: coordinadores/{dni}/miembros/
 *  - initializeData es función pura sin dependencia en el estado members
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  onSnapshot,
  writeBatch,
  setDoc,
} from 'firebase/firestore';
import {
  db,
  getMembersCollectionRef,
  getMemberDocRef,
} from './firebase';
import { useCoordinator } from './context/CoordinatorContext';
import {
  MesaMember,
  generateInitialMembers,
  DEFAULT_MESAS,
} from './types';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { MesaTable } from './components/MesaTable';
import { MobileCardList } from './components/MobileCardList';
import { EditMesaModal } from './components/EditMesaModal';
import { QuickRestoreModal } from './components/QuickRestoreModal';
import {
  AlertCircle,
  CheckCircle2,
  Table,
  LayoutGrid,
  Search,
  Edit3,
  ShieldCheck,
} from 'lucide-react';

const LOCAL_STORAGE_BACKUP_KEY = 'onpe_members_data_backup';

function readLocalMembersBackup(dni: string): MesaMember[] | null {
  try {
    const keys = [
      `${LOCAL_STORAGE_BACKUP_KEY}_${dni}`,
      LOCAL_STORAGE_BACKUP_KEY,
      `onpe_members_data_backup_v3_${dni}`,
    ];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as MesaMember[];
    }
  } catch (error) {
    console.warn('No se pudo leer la copia local:', error);
  }
  return null;
}

export default function App() {
  const { perfil } = useCoordinator();

  // ── Estado principal ────────────────────────────────────────────────────────
  const [members, setMembers] = useState<MesaMember[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = readLocalMembersBackup(perfil.dni);
        if (saved) return saved;
      } catch (e) {
        console.warn('Error leyendo backup local:', e);
      }
    }
    return generateInitialMembers(perfil.mesas);
  });

  // Siempre mostramos la copia local inmediatamente. La sincronización remota
  // continúa en segundo plano y nunca debe dejar la pantalla bloqueada.
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const [selectedMesa, setSelectedMesa] = useState<string | 'TODAS'>(
    perfil.mesas[0] || 'TODAS'
  );

  // Modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [mesaToEdit, setMesaToEdit] = useState<string>(perfil.mesas[0] || '');
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  // Seguro de datos
  const [isReadOnly, setIsReadOnly] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`onpe_data_locked_${perfil.dni}`) === 'true';
    }
    return false;
  });

  const toggleReadOnly = () => {
    const next = !isReadOnly;
    setIsReadOnly(next);
    localStorage.setItem(`onpe_data_locked_${perfil.dni}`, String(next));
    showToast(
      next
        ? '🔒 Seguro de datos ACTIVADO.'
        : '🔓 Seguro desactivado. Edición habilitada.'
    );
  };

  // Vista
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'
  );

  // Búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Backup local (sin loops) ────────────────────────────────────────────────
  useEffect(() => {
    if (members && members.length > 0) {
      try {
        localStorage.setItem(
          `${LOCAL_STORAGE_BACKUP_KEY}_${perfil.dni}`,
          JSON.stringify(members)
        );
      } catch (e) {
        console.warn('No se pudo guardar backup local:', e);
      }
    }
  }, [members, perfil.dni]);

  const membersRef = useRef<MesaMember[]>(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  // ── Mesas únicas disponibles ────────────────────────────────────────────────
  const uniqueMesas = useMemo(() => {
    const list: string[] = [];
    members.forEach((m) => {
      if (m.mesa && !list.includes(m.mesa)) list.push(m.mesa);
    });
    return list.length > 0 ? list : (perfil.mesas.length > 0 ? perfil.mesas : DEFAULT_MESAS);
  }, [members, perfil.mesas]);

  // Asegura que selectedMesa apunte a una mesa existente
  useEffect(() => {
    if (selectedMesa !== 'TODAS' && !uniqueMesas.includes(selectedMesa)) {
      setSelectedMesa(uniqueMesas[0] || 'TODAS');
    }
  }, [uniqueMesas, selectedMesa]);

  // ── Inicializar datos vacíos en Firestore (función PURA, sin deps en members) ─
  const hasInitializedRef = useRef(false);

  const initializeFirestoreData = useCallback(
    async (mesasParaInit: string[], seedMembers?: MesaMember[]) => {
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      try {
        setIsSyncing(true);
        setLoading(false);
        const batch = writeBatch(db);
        const initialMembers = seedMembers?.length ? seedMembers : generateInitialMembers(mesasParaInit);
        initialMembers.forEach((member) => {
          batch.set(getMemberDocRef(perfil.dni, member.id), {
            ...member,
            updatedAt: new Date().toISOString(),
          });
        });
        await batch.commit();
        setIsSyncing(false);
        showToast(seedMembers?.length ? 'Copia local recuperada y sincronizada.' : 'Mesas inicializadas y listas.');
      } catch (err) {
        console.error('Error inicializando Firestore:', err);
        setIsSyncing(false);
        // Fallback: usar datos locales si Firestore falla
        setMembers(seedMembers?.length ? seedMembers : generateInitialMembers(mesasParaInit));
        setLoading(false);
        setFirestoreError('Sin conexión a la base de datos. Trabajando en modo offline.');
      }
    },
    [perfil.dni]
    // ✅ NO incluye `members` → evita el loop infinito
  );

  // ── Suscripción en tiempo real a Firestore ──────────────────────────────────
  // FIX: este useEffect solo depende de perfil.dni y de initializeFirestoreData
  // (cuya referencia solo cambia si cambia perfil.dni).
  // Nunca depende de `members`, eliminando el loop de re-suscripción.
  useEffect(() => {
    if (!perfil.dni) return;

    hasInitializedRef.current = false;
    setLoading(true);
    setFirestoreError(null);

    const colRef = getMembersCollectionRef(perfil.dni);

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          /*
           * Un snapshot vacío desde la caché no prueba que la colección esté
           * vacía en el servidor. Inicializar en ese punto podía sobrescribir
           * datos existentes al recuperar la conexión. Solo creamos las mesas
           * después de una respuesta confirmada del servidor.
           */
          setLoading(false);
          if (!snapshot.metadata.fromCache) {
            // Si se cambió de base, la copia local es la fuente para restaurar;
            // jamás se reemplaza por una plantilla vacía.
            initializeFirestoreData(perfil.mesas, readLocalMembersBackup(perfil.dni) || membersRef.current);
          }
        } else {
          const loaded: MesaMember[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as MesaMember;
            loaded.push({ ...data, id: d.id });
          });
          loaded.sort((a, b) => (a.orden || 0) - (b.orden || 0));
          setMembers(loaded);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Firestore onSnapshot error:', error);
        const message = error instanceof Error ? error.message : '';
        const firestoreDisabled = /service_disabled|firestore api.*disabled/i.test(message);
        setFirestoreError(
          firestoreDisabled
            ? 'La base de datos Firestore está desactivada en este proyecto. Los cambios quedan solo en este dispositivo hasta habilitarla.'
            : 'Sin conexión con la base de datos. Puedes seguir trabajando: los cambios quedan guardados en este dispositivo y se sincronizarán al reconectar.'
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [perfil.dni, perfil.mesas, initializeFirestoreData]);

  // ── Actualizar un miembro ───────────────────────────────────────────────────
  const handleUpdateMember = async (id: string, updates: Partial<MesaMember>) => {
    if (isReadOnly) {
      showToast('⚠️ Seguro de datos activo. Desactívalo para editar.', 'info');
      return;
    }

    // Optimistic update
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      )
    );

    try {
      setIsSyncing(true);
      await setDoc(
        getMemberDocRef(perfil.dni, id),
        { ...updates, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      setIsSyncing(false);
    } catch (err) {
      console.error('Error guardando en Firestore:', err);
      setIsSyncing(false);
      showToast('Guardado localmente. Se sincronizará al reconectar.', 'info');
    }
  };

  // ── Restaurar lista completa de miembros ────────────────────────────────────
  const handleRestoreMembersList = async (incomingMembers: Partial<MesaMember>[]) => {
    if (isReadOnly) {
      showToast('⚠️ Desactiva el seguro antes de restaurar.', 'info');
      return;
    }
    try {
      setIsSyncing(true);
      const batch = writeBatch(db);

      const updated = members.map((current, index) => {
        let match = incomingMembers.find((item) => {
          if (item.id && item.id === current.id) return true;
          return item.mesa === current.mesa && item.cargo === current.cargo;
        });
        if (!match && incomingMembers[index]) match = incomingMembers[index];

        if (match) {
          const merged: Partial<MesaMember> = {
            nombreCompleto: match.nombreCompleto ?? current.nombreCompleto,
            dni: match.dni ?? current.dni,
            celular: match.celular ?? current.celular,
            estadoContacto: match.estadoContacto || current.estadoContacto,
            observaciones: match.observaciones ?? current.observaciones,
            verificado: match.verificado || current.verificado,
            updatedAt: new Date().toISOString(),
          };
          batch.set(getMemberDocRef(perfil.dni, current.id), merged, { merge: true });
          return { ...current, ...merged };
        }
        return current;
      });

      setMembers(updated);
      await batch.commit();
      setIsSyncing(false);
      showToast('¡Datos importados y sincronizados!');
    } catch (err) {
      console.error('Error al restaurar:', err);
      setIsSyncing(false);
      showToast('Error al guardar datos.', 'error');
    }
  };

  // ── Parser de texto pegado ──────────────────────────────────────────────────
  const handleRestoreFromText = async (text: string) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const parsed: Partial<MesaMember>[] = [];
    lines.forEach((line, idx) => {
      const dniMatch = line.match(/\b\d{8}\b/);
      const phoneMatch = line.match(/\b9\d{8}\b/);

      let namePart = line;
      if (dniMatch) namePart = namePart.replace(dniMatch[0], '');
      if (phoneMatch) namePart = namePart.replace(phoneMatch[0], '');
      namePart = namePart.replace(/[,;]/g, ' ').replace(/\s+/g, ' ').trim();

      if (idx < members.length) {
        parsed.push({
          id: members[idx].id,
          nombreCompleto: namePart,
          dni: dniMatch ? dniMatch[0] : '',
          celular: phoneMatch ? phoneMatch[0] : '',
        });
      }
    });

    if (parsed.length > 0) {
      await handleRestoreMembersList(parsed);
      showToast(`¡Se procesaron ${parsed.length} miembros del texto!`);
    }
  };

  // ── Renombrar mesa ──────────────────────────────────────────────────────────
  const handleSaveMesaName = async (oldMesa: string, newMesa: string) => {
    if (isReadOnly) {
      showToast('⚠️ Desactiva el seguro para renombrar mesas.', 'info');
      return;
    }
    try {
      setIsSyncing(true);
      const batch = writeBatch(db);

      const updatedMembers = members.map((m) => {
        if (m.mesa === oldMesa) {
          batch.set(
            getMemberDocRef(perfil.dni, m.id),
            { mesa: newMesa, updatedAt: new Date().toISOString() },
            { merge: true }
          );
          return { ...m, mesa: newMesa, updatedAt: new Date().toISOString() };
        }
        return m;
      });

      setMembers(updatedMembers);
      if (selectedMesa === oldMesa) setSelectedMesa(newMesa);

      await batch.commit();
      setIsSyncing(false);
      showToast(`Mesa actualizada a "${newMesa}"`);
    } catch (err) {
      console.error('Error al renombrar mesa:', err);
      setIsSyncing(false);
      showToast('Error al guardar el nuevo nombre de mesa.', 'error');
    }
  };

  const handleOpenEditMesa = (mesa: string) => {
    if (isReadOnly) {
      showToast('⚠️ Seguro activo. Desactívalo primero.', 'info');
      return;
    }
    setMesaToEdit(mesa);
    setIsEditModalOpen(true);
  };

  // ── Exportar PDF ────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    try {
      showToast('Generando informe PDF...', 'info');
      const { generateMesaReportPDF } = await import('./utils/pdfExport');
      await generateMesaReportPDF(members, selectedMesa, perfil);
      showToast('¡Informe PDF descargado!');
    } catch (err) {
      console.error(err);
      showToast('Error al generar el PDF.', 'error');
    }
  };

  // ── Exportar Excel ──────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    try {
      showToast('Generando Excel...', 'info');
      const { generateAndDownloadExcel } = await import('./utils/excelExport');
      await generateAndDownloadExcel(members, `Control_Mesas_ONPE_${perfil.dni}.xlsx`);
      showToast('¡Excel descargado!');
    } catch (err) {
      console.error(err);
      showToast('Error al generar Excel.', 'error');
    }
  };

  // ── Importar Excel ──────────────────────────────────────────────────────────
  const handleImportExcel = async (file: File) => {
    if (isReadOnly) {
      showToast('⚠️ Desactiva el seguro antes de importar Excel.', 'info');
      return;
    }
    try {
      showToast('Leyendo Excel...', 'info');
      const { parseExcelFile } = await import('./utils/excelImport');
      const importedRows = await parseExcelFile(file);
      if (importedRows.length === 0) {
        showToast('No se encontraron datos válidos.', 'error');
        return;
      }
      await handleRestoreMembersList(importedRows);
    } catch (err) {
      console.error(err);
      setIsSyncing(false);
      showToast('Error al procesar el Excel.', 'error');
    }
  };

  // ── Descargar ZIP ───────────────────────────────────────────────────────────
  const handleDownloadZip = async () => {
    try {
      showToast('Empaquetando código fuente...', 'info');
      const { downloadProjectZip } = await import('./utils/downloadProjectZip');
      await downloadProjectZip();
      showToast('¡ZIP descargado!');
    } catch (err) {
      console.error(err);
      showToast('Error al descargar ZIP.', 'error');
    }
  };

  // ── Resetear datos ──────────────────────────────────────────────────────────
  const handleResetData = () => {
    if (isReadOnly) {
      showToast('⚠️ Acción bloqueada por el seguro.', 'info');
      return;
    }
    if (window.confirm('¿Deseas reiniciar los datos a vacío? Se perderá la información actual.')) {
      hasInitializedRef.current = false;
      initializeFirestoreData(perfil.mesas);
    }
  };

  // ── Miembros filtrados para la vista ────────────────────────────────────────
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (selectedMesa !== 'TODAS' && m.mesa !== selectedMesa) return false;
      if (statusFilter !== 'TODOS' && m.estadoContacto !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !m.nombreCompleto?.toLowerCase().includes(q) &&
          !m.dni?.includes(q) &&
          !m.celular?.includes(q) &&
          !m.cargo?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [members, selectedMesa, statusFilter, searchQuery]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col antialiased bg-[#f5f1ea] text-[#0b0b0b]">

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl shadow-lg border text-xs font-bold ${
              toastMessage.type === 'error'
                ? 'bg-[#D31027] text-white border-red-500'
                : toastMessage.type === 'info'
                ? 'bg-[#00223A] text-white border-[#D31027]'
                : 'bg-[#00223A] text-white border-red-500'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Error de Firestore */}
      {firestoreError && (
        <div className="bg-[#00223A] border-b border-[#D31027] text-white text-xs py-1.5 px-4 text-center font-medium">
          ⚠️ {firestoreError}
        </div>
      )}

      {/* Header */}
      <Header
        mesas={uniqueMesas}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onOpenRestoreModal={() => setIsRestoreModalOpen(true)}
        isSyncing={isSyncing}
        isReadOnly={isReadOnly}
        onToggleReadOnly={toggleReadOnly}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 py-2.5 sm:py-4 space-y-2.5 sm:space-y-4">

        {/* Banner seguro */}
        {isReadOnly && (
          <div className="bg-[#00223A] border border-red-500/80 rounded-xl p-2.5 px-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span><strong>Seguro Global Activo:</strong> Datos protegidos contra cambios accidentales.</span>
            </div>
            <button
              type="button"
              onClick={toggleReadOnly}
              className="text-xs font-black underline hover:text-red-400 flex-shrink-0 cursor-pointer"
            >
              Desbloquear
            </button>
          </div>
        )}

        {/* Selector de mesa */}
        <div className="bg-[#0A111D] rounded-xl p-1.5 border border-[#16253B] shadow-xs flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {uniqueMesas.map((m) => {
              const count = members.filter((x) => x.mesa === m).length;
              const conf = members.filter((x) => x.mesa === m && x.estadoContacto === 'Confirmado').length;
              const isSelected = selectedMesa === m;
              return (
                <div key={m} className="flex-1 flex items-center min-w-0">
                  <button
                    onClick={() => setSelectedMesa(m)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center truncate cursor-pointer ${
                      isSelected
                        ? 'bg-[#D31027] text-white border border-[#D31027] shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-[#001726]'
                    }`}
                  >
                    <span className="truncate">{m}</span>
                    <span className={`ml-1 text-[10px] font-mono opacity-80 ${isSelected ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                      ({conf}/{count})
                    </span>
                  </button>
                  {isSelected && !isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditMesa(m)}
                      className="ml-1 p-1.5 text-white hover:bg-[#001726] rounded-lg cursor-pointer flex-shrink-0"
                      title={`Editar "${m}"`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={() => setSelectedMesa('TODAS')}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                selectedMesa === 'TODAS'
                  ? 'bg-[#D31027] text-white border border-[#D31027] shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#001726]'
              }`}
            >
              Todas ({members.length})
            </button>
          </div>

          {/* Switcher vista */}
          <div className="hidden sm:inline-flex p-0.5 bg-[#001726] border border-[#16253B] rounded-lg text-xs font-semibold ml-2 flex-shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-[#D31027] text-white shadow-xs font-bold border border-[#D31027]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabla</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'cards'
                  ? 'bg-[#D31027] text-white shadow-xs font-bold border border-[#D31027]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>
          </div>
        </div>

        {/* Resumen */}
        <SummaryCards
          members={members}
          mesas={uniqueMesas}
          selectedMesa={selectedMesa}
          onSelectMesa={setSelectedMesa}
          onEditMesa={handleOpenEditMesa}
        />

        {/* Barra de búsqueda */}
        <div className="bg-[#0A111D] rounded-xl p-2 border border-[#16253B] shadow-xs flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, DNI, celular..."
              className="w-full pl-8 pr-7 py-1 text-xs bg-[#050912] text-white border border-[#16253B] rounded-lg focus:outline-none focus:border-red-500 placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-[#050912] text-white border border-[#16253B] rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Confirmado">Confirmados</option>
            <option value="No responde">No responde</option>
            <option value="Número incorrecto">Nro. incorrecto</option>
          </select>
        </div>

        {/* Lista de miembros */}
        {loading ? (
          <div className="bg-[#0A111D] rounded-xl p-8 text-center border border-[#16253B]">
            <div className="w-7 h-7 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-white">Conectando con la base de datos...</p>
            <p className="text-[10px] text-slate-500 mt-1">Coordinador: {perfil.nombreCompleto}</p>
          </div>
        ) : (
          <>
            {viewMode === 'cards' ? (
              <MobileCardList
                members={filteredMembers}
                onUpdateMember={handleUpdateMember}
                isReadOnly={isReadOnly}
              />
            ) : (
              <MesaTable
                members={members}
                mesas={uniqueMesas}
                selectedMesa={selectedMesa}
                onSelectMesa={setSelectedMesa}
                onUpdateMember={handleUpdateMember}
                onPreviewWhatsApp={() => {}}
                onOpenEditMesa={handleOpenEditMesa}
                isReadOnly={isReadOnly}
              />
            )}
          </>
        )}
      </main>

      {/* Modales */}
      <EditMesaModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentMesa={mesaToEdit}
        existingMesas={uniqueMesas}
        onSaveMesaName={handleSaveMesaName}
      />
      <QuickRestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onRestoreFromExcel={handleRestoreMembersList}
      />
    </div>
  );
}
