/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  writeBatch,
  setDoc,
} from 'firebase/firestore';
import { db, MEMBERS_COLLECTION } from './firebase';
import {
  MesaMember,
  INITIAL_MEMBERS_DATA,
  DEFAULT_MESAS,
} from './types';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { MesaTable } from './components/MesaTable';
import { MobileCardList } from './components/MobileCardList';
import { WhatsAppModal } from './components/WhatsAppModal';
import { EditMesaModal } from './components/EditMesaModal';
import { ChangePinModal } from './components/ChangePinModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { QuickRestoreModal } from './components/QuickRestoreModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { generateAndDownloadExcel } from './utils/excelExport';
import { parseExcelFile } from './utils/excelImport';
import { generateMesaReportPDF } from './utils/pdfExport';
import { downloadProjectZip } from './utils/downloadProjectZip';
import {
  AlertCircle,
  CheckCircle2,
  Table,
  LayoutGrid,
  Search,
  Edit3,
  Lock,
  ShieldCheck,
} from 'lucide-react';

const LOCAL_STORAGE_BACKUP_KEY = 'onpe_members_data_backup';

export default function App() {
  // Load initial state with local storage fallback if present
  const [members, setMembers] = useState<MesaMember[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Error reading backup from local storage:', e);
      }
    }
    return INITIAL_MEMBERS_DATA;
  });

  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<string | 'TODAS'>('Mesa 51');

  // Modal to edit mesa numbers
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [mesaToEdit, setMesaToEdit] = useState<string>('Mesa 51');

  // Modal to change custom private PIN
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  // Modal for Google Sheets Live Sync
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);

  // Modal to Restore Previous / Upload User's Excel
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  // Seguro de datos (Modo Solo Lectura para proteger contra modificaciones involuntarias)
  const [isReadOnly, setIsReadOnly] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('onpe_data_locked') === 'true';
    }
    return false;
  });

  const toggleReadOnly = () => {
    const next = !isReadOnly;
    setIsReadOnly(next);
    localStorage.setItem('onpe_data_locked', String(next));
    if (next) {
      showToast('🔒 Seguro de datos ACTIVADO. Los datos quedan protegidos contra cambios.');
    } else {
      showToast('🔓 Seguro desactivado. Edición directa habilitada.');
    }
  };

  // Mobile-first responsive view mode
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'
  );

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // WhatsApp modal state
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<{ nombre: string; celular: string }>({
    nombre: '',
    celular: '',
  });

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadZip = async () => {
    try {
      showToast('Empaquetando código fuente en .zip...', 'info');
      await downloadProjectZip();
      showToast('¡Proyecto .zip descargado con éxito!');
    } catch (err) {
      console.error('Error al empaquetar zip:', err);
      showToast('Error al descargar el archivo .zip', 'error');
    }
  };

  // Dynamically obtain unique mesas list from members
  const uniqueMesas = useMemo(() => {
    const list: string[] = [];
    members.forEach((m) => {
      if (m.mesa && !list.includes(m.mesa)) {
        list.push(m.mesa);
      }
    });
    return list.length > 0 ? list : DEFAULT_MESAS;
  }, [members]);

  // Ensure selectedMesa points to an existing mesa
  useEffect(() => {
    if (selectedMesa !== 'TODAS' && !uniqueMesas.includes(selectedMesa)) {
      if (uniqueMesas.length > 0) {
        setSelectedMesa(uniqueMesas[0]);
      } else {
        setSelectedMesa('TODAS');
      }
    }
  }, [uniqueMesas, selectedMesa]);

  // Keep a local copy always saved so user never loses data across turns or connectivity dips
  useEffect(() => {
    if (members && members.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(members));
      } catch (e) {
        console.warn('Could not backup to localStorage:', e);
      }
    }
  }, [members]);

  // Initialize Firestore only if collection is completely non-existent and local backup is empty
  const initializeFirestoreData = useCallback(async () => {
    try {
      setIsSyncing(true);
      const batch = writeBatch(db);
      const initialSource = members.length > 0 ? members : INITIAL_MEMBERS_DATA;

      initialSource.forEach((member) => {
        const ref = doc(db, MEMBERS_COLLECTION, member.id);
        batch.set(ref, {
          ...member,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      setIsSyncing(false);
      showToast('Mesas sincronizadas.');
    } catch (err) {
      console.error('Error al inicializar Firestore:', err);
      setIsSyncing(false);
      showToast('Error al conectar con la base de datos.', 'error');
    }
  }, [members]);

  // Listen to Firestore real-time changes
  useEffect(() => {
    const colRef = collection(db, MEMBERS_COLLECTION);

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          initializeFirestoreData();
        } else {
          const loaded: MesaMember[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as MesaMember;
            let currentCargo = data.cargo;
            if (data.id?.endsWith('_pos_2') && currentCargo === ('Suplente' as any)) {
              currentCargo = 'Secretario';
            }

            loaded.push({
              ...data,
              id: d.id,
              cargo: currentCargo,
            });
          });
          loaded.sort((a, b) => (a.orden || 0) - (b.orden || 0));

          // Merge safety: If remote is empty but local has names, preserve local!
          setMembers((prevLocal) => {
            if (!prevLocal || prevLocal.length === 0) return loaded;
            return loaded.map((remote) => {
              const localMatch = prevLocal.find((l) => l.id === remote.id);
              if (localMatch) {
                return {
                  ...remote,
                  nombreCompleto: remote.nombreCompleto || localMatch.nombreCompleto || '',
                  dni: remote.dni || localMatch.dni || '',
                  celular: remote.celular || localMatch.celular || '',
                  observaciones: remote.observaciones || localMatch.observaciones || '',
                  estadoContacto: remote.estadoContacto || localMatch.estadoContacto || 'Pendiente',
                  verificado: remote.verificado || localMatch.verificado || 'No',
                };
              }
              return remote;
            });
          });

          setLoading(false);
        }
      },
      (error) => {
        console.error('Firestore onSnapshot error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [initializeFirestoreData]);

  // Update a single member
  const handleUpdateMember = async (id: string, updates: Partial<MesaMember>) => {
    if (isReadOnly) {
      showToast('⚠️ Seguro de datos activo. Desactiva el seguro para editar.', 'info');
      return;
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m))
    );

    try {
      setIsSyncing(true);
      const docRef = doc(db, MEMBERS_COLLECTION, id);
      await setDoc(docRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
      setIsSyncing(false);
    } catch (err) {
      console.error('Error guardando en Firestore:', err);
      setIsSyncing(false);
      showToast('Guardado localmente. Se sincronizará con Firestore al reconectar.', 'info');
    }
  };

  // Restore imported rows or backup data to both local state and Firestore
  const handleRestoreMembersList = async (incomingMembers: Partial<MesaMember>[]) => {
    try {
      setIsSyncing(true);
      const batch = writeBatch(db);

      const updated = members.map((current, index) => {
        let match = incomingMembers.find((item) => {
          if (item.id && item.id === current.id) return true;
          return item.mesa === current.mesa && item.cargo === current.cargo;
        });

        if (!match && incomingMembers[index]) {
          match = incomingMembers[index];
        }

        if (match) {
          const docRef = doc(db, MEMBERS_COLLECTION, current.id);
          const merged: Partial<MesaMember> = {
            nombreCompleto: match.nombreCompleto !== undefined ? match.nombreCompleto : current.nombreCompleto,
            dni: match.dni !== undefined ? match.dni : current.dni,
            celular: match.celular !== undefined ? match.celular : current.celular,
            estadoContacto: match.estadoContacto || current.estadoContacto,
            observaciones: match.observaciones !== undefined ? match.observaciones : current.observaciones,
            verificado: match.verificado || current.verificado,
            updatedAt: new Date().toISOString(),
          };
          batch.set(docRef, merged, { merge: true });
          return { ...current, ...merged };
        }
        return current;
      });

      setMembers(updated);
      await batch.commit();
      setIsSyncing(false);
      showToast('¡Excel importado y colocado automáticamente en tus mesas!');
    } catch (err) {
      console.error('Error al restaurar:', err);
      setIsSyncing(false);
      showToast('Error al guardar datos.', 'error');
    }
  };

  // Quick Text parser for pasting list of members
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
      showToast(`¡Se procesaron ${parsed.length} miembros del texto pegado!`);
    }
  };

  // Rename a mesa across all its 9 members in Firestore
  const handleSaveMesaName = async (oldMesa: string, newMesa: string) => {
    if (isReadOnly) {
      showToast('⚠️ Desactiva el seguro para cambiar el nombre de mesa.', 'info');
      return;
    }

    try {
      setIsSyncing(true);
      const batch = writeBatch(db);

      const updatedMembers = members.map((m) => {
        if (m.mesa === oldMesa) {
          const docRef = doc(db, MEMBERS_COLLECTION, m.id);
          batch.update(docRef, { mesa: newMesa, updatedAt: new Date().toISOString() });
          return { ...m, mesa: newMesa, updatedAt: new Date().toISOString() };
        }
        return m;
      });

      setMembers(updatedMembers);
      if (selectedMesa === oldMesa) {
        setSelectedMesa(newMesa);
      }

      await batch.commit();
      setIsSyncing(false);
      showToast(`¡Mesa actualizada a "${newMesa}"!`);
    } catch (err) {
      console.error('Error al actualizar nombre de mesa:', err);
      setIsSyncing(false);
      showToast('Error al guardar el nuevo número de mesa en Firestore.', 'error');
    }
  };

  const handleOpenEditMesa = (mesa: string) => {
    if (isReadOnly) {
      showToast('⚠️ Seguro de datos activo. Desactívalo primero.', 'info');
      return;
    }
    setMesaToEdit(mesa);
    setIsEditModalOpen(true);
  };

  // Export to Professional PDF (Pure ONPE: Navy & Red)
  const handleExportPDF = async () => {
    try {
      showToast('Generando informe oficial en PDF...', 'info');
      await generateMesaReportPDF(members, selectedMesa);
      showToast('¡Informe PDF descargado con éxito!');
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      showToast('Error al generar el PDF.', 'error');
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      showToast('Generando archivo Excel...', 'info');
      await generateAndDownloadExcel(members, 'Control_Mesas_ONPE_Andy_Cordova.xlsx');
      showToast('¡Excel descargado!');
    } catch (err) {
      console.error('Error al exportar Excel:', err);
      showToast('Error al generar Excel.', 'error');
    }
  };

  // Import from Excel
  const handleImportExcel = async (file: File) => {
    if (isReadOnly) {
      showToast('⚠️ Desactiva el seguro de datos antes de importar Excel.', 'info');
      return;
    }

    try {
      showToast('Leyendo archivo Excel...', 'info');
      const importedRows = await parseExcelFile(file);
      if (importedRows.length === 0) {
        showToast('No se encontraron datos válidos.', 'error');
        return;
      }
      await handleRestoreMembersList(importedRows);
    } catch (err) {
      console.error('Error al importar Excel:', err);
      setIsSyncing(false);
      showToast('Error al procesar el archivo Excel.', 'error');
    }
  };

  // Reset Data confirmation
  const handleResetData = () => {
    if (isReadOnly) {
      showToast('⚠️ Acción bloqueada por el seguro de datos.', 'info');
      return;
    }
    if (
      window.confirm(
        '¿Deseas reiniciar los datos de las mesas a su estado inicial vacío?'
      )
    ) {
      initializeFirestoreData();
    }
  };

  const openWhatsAppPreview = (nombre: string, celular: string) => {
    setPreviewTarget({ nombre, celular });
    setIsWhatsAppModalOpen(true);
  };

  // Filtered members for display
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (selectedMesa !== 'TODAS' && m.mesa !== selectedMesa) return false;
      if (statusFilter !== 'TODOS' && m.estadoContacto !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = m.nombreCompleto?.toLowerCase().includes(q);
        const matchDni = m.dni?.includes(q);
        const matchPhone = m.celular?.includes(q);
        const matchCargo = m.cargo?.toLowerCase().includes(q);
        if (!matchName && !matchDni && !matchPhone && !matchCargo) return false;
      }

      return true;
    });
  }, [members, selectedMesa, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col antialiased bg-[#050912] text-white">
      
      {/* Toast Notification (Pure ONPE: Red & White on Dark) */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl shadow-lg border text-xs font-bold ${
              toastMessage.type === 'error'
                ? 'bg-[#D31027] text-white border-red-500'
                : toastMessage.type === 'info'
                ? 'bg-[#00223A] text-white border-blue-400'
                : 'bg-[#00223A] text-white border-red-500'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-white" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-white" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Header (Pure ONPE Navy & Red) */}
      <Header
        mesas={uniqueMesas}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onImportExcel={handleImportExcel}
        onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
        onOpenGoogleSheetsModal={() => setIsGoogleSheetsOpen(true)}
        onOpenRestoreModal={() => setIsRestoreModalOpen(true)}
        onDownloadZip={handleDownloadZip}
        onResetData={handleResetData}
        isSyncing={isSyncing}
        onOpenChangePin={() => setIsChangePinOpen(true)}
        isReadOnly={isReadOnly}
        onToggleReadOnly={toggleReadOnly}
      />

      {/* PWA In-App Install Banner */}
      <PWAInstallBanner />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 py-2.5 sm:py-4 space-y-2.5 sm:space-y-4">
        
        {/* Seguro de Datos Banner notice when locked */}
        {isReadOnly && (
          <div className="bg-[#00223A] border border-red-500/80 rounded-xl p-2.5 px-3.5 flex items-center justify-between gap-2 text-white">
            <div className="flex items-center gap-2 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>
                <strong>Seguro Global de Datos Activo:</strong> Tus datos guardados están blindados contra modificaciones accidentales.
              </span>
            </div>
            <button
              type="button"
              onClick={toggleReadOnly}
              className="text-xs font-black underline hover:text-red-400 flex-shrink-0 cursor-pointer"
            >
              Desbloquear edición
            </button>
          </div>
        )}

        {/* Mesa Navigation Bar (Segmented Control + Edit Mesa Option) */}
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
                        ? 'bg-[#00223A] text-white border border-blue-400 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-[#001726]'
                    }`}
                  >
                    <span className="truncate">{m}</span>
                    <span className={`ml-1 text-[10px] font-mono opacity-80 ${isSelected ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                      ({conf}/{count})
                    </span>
                  </button>

                  {/* 1-tap edit button for active table (only if not locked) */}
                  {isSelected && !isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditMesa(m)}
                      className="ml-1 p-1.5 text-white hover:bg-[#001726] rounded-lg cursor-pointer flex-shrink-0"
                      title={`Editar número de "${m}"`}
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
                  ? 'bg-[#00223A] text-white border border-blue-400 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#001726]'
              }`}
            >
              Todas ({members.length})
            </button>
          </div>

          {/* Desktop/Tablet View Mode Switcher */}
          <div className="hidden sm:inline-flex p-0.5 bg-[#001726] border border-[#16253B] rounded-lg text-xs font-semibold ml-2 flex-shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-[#00223A] text-white shadow-xs font-bold border border-blue-400/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabla</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'cards' ? 'bg-[#00223A] text-white shadow-xs font-bold border border-blue-400/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>
          </div>
        </div>

        {/* Compact Summary Strip */}
        <SummaryCards
          members={members}
          mesas={uniqueMesas}
          selectedMesa={selectedMesa}
          onSelectMesa={setSelectedMesa}
          onEditMesa={handleOpenEditMesa}
        />

        {/* Search & Quick Filter Bar */}
        <div className="bg-[#0A111D] rounded-xl p-2 border border-[#16253B] shadow-xs flex items-center gap-2">
          {/* Search Box */}
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

          {/* Filter Status Select */}
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

        {/* Members List (Cards on Mobile, Table on Desktop) */}
        {loading ? (
          <div className="bg-[#0A111D] rounded-xl p-8 text-center border border-[#16253B]">
            <div className="w-7 h-7 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs font-semibold text-white">Cargando datos en vivo...</p>
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
                onPreviewWhatsApp={openWhatsAppPreview}
                onOpenEditMesa={handleOpenEditMesa}
                isReadOnly={isReadOnly}
              />
            )}
          </>
        )}

      </main>

      {/* Modal to Edit Mesa Number */}
      <EditMesaModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentMesa={mesaToEdit}
        existingMesas={uniqueMesas}
        onSaveMesaName={handleSaveMesaName}
      />

      {/* Modal to Change Personal PIN */}
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        onPinChanged={() => {
          showToast('¡Clave personalizada actualizada exitosamente!');
        }}
      />

      {/* Modal for Google Sheets Live Sync */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsOpen}
        onClose={() => setIsGoogleSheetsOpen(false)}
        members={members}
        onSuccessToast={(msg) => showToast(msg, 'success')}
      />

      {/* Quick Restore / Upload Excel Modal */}
      <QuickRestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onRestoreFromExcel={handleRestoreMembersList}
        onRestoreFromText={handleRestoreFromText}
      />

      {/* WhatsApp Message Preview Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        targetMemberName={previewTarget.nombre}
        targetMemberPhone={previewTarget.celular}
      />

    </div>
  );
}
