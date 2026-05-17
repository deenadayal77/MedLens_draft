import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Printer } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { applyGlossaryMarkdown } from '../../utils/glossary';

interface SummaryCardProps {
  summary: string;
  patientName: string;
  className?: string;
}

export function SummaryCard({ summary, patientName, className }: SummaryCardProps) {
  const hasPatient = patientName && patientName !== 'Not available';
  const processedSummary = useMemo(() => applyGlossaryMarkdown(summary), [summary]);

  const handlePrint = () => {
    window.print();
  };

  const GlossaryLink = (props: any) => {
    if (props.href && props.href.startsWith('glossary:')) {
      const definition = decodeURIComponent(props.href.replace('glossary:', ''));
      return (
        <span className="group relative inline-block cursor-help border-b border-dashed border-accent font-medium text-accent">
          {props.children}
          <span className="invisible absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-normal rounded-xl bg-ink px-3 py-2 text-xs font-medium leading-relaxed text-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 min-w-[200px] text-center pointer-events-none">
            {definition}
            <span className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 border-4 border-transparent border-t-ink"></span>
          </span>
        </span>
      );
    }
    return <a {...props} />;
  };

  return (
    <GlassCard delay={0.1} className={`${className || ''} print-summary-area`}>
      <div className="mb-5 flex flex-col justify-between gap-3 border-b border-rule pb-5 sm:flex-row sm:items-start">
        <div>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[18px] border border-rule bg-white text-accent">
            <FileText className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Structured summary</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handlePrint}
            className="print:hidden inline-flex items-center gap-2 rounded-full border border-rule bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-accent hover:text-accent transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Export PDF
          </button>
          {hasPatient && (
            <span className="w-fit rounded-full border border-rule bg-neutral px-3 py-1 text-xs font-semibold text-muted">
              Patient: {patientName}
            </span>
          )}
        </div>
      </div>
      <div className="prose-medlens">
        <ReactMarkdown components={{ a: GlossaryLink }}>
          {processedSummary}
        </ReactMarkdown>
      </div>
    </GlassCard>
  );
}
