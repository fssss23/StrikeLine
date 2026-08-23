import React, { useState, useEffect } from 'react';
import { SearchX, ChevronLeft, ChevronRight } from 'lucide-react';
import { HistoryRow } from './HistoryRow';
import { EmptyState } from '../ui/States';
import { cn } from '../../lib/utils';

const ITEMS_PER_PAGE = 10;

/** Compact page numbers: 1 … 4 5 6 … 12 — keeps pagination usable on mobile. */
function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

export function HistoryTable({ alerts }) {
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(alerts.length / ITEMS_PER_PAGE));

  // Filters can shrink the result set out from under the current page
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        tone="grey"
        title="No alerts match your filters"
        description="Try widening the date range, or clearing the type and status filters."
      />
    );
  }

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentAlerts = alerts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleToggle = (id) => setExpandedId(prev => (prev === id ? null : id));

  return (
    <div className="space-y-2.5 md:space-y-0 md:bg-surface-card md:rounded-xcard md:border md:border-surface-hairline md:shadow-card md:overflow-hidden">
      <div className="hidden md:grid bg-surface-sunken px-5 py-2.5 grid-cols-[132px_1fr_112px_128px_140px_88px_116px] gap-4 border-b border-surface-hairline">
        <div className="sl-eyebrow">Time</div>
        <div className="sl-eyebrow">Security</div>
        <div className="sl-eyebrow">Type</div>
        <div className="sl-eyebrow">Configured</div>
        <div className="sl-eyebrow">Actual Price</div>
        <div className="sl-eyebrow">Channel</div>
        <div className="sl-eyebrow">Status</div>
      </div>

      {currentAlerts.map(alert => (
        <HistoryRow
          key={alert.id}
          alert={alert}
          isExpanded={expandedId === alert.id}
          onToggle={() => handleToggle(alert.id)}
        />
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 px-1 md:px-5 py-3 md:border-t md:border-surface-hairline bg-transparent md:bg-surface-card">
          <div className="text-[12px] text-text-secondary hidden sm:block sl-num">
            {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, alerts.length)} of {alerts.length}
          </div>
          <div className="flex items-center gap-1 mx-auto sm:mx-0 sm:ml-auto">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              aria-label="Previous page"
              className="sl-tap w-9 h-9 rounded-[10px] flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-muted disabled:opacity-35 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {pageWindow(currentPage, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`gap-${i}`} className="w-5 text-center text-text-tertiary text-[13px]">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={cn(
                    'sl-tap w-9 h-9 rounded-[10px] text-[13px] font-semibold flex items-center justify-center transition-all sl-num',
                    currentPage === p
                      ? 'bg-navy-gradient text-white shadow-ctaNavy'
                      : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                  )}
                >
                  {p}
                </button>
              )
            )}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              aria-label="Next page"
              className="sl-tap w-9 h-9 rounded-[10px] flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-muted disabled:opacity-35 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
