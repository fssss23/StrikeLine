import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Confirmation / form dialog.
 * Centred card on desktop, bottom sheet on mobile — a thumb-reachable
 * position beats a mid-screen box on a phone.
 */
export function Modal({ open, onClose, title, description, children, footer, tone = 'default' }) {
  // Callers often derive content from state they clear on close (e.g. a
  // `confirm` object). Hold the last open content so the exit animation
  // doesn't play against an emptied dialog.
  const held = useRef({ title, description, footer, tone });
  if (open) held.current = { title, description, footer, tone };
  const shown = open ? { title, description, footer, tone } : held.current;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Portalled to <body>: a page-level entrance animation leaves a transform on
  // an ancestor, which would otherwise become the containing block for this
  // position:fixed dialog and knock it out of the viewport.
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[3px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cn(
              'relative w-full sm:max-w-md bg-surface-card shadow-drawer',
              'rounded-t-[22px] sm:rounded-[18px] p-5 sm:p-6',
              'pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6'
            )}
          >
            {/* Grab handle — signals the sheet affordance on mobile */}
            <div className="sm:hidden w-9 h-1 rounded-full bg-surface-border mx-auto mb-4" />

            {shown.title && (
              <h3
                className={cn(
                  'text-[17px] font-bold tracking-tighter mb-1.5',
                  shown.tone === 'danger' ? 'text-signal-red' : 'text-text-primary'
                )}
              >
                {shown.title}
              </h3>
            )}
            {shown.description && (
              <p className="text-[13.5px] text-text-secondary leading-relaxed">{shown.description}</p>
            )}

            {children && <div className="mt-4">{children}</div>}

            {shown.footer && (
              <div className="flex justify-end gap-2 mt-6">{shown.footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
