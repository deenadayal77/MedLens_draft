import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, Copy, Check, Download } from 'lucide-react';
import { formatSummaryQRText } from '../../utils/formatters';
import type { AnalyzeResponse } from '../../types';

interface SummaryQRCardProps {
  result: AnalyzeResponse;
}

export function SummaryQRCard({ result }: SummaryQRCardProps) {
  const [copied, setCopied] = useState(false);
  const qrText = formatSummaryQRText(result);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(qrText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    const url = qrRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `medlens_summary_qr_${result.patient_name || 'patient'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid-panel p-5 h-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7edff] text-accent">
            <QrCode className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold text-ink">Summary QR</h2>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-full rounded-[20px] border border-rule bg-neutral p-4 flex flex-col sm:flex-row items-center gap-5">
          <div className="rounded-xl bg-white p-3 shadow-sm flex-shrink-0">
            <QRCodeCanvas 
              value={qrText} 
              size={120}
              level="M"
              includeMargin={false}
              ref={qrRef}
            />
          </div>
          
          <div className="flex-1 text-center sm:text-left space-y-2">
            <p className="text-sm font-medium text-ink leading-snug">
              Scan to view the patient summary and key findings on a mobile device.
            </p>
            <p className="text-xs text-muted">
              Stores up to 1500 characters securely offline.
            </p>
            
            <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rule bg-white px-4 py-1.5 text-xs font-semibold text-ink hover:bg-neutral transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rule bg-white px-4 py-1.5 text-xs font-semibold text-ink hover:bg-neutral transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Save QR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
