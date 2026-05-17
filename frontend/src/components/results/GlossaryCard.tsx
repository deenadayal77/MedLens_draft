import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { extractGlossaryTerms } from '../../utils/glossary';

interface GlossaryCardProps {
  summary: string;
}

export function GlossaryCard({ summary }: GlossaryCardProps) {
  const terms = useMemo(() => extractGlossaryTerms(summary), [summary]);

  return (
    <div className="grid-panel p-5 flex flex-col h-full max-h-[500px]">
      <div className="mb-4 flex items-center gap-3 shrink-0">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <BookOpen className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-ink">Medical Glossary</h2>
          <p className="text-sm text-muted">Simple definitions for terms in this report</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {terms.length > 0 ? (
          <div className="space-y-3">
            {terms.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-rule bg-white p-3">
                <p className="text-sm font-bold text-ink">{item.term}</p>
                <p className="mt-1 text-sm text-muted leading-relaxed">{item.definition}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[150px] items-center justify-center rounded-[18px] border border-dashed border-rule bg-neutral p-6 text-center">
            <p className="text-sm text-muted">
              No complex medical terms identified in this summary.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
