/**
 * Generates the standardized WhatsApp message and direct WhatsApp Business links
 * for ONPE table members ERM 2026.
 */

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
 * Normalizes a Peru phone number:
 * - Removes non-digits
 * - If 9 digits (standard Peruvian mobile starting with 9), prepends 51
 * - If 11 digits starting with 51, keeps as is
 */
export function formatPeruPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 9) {
    return `51${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('51')) {
    return digits;
  }
  return digits;
}

/**
 * Generates the personalized message exactly as requested:
 * Pulls the member's full name and includes Andy Córdova's official credentials.
 */
export function buildWhatsAppMessage(fullName: string): string {
  const nombreLimpio = fullName?.trim() || '[NOMBRE]';
  return `🗳️ Estimado(a) señor(a) ${nombreLimpio}.

Mi nombre es Andy Córdova, soy personal de la ONPE y mi número de DNI es 76164805.

Le informo que usted ha sido seleccionado(a) como miembro de mesa a mi cargo para las Elecciones Regionales y Municipales 2026, este 4 de octubre.

Por tal motivo, le invito a recibir una capacitación presencial en la fecha y la hora que más le favorezca. Para más información, le agradeceré que consulte al número 916305297 y con gusto atenderé sus consultas.

📚 Puede capacitarse de las siguientes formas:

1️⃣ ONPEduca (plataforma virtual):
https://capacitate.onpe.gob.pe/

2️⃣ Capacitación presencial oficial:
✅ Participando en las jornadas nacionales de capacitación presencial, el domingo 27 de setiembre en los colegios autorizados.

3️⃣ Capacitación personalizada en oficina zonal:
Ubicada aproximadamente a 6 casas de distancia del colegio San Martín 2007. Si deseas acercarte, avísame por este medio y con gusto te capacito. 🙌

Capacitarse le permitirá cumplir eficientemente su rol de miembro de mesa. Esperamos contar con su participación.

Le agradezco por su amable atención. Por favor, confirmar la recepción de este mensaje. 🙏`;
}

/**
 * Opens WhatsApp Business directly without fallback to regular WhatsApp
 */
export function launchWhatsAppBusiness(rawPhone: string, fullName: string) {
  const cleanPhone = formatPeruPhone(rawPhone);
  if (!cleanPhone || cleanPhone.length < 9) return;

  const message = buildWhatsAppMessage(fullName);
  const encodedText = encodeURIComponent(message);

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);

  if (isAndroid) {
    // Exact Android Intent strictly targeting package com.whatsapp.w4b (WhatsApp Business)
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
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
    return;
  }

  if (isIOS) {
    const iosBusinessUrl = `whatsapp-smb://send?phone=${cleanPhone}&text=${encodedText}`;
    const standardUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;

    window.location.href = iosBusinessUrl;
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        window.location.href = standardUrl;
      }
    }, 800);
    return;
  }

  // Desktop
  const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  window.open(webUrl, '_blank');
}

/**
 * URL helper for QR code generation
 */
export function getWhatsAppUrl(rawPhone: string, fullName: string): string | null {
  const cleanPhone = formatPeruPhone(rawPhone);
  if (!cleanPhone || cleanPhone.length < 9) {
    return null;
  }
  const message = buildWhatsAppMessage(fullName);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppBusinessUrl(rawPhone: string, fullName: string): string | null {
  const cleanPhone = formatPeruPhone(rawPhone);
  if (!cleanPhone || cleanPhone.length < 9) return null;
  const message = buildWhatsAppMessage(fullName);
  const encodedText = encodeURIComponent(message);
  return `intent://send?phone=${cleanPhone}&text=${encodedText}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`;
}

export const openWhatsAppBusiness = launchWhatsAppBusiness;
