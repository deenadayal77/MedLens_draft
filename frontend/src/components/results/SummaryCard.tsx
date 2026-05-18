import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Printer } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { GlossaryTooltip } from '../ui/GlossaryTooltip';
import { applyGlossaryMarkdown } from '../../utils/glossary';
import { URGENCY_STYLES } from '../../types';
import type { GlossaryTerm, UrgencyData } from '../../types';

interface SummaryCardProps {
  summary: string;
  patientName: string;
  urgency?: UrgencyData;
  glossaryTerms?: GlossaryTerm[];
  className?: string;
}

export function SummaryCard({ summary, patientName, urgency, glossaryTerms = [], className }: SummaryCardProps) {
  const hasPatient = patientName && patientName !== 'Not available';
  const processedSummary = useMemo(
    () => applyGlossaryMarkdown(summary, glossaryTerms),
    [summary, glossaryTerms],
  );
  const urgencyStyle = urgency ? URGENCY_STYLES[urgency.level] : null;
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const handlePrint = () => window.print();

  // Intercepts glossary: links produced by applyGlossaryMarkdown and renders
  // them as interactive GlossaryTooltip spans instead of plain <a> tags.
  const GlossaryLink = (props: any) => {
    if (props.href?.startsWith('glossary:')) {
      const definition = decodeURIComponent(props.href.replace('glossary:', ''));
      // props.children is a React node; extract the raw string for the term label
      const termText =
        typeof props.children === 'string'
          ? props.children
          : Array.isArray(props.children)
          ? props.children.join('')
          : String(props.children ?? '');
      return <GlossaryTooltip term={termText} definition={definition} />;
    }
    return <a {...props} />;
  };

  return (
    <GlassCard delay={0.1} className={`${className || ''} print-summary-area`}>

      {/* ── PRINT-ONLY DOCUMENT HEADER ── */}
      <div className="hidden print:block print-doc-header">
        <div className="print-header-bar">
          <div>
            <div className="print-brand">🩺 MedLens — AI Medical Report Summary</div>
            <div className="print-report-type">Structured Clinical Analysis</div>
          </div>
          <div className="print-date-block">{today}</div>
        </div>

        <div className="print-patient-grid">
          <div className="print-patient-field">
            <span className="print-field-label">Patient Name</span>
            <span className="print-field-value">{hasPatient ? patientName : 'Not available in report'}</span>
          </div>
          <div className="print-patient-field">
            <span className="print-field-label">Date Generated</span>
            <span className="print-field-value">{today}</span>
          </div>
          <div className="print-patient-field">
            <span className="print-field-label">Urgency Level</span>
            <span className="print-field-value print-urgency" style={{ color: urgencyStyle?.color }}>
              {urgency?.level.replace('_', ' ') ?? 'N/A'}
            </span>
          </div>
          <div className="print-patient-field">
            <span className="print-field-label">AI Confidence</span>
            <span className="print-field-value">
              {urgency?.confidence != null ? `${Math.round(urgency.confidence * 100)}%` : 'N/A'}
            </span>
          </div>
          <div className="print-patient-field">
            <span className="print-field-label">Blood Group</span>
            <span className="print-field-value">See Emergency Health Card</span>
          </div>
          <div className="print-patient-field">
            <span className="print-field-label">Report Type</span>
            <span className="print-field-value">AI-Analysed Medical Report</span>
          </div>
        </div>

        {urgency && (
          <div className="print-reasoning-box">
            <div className="print-field-label">Urgency Assessment</div>
            <div className="print-reasoning-text">{urgency.reason}</div>
          </div>
        )}

        <div className="print-disclaimer-bar">
          ⚠ AI-generated analysis. This is NOT a medical diagnosis. Always consult a qualified doctor.
        </div>

        <div className="print-section-title">Structured Clinical Summary</div>
      </div>

      {/* ── SCREEN HEADER ── */}
      <div className="mb-5 flex flex-col justify-between gap-3 border-b border-rule pb-5 sm:flex-row sm:items-start print:hidden">
        <div>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[18px] border border-rule bg-white text-accent">
            <FileText className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Structured summary</h2>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-full border border-rule bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-accent hover:text-accent transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Export PDF
          </button>
          {hasPatient && (
            <span className="rounded-full border border-rule bg-neutral px-3 py-1 text-xs font-semibold text-muted">
              Patient: {patientName}
            </span>
          )}
        </div>
      </div>

      {/* ── SUMMARY BODY ── */}
      <div className="prose-medlens">
        <ReactMarkdown components={{ a: GlossaryLink }}>
          {processedSummary}
        </ReactMarkdown>
      </div>
    </GlassCard>
  );
}
