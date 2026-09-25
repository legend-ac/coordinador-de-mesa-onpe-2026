import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, ExternalLink, QrCode } from 'lucide-react';

interface QRCodeDisplayProps {
  url: string;
  title: string;
  subtitle?: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  url,
  title,
  subtitle,
  size = 180,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!url) {
      setDataUrl('');
      return;
    }
    QRCode.toDataURL(url, {
      width: size * 2, // high-res
      margin: 1,
      color: {
        dark: '#002B49', // ONPE navy
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((res) => setDataUrl(res))
      .catch((err) => console.error('Error generating QR:', err));
  }, [url, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `QR_${title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!url) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 text-xs text-center ${className}`}>
        <QrCode className="w-8 h-8 opacity-40 mb-1" />
        <span>Se requiere un número celular para generar el código QR</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}>
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`QR ${title}`}
          style={{ width: size, height: size }}
          className="rounded-lg shadow-inner bg-white p-1"
        />
      ) : (
        <div style={{ width: size, height: size }} className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg" />
      )}

      <div className="mt-2 text-center w-full">
        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{title}</p>
        {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 w-full">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Abrir</span>
        </a>
        <button
          type="button"
          onClick={handleDownload}
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
          title="Descargar imagen QR"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
