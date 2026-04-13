'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ButtonV2 } from '@verone/ui';
import { Download, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

interface QrCodeDisplayProps {
  url: string;
  code: string;
  size?: number;
}

export function QrCodeDisplay({ url, code, size = 200 }: QrCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !url) return;
    void QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    }).then(() => setGenerated(true));
  }, [url, size]);

  const downloadQrCode = useCallback(() => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `qr-${code}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }, [code]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="border rounded-lg p-3 bg-white">
        <canvas ref={canvasRef} />
      </div>
      {generated && (
        <ButtonV2 variant="outline" size="sm" onClick={downloadQrCode}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Telecharger QR
        </ButtonV2>
      )}
      <p className="text-xs text-muted-foreground text-center max-w-[200px] break-all">
        {url}
      </p>
    </div>
  );
}

/**
 * Inline QR icon button that shows the QR code in a popover on click.
 */
export function QrCodeInlineButton({
  url,
  code,
}: {
  url: string;
  code: string;
}) {
  const [showQr, setShowQr] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowQr(!showQr)}
        className="p-1 hover:bg-muted rounded"
        title="Afficher le QR code"
      >
        <QrCode className="h-3.5 w-3.5" />
      </button>
      {showQr && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowQr(false)}
            onKeyDown={e => {
              if (e.key === 'Escape') setShowQr(false);
            }}
            role="button"
            tabIndex={-1}
            aria-label="Fermer"
          />
          {/* Popover */}
          <div className="absolute right-0 top-8 z-50 bg-white border rounded-xl shadow-lg p-4">
            <QrCodeDisplay url={url} code={code} size={180} />
          </div>
        </>
      )}
    </div>
  );
}
