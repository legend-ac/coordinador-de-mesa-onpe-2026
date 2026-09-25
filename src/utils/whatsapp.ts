/**
 * Genera mensajes de WhatsApp y enlaces directos para miembros de mesa ONPE 2026.
 * Acepta información dinámica del coordinador para soporte multi-coordinador.
 */

export interface CoordinadorWAInfo {
  nombre: string;
  dni: string;
  celular: string;
  oficina?: string;
  enlaceCapacitacion?: string;
}

/** Info por defecto (compatibilidad retroactiva) */
export const COORDINADOR_INFO = {
  nombre: 'Andy Córdova',
  dni: '76164805',
  telefonoContacto: '916305297',
  rol: 'Personal de la ONPE y Coordinador de Mesa',
  evento: 'Elecciones Regionales y Municipales 2026',
  fecha: '4 de octubre',
  oficinaZonal: 'Aproximadamente a 6 casas de distancia del colegio San Martín 2007',
  enlaceCapacitacion: 'https://capacitate.onpe.gob.pe/',
};

/**
 * Normaliza un número peruano:
 * - 9 dígitos → prepende 51
 * - 11 dígitos empezando con 51 → sin cambios
 */
export function formatPeruPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 9) return `51${digits}`;
  if (digits.length === 11 && digits.startsWith('51')) return digits;
  return digits;
}

/**
 * Genera el mensaje personalizado de WhatsApp.
 * @param fullName - Nombre del miembro de mesa
 * @param coordinador - Info del coordinador (opcional; usa COORDINADOR_INFO por defecto)
 */
export function buildWhatsAppMessage(
  fullName: string,
  coordinador?: CoordinadorWAInfo
): string {
  const nombreLimpio = fullName?.trim() || '[NOMBRE]';
  const coord: CoordinadorWAInfo = coordinador || {
    nombre: COORDINADOR_INFO.nombre,
    dni: COORDINADOR_INFO.dni,
    celular: COORDINADOR_INFO.telefonoContacto,
    oficina: COORDINADOR_INFO.oficinaZonal,
    enlaceCapacitacion: COORDINADOR_INFO.enlaceCapacitacion,
  };

  const oficina = coord.oficina
    ? `Ubicada en: ${coord.oficina}. Si deseas acercarte, avísame por este medio. 🙌`
    : 'Si deseas capacitación personalizada, avísame por este medio. 🙌';

  return `🗳️ Estimado(a) señor(a) ${nombreLimpio}.

Mi nombre es ${coord.nombre}, soy personal de la ONPE y mi número de DNI es ${coord.dni}.

Le informo que usted ha sido seleccionado(a) como miembro de mesa a mi cargo para las Elecciones Regionales y Municipales 2026, este 4 de octubre.

Por tal motivo, le invito a recibir una capacitación presencial en la fecha y hora que más le favorezca. Para más información, le agradeceré que consulte al número ${coord.celular} y con gusto atenderé sus consultas.

📚 Puede capacitarse de las siguientes formas:

1️⃣ ONPEduca (plataforma virtual):
${coord.enlaceCapacitacion || 'https://capacitate.onpe.gob.pe/'}

2️⃣ Capacitación presencial oficial:
✅ Participando en las jornadas nacionales de capacitación presencial, el domingo 27 de setiembre en los colegios autorizados.

3️⃣ Capacitación personalizada en oficina zonal:
${oficina}

Capacitarse le permitirá cumplir eficientemente su rol de miembro de mesa. Esperamos contar con su participación.

Le agradezco por su amable atención. Por favor, confirmar la recepción de este mensaje. 🙏`;
}

/**
 * Abre WhatsApp Business directamente según el dispositivo.
 */
export function launchWhatsAppBusiness(
  rawPhone: string,
  fullName: string,
  coordinador?: CoordinadorWAInfo
) {
  const cleanPhone = formatPeruPhone(rawPhone);
  if (!cleanPhone || cleanPhone.length < 9) return;

  const message = buildWhatsAppMessage(fullName, coordinador);
  const encodedText = encodeURIComponent(message);

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);

  if (isAndroid) {
    const intentUrl = `intent://send?phone=${cleanPhone}&text=${encodedText}#Intent;action=android.intent.action.VIEW;package=com.whatsapp.w4b;scheme=whatsapp;end`;
    const fallbackIntent = `intent://send#Intent;action=android.intent.action.SENDTO;data=smsto:${cleanPhone};package=com.whatsapp.w4b;S.sms_body=${encodedText};end`;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    try {
      window.location.href = intentUrl;
    } catch {
      window.location.href = fallbackIntent;
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 1000);
    return;
  }

  if (isIOS) {
    const iosBusinessUrl = `whatsapp-smb://send?phone=${cleanPhone}&text=${encodedText}`;
    const standardUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
    window.location.href = iosBusinessUrl;
    setTimeout(() => {
      if (document.visibilityState === 'visible') window.location.href = standardUrl;
    }, 800);
    return;
  }

  // Desktop
  window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`, '_blank');
}

/** Genera la URL wa.me para QR y links directos */
export function getWhatsAppUrl(
  rawPhone: string,
  fullName: string,
  coordinador?: CoordinadorWAInfo
): string | null {
  const cleanPhone = formatPeruPhone(rawPhone);
  if (!cleanPhone || cleanPhone.length < 9) return null;
  const message = buildWhatsAppMessage(fullName, coordinador);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppBusinessUrl(
  rawPhone: string,
  fullName: string,
  coordinador?: CoordinadorWAInfo
): string | null {
  const cleanPhone = formatPeruPhone(rawPhone);
  if (!cleanPhone || cleanPhone.length < 9) return null;
  const message = buildWhatsAppMessage(fullName, coordinador);
  return `intent://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`;
}

export const openWhatsAppBusiness = launchWhatsAppBusiness;
