import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface GlossaryTooltipProps {
  term: string;
  definition: string;
}

export function GlossaryTooltip({ term, definition }: GlossaryTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const spanRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!spanRef.current) return;

    const rect = spanRef.current.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;

    setPos({
      top: rect.top + scrollY - 8, // will be shifted up by transform
      left: rect.left + scrollX + rect.width / 2,
    });
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    hideTimer.current = setTimeout(() => setVisible(false), 80);
  }, []);

  // Reposition if tooltip goes off-screen after render
  useEffect(() => {
    if (!visible || !tooltipRef.current) return;
    const tip = tooltipRef.current;
    const tipRect = tip.getBoundingClientRect();

    // Clamp left so it doesn't overflow right edge
    if (tipRect.right > window.innerWidth - 8) {
      const overflow = tipRect.right - (window.innerWidth - 8);
      tip.style.marginLeft = `-${overflow}px`;
    } else {
      tip.style.marginLeft = '0px';
    }
    // Clamp left so it doesn't overflow left edge
    if (tipRect.left < 8) {
      const deficit = 8 - tipRect.left;
      tip.style.marginLeft = `${deficit}px`;
    }
  }, [visible, pos]);

  const tooltip = visible
    ? createPortal(
        <div
          ref={tooltipRef}
          onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current); }}
          onMouseLeave={hide}
          style={{
            position: 'absolute',
            top: pos.top,
            left: pos.left,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'auto',
          }}
        >
          {/* Tooltip box */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              border: '1px solid rgba(8, 145, 178, 0.4)',
              borderRadius: '10px',
              padding: '9px 13px',
              maxWidth: '240px',
              minWidth: '140px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(8,145,178,0.15)',
              color: '#e2e8f0',
              fontSize: '12.5px',
              lineHeight: '1.55',
              fontWeight: 400,
              textAlign: 'center',
              whiteSpace: 'normal',
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '0.01em',
            }}
          >
            {/* Teal accent top bar */}
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#0891b2',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '5px',
              }}
            >
              📖 Medical Term
            </div>
            {definition}
          </div>

          {/* Caret / Arrow pointing down to the word */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '7px solid #1e293b',
              margin: '0 auto',
              display: 'block',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
            }}
          />
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <span
        ref={spanRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        style={{
          color: '#0891b2',
          borderBottom: '1px dashed rgba(8,145,178,0.5)',
          cursor: 'help',
          fontWeight: 'inherit',
          display: 'inline',
        }}
      >
        {term}
      </span>
      {tooltip}
    </>
  );
}
