import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface GlossaryTooltipProps {
  term: string;
  definition: string;
}

export function GlossaryTooltip({ term, definition }: GlossaryTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const termRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!termRef.current) return;

    const rect = termRef.current.getBoundingClientRect();
    setPosition({
      top: rect.top + window.scrollY - 8,
      left: rect.left + window.scrollX + rect.width / 2,
    });
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    hideTimer.current = setTimeout(() => setVisible(false), 80);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!visible || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    tooltip.style.marginLeft = '0px';

    const rect = tooltip.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) {
      tooltip.style.marginLeft = `-${rect.right - (window.innerWidth - 8)}px`;
    }
    if (rect.left < 8) {
      tooltip.style.marginLeft = `${8 - rect.left}px`;
    }
  }, [visible, position]);

  const tooltip = visible
    ? createPortal(
        <div
          ref={tooltipRef}
          onMouseEnter={() => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
          }}
          onMouseLeave={hide}
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              border: '1px solid rgba(8, 145, 178, 0.45)',
              borderRadius: '10px',
              boxShadow: '0 10px 34px rgba(0,0,0,0.5), 0 0 0 1px rgba(8,145,178,0.16)',
              color: '#e2e8f0',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '12.5px',
              fontWeight: 400,
              letterSpacing: '0.01em',
              lineHeight: 1.55,
              maxWidth: '250px',
              minWidth: '150px',
              padding: '9px 13px',
              textAlign: 'center',
              whiteSpace: 'normal',
            }}
          >
            <div
              style={{
                color: '#22d3ee',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginBottom: '5px',
                textTransform: 'uppercase',
              }}
            >
              Medical Term
            </div>
            {definition}
          </div>
          <div
            style={{
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '7px solid #1e293b',
              display: 'block',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
              height: 0,
              margin: '0 auto',
              width: 0,
            }}
          />
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <span
        ref={termRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={() => setVisible(false)}
        tabIndex={0}
        aria-label={`${term}: ${definition}`}
        style={{
          color: '#0891b2',
          cursor: 'help',
          display: 'inline',
          fontWeight: 600,
        }}
      >
        {term}
      </span>
      {tooltip}
    </>
  );
}
