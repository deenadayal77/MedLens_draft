import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { AlertTriangle, Copy, Loader2, Download, Check } from 'lucide-react';
import { generateEmergencyCard } from '../../api/client';
import { formatEmergencyQRText } from '../../utils/formatters';
import type { EmergencyCardResponse } from '../../types';

interface EmergencyCardProps {
  sessionId: string;
}

export function EmergencyCard({ sessionId }: EmergencyCardProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EmergencyCardResponse | null>(null);
  const [qrText, setQrText] = useState('');
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await generateEmergencyCard(sessionId);
      setData(res);
      setQrText(formatEmergencyQRText(res));
    } catch (error) {
      console.error('Failed to generate emergency card:', error);
      alert('Failed to generate emergency card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!qrText) return;
    navigator.clipboard.writeText(qrText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    const url = qrRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `emergency_health_card_${data?.patient_name || 'qr'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid-panel flex h-full flex-col p-5 border-red-100/50">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-ink">Emergency Health Card</h2>
          <p className="text-sm text-muted">Generate a scannable emergency summary</p>
        </div>
      </div>

      {!data && (
        <div className="flex flex-1 flex-col items-center justify-center rounded-[18px] border border-dashed border-rule bg-neutral p-6 text-center">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            {loading ? 'Generating...' : 'Generate Emergency Card'}
          </button>
          <p className="mt-3 text-xs text-muted max-w-[200px]">
            Extracts critical info into a QR code for emergency responders.
          </p>
        </div>
      )}

      {data && (
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2">
          <div className="rounded-[20px] border border-rule bg-white p-4 w-full text-center">
            <div className="flex justify-center rounded-xl bg-white p-2">
              <QRCodeCanvas 
                value={qrText} 
                size={180}
                level="M"
                includeMargin={false}
                ref={qrRef}
              />
            </div>
            
            <div className="mt-5 text-left text-sm space-y-3 px-1">
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">Patient</p>
                <p className="font-medium text-ink">{data.patient_name || 'Unknown'}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">Conditions</p>
                <p className="font-medium text-red-600 leading-snug">
                  {data.conditions?.length ? data.conditions.join(', ') : 'None extracted'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">Blood</p>
                  <p className="font-medium text-ink">{data.blood_type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">Allergies</p>
                  <p className="font-medium text-ink">{data.allergies}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex w-full gap-2">
              <button
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rule bg-white py-2 text-sm font-semibold text-ink hover:bg-neutral"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
              <button
                onClick={handleDownload}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rule bg-white py-2 text-sm font-semibold text-ink hover:bg-neutral"
              >
                <Download className="h-4 w-4" />
                Save QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
