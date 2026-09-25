import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  Shield,
  Calendar,
  MessageCircle,
  Copy,
  Check,
  BookOpen,
} from 'lucide-react';
import { COORDINADOR_INFO } from '../utils/whatsapp';

interface CoordinatorGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoordinatorGuideModal: React.FC<CoordinatorGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'cronograma' | 'prelacion' | 'mensajes' | 'checklist'>('cronograma');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const reminder27Sep = `📢 Estimado(a) miembro de mesa: Te recuerdo que este DOMINGO 27 DE SETIEMBRE se llevará a cabo la Jornada Nacional de Capacitación Presencial de la ONPE.
Es indispensable tu asistencia para conocer el llenado de actas y el uso del material electoral.
Te esperamos en el colegio autorizado. Atentamente: Andy Cordova (Coordinador de Mesa ONPE).`;

  const reminderBono = `💰 ¡Hola! Recuerda que por cumplir tu función como miembro de mesa en las Elecciones del 4 de octubre recibirás una compensación económica de S/ 120 soles de la ONPE.
Para cobrarlo por Yape, Plin o cuenta bancaria, debes registrarte en la plataforma oficial de la ONPE con tu DNI. Cualquier duda, avísame. Andy Cordova (Coordinador ONPE).`;

  const reminderDiaD = `⏰ ¡IMPORTANTE! Este domingo 4 de octubre la cita para los miembros de mesa es a las 06:30 AM en punto para la instalación de la mesa de sufragio.
Llevar tu DNI físico. Si llegas puntual garantizamos que la mesa abra a las 08:00 AM sin retrasos. ¡Cuento contigo! Andy Cordova (Coordinador ONPE).`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#001D38] via-[#002B49] to-[#0A3D62] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-black">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Guía Operativa del Coordinador de Mesa ONPE 2026
              </h2>
              <p className="text-xs text-blue-200">
                Plan de acción faltante para las últimas 2 semanas y el Día D (4 de Octubre)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('cronograma')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cronograma'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📅 Cronograma (2 Semanas)
          </button>
          <button
            onClick={() => setActiveTab('prelacion')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'prelacion'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ⚖️ Reglas de Prelación (Día D)
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ✅ Checklist de Materiales
          </button>
          <button
            onClick={() => setActiveTab('mensajes')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'mensajes'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            💬 Mensajes Clave Listos
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs sm:text-sm">
          
          {/* CRONOGRAMA */}
          {activeTab === 'cronograma' && (
            <div className="space-y-3.5">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3.5 rounded-xl">
                <span className="font-extrabold text-amber-900 dark:text-amber-300 block mb-1">
                  🚨 ATENCIÓN: FALTAN 2 SEMANAS PARA EL 4 DE OCTUBRE
                </span>
                <p className="text-amber-800 dark:text-amber-200 text-xs">
                  Tu meta principal estos días es <strong>asegurar el compromiso de asistencia de los 3 miembros titulares</strong> de cada mesa (Mesa 51, 52 y 53) y de al menos 2 suplentes por mesa para evitar retrasos en la instalación.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>DOMINGO 27 DE SETIEMBRE: Jornada Nacional de Capacitación</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300 text-xs">
                    <li>Se realiza en los colegios autorizados de 08:00 AM a 01:00 PM.</li>
                    <li>Práctica real de instalación, sufragio y escrutinio con cédulas modelo y actas.</li>
                    <li>Envía el mensaje de recordatorio el viernes 25 y sábado 26 de setiembre.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>LUNES 28 SEP AL VIERNES 2 OCT: Reconfirmación de Asistencia</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300 text-xs">
                    <li>Llamar a los miembros que sigan en estado "Pendiente" o "No responde".</li>
                    <li>Recordar el cobro de la <strong>Compensación Económica de S/ 120 soles</strong>.</li>
                    <li>Entrega personal de credenciales que falten repartir.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>SÁBADO 3 DE OCTUBRE (Víspera): Acondicionamiento de Aulas</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300 text-xs">
                    <li>Revisión de las aulas asignadas para Mesa 51, 52 y 53.</li>
                    <li>Colocación de cabinas secretas, mesas y sillas para miembros y personeros.</li>
                    <li>Pegado del cartel de electores en la puerta del aula.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold mb-1">
                    <Clock className="w-4 h-4" />
                    <span>DOMINGO 4 DE OCTUBRE: Horarios Oficiales del Día D</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-purple-900 dark:text-purple-200 text-xs">
                    <li><strong>06:00 AM:</strong> Llegada del Coordinador de Mesa y entrega del paquete electoral.</li>
                    <li><strong>06:30 AM:</strong> Llegada de los miembros de mesa.</li>
                    <li><strong>07:00 AM:</strong> Instalación de la mesa y llenado del Acta de Instalación.</li>
                    <li><strong>08:00 AM:</strong> Apertura de la votación ciudadana.</li>
                    <li><strong>05:00 PM:</strong> Cierre de votación e inicio del Escrutinio.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* PRELACION */}
          {activeTab === 'prelacion' && (
            <div className="space-y-3.5">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3.5 rounded-xl">
                <h3 className="font-extrabold text-blue-900 dark:text-blue-300 mb-1">
                  ⚖️ Orden Legal de Prelación para Conformar la Mesa (07:00 a 07:30 AM)
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
                  Si a las 07:00 AM no están los 3 miembros titulares, se debe aplicar estrictamente este orden según la Ley Orgánica de Elecciones y directivas de la ONPE:
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">Paso 1: Asunción de cargos entre los presentes</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Si falta el Presidente, asume el Secretario. Si falta el Secretario, asume el Tercer miembro como Presidente o Secretario según corresponda.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">Paso 2: Llamado a los suplentes de la misma mesa</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Se convoca en estricto orden: 1.er suplente, 2.º suplente, 3.er suplente, etc. que se encuentren presentes en el aula.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">Paso 3: Si son las 07:30 AM y faltan miembros</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    El Coordinador debe invitar a ciudadanos de la fila de electores de esa mesa para asumir los cargos vacantes.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200">
                  <span className="font-bold flex items-center gap-1 text-red-800 dark:text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    PROHIBICIONES ESTRICTAS PARA CONFORMAR LA MESA:
                  </span>
                  <p className="text-xs mt-1">
                    No pueden ser miembros de mesa: Personeros de mesa o centro de votación, candidatos, autoridades políticas, miembros de las Fuerzas Armadas o Policía Nacional en actividad, bomberos, ni menores de edad.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-300 text-xs">
                Verifica cada elemento del paquete electoral al momento de la entrega (06:00 AM):
              </p>

              <div className="space-y-2 text-xs">
                {[
                  'Ánforas electorales (Regional y Municipal/Distrital)',
                  'Cédulas de sufragio completas con sello de seguridad',
                  'Padrón electoral y lista de electores para firmas y huellas',
                  'Actas Electorales (Instalación, Sufragio y Escrutinio) en 5 ejemplares',
                  'Hologramas para los DNI de los electores que votan',
                  'Tinta indeleble y tampón para huellas dactilares',
                  'Lapiceros azules y cinta adhesiva de seguridad para ánforas',
                  'Cabina de votación secreta sin visibilidad externa',
                  'Sobres manila de diferentes colores para resguardo de actas',
                ].map((item, i) => (
                  <label key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* MENSAJES CLAVE */}
          {activeTab === 'mensajes' && (
            <div className="space-y-4">
              {/* Mensaje 1: Capacitación 27 Sep */}
              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 text-xs uppercase">
                    1. Recordatorio Capacitación Presencial (27 de Setiembre)
                  </span>
                  <button
                    onClick={() => handleCopy(reminder27Sep, '27sep')}
                    className="inline-flex items-center gap-1 text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-xs"
                  >
                    {copiedKey === '27sep' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === '27sep' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-pre-line font-mono">
                  {reminder27Sep}
                </p>
              </div>

              {/* Mensaje 2: Bono S/ 120 */}
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 dark:text-amber-300 text-xs uppercase">
                    2. Información del Bono de S/ 120 soles
                  </span>
                  <button
                    onClick={() => handleCopy(reminderBono, 'bono')}
                    className="inline-flex items-center gap-1 text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-xs"
                  >
                    {copiedKey === 'bono' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'bono' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-pre-line font-mono">
                  {reminderBono}
                </p>
              </div>

              {/* Mensaje 3: Cita Día D */}
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 dark:text-blue-300 text-xs uppercase">
                    3. Convocatoria a las 06:30 AM (Día D - 4 de Octubre)
                  </span>
                  <button
                    onClick={() => handleCopy(reminderDiaD, 'diad')}
                    className="inline-flex items-center gap-1 text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-xs"
                  >
                    {copiedKey === 'diad' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'diad' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-pre-line font-mono">
                  {reminderDiaD}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-slate-800 px-6 py-3.5 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
          >
            Entendido, cerrar guía
          </button>
        </div>

      </div>
    </div>
  );
};
