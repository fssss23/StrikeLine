import { Check, SearchX } from 'lucide-react';
import { cn } from '../../lib/utils';

export const SearchDropdown = ({ results, query, onSelect, watchlist, isSearching }) => {
  const highlightText = (text, highlight) => {
    if (!highlight.trim() || !text) return text;
    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = String(text).split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase()
        ? <mark key={i} className="bg-transparent text-brand-blue font-bold">{part}</mark>
        : part
    );
  };

  const items = results || [];
  const watching = watchlist || [];

  return (
    <div
      className={cn(
        'absolute top-full left-0 right-0 mt-2 bg-surface-card rounded-[14px] shadow-drawer',
        'border border-surface-hairline max-h-[min(60vh,380px)] overflow-y-auto overflow-x-hidden',
        'animate-scale-in origin-top scroll-touch overscroll-none-y'
      )}
    >
      {items.length === 0 ? (
        <div className="py-10 px-6 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-surface-muted text-text-tertiary flex items-center justify-center mb-3">
            <SearchX className="w-[18px] h-[18px]" />
          </div>
          <p className="text-[13.5px] font-semibold text-text-primary">
            {isSearching ? 'Searching…' : 'No securities found'}
          </p>
          {!isSearching && (
            <p className="text-[12.5px] text-text-secondary mt-1">
              Nothing on PSX matches &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col p-1.5">
          {items.map((security) => {
            const isWatching = watching.some(w => w.symbol === security.symbol);
            const pct = typeof security.change === 'number' ? security.change : null;
            const up = (pct ?? 0) >= 0;

            return (
              <button
                key={security.symbol}
                type="button"
                onClick={() => onSelect(security)}
                className="sl-tap w-full flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] text-left hover:bg-surface-page transition-colors"
              >
                <div className="w-[52px] shrink-0">
                  <span className="inline-flex items-center justify-center px-1.5 h-[22px] rounded-md bg-brand-navy text-white text-[11px] font-bold tracking-tight max-w-full truncate">
                    {highlightText(security.symbol, query)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-text-primary truncate tracking-tightish">
                    {highlightText(security.name, query)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11.5px] text-text-tertiary truncate">{security.sector || '—'}</span>
                    {isWatching && (
                      <span className="inline-flex items-center gap-0.5 text-signal-green text-[10.5px] font-semibold shrink-0">
                        <Check className="w-3 h-3" /> Watching
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[14px] font-bold sl-num text-text-primary leading-none">
                    {typeof security.price === 'number' ? security.price.toFixed(2) : '—'}
                  </p>
                  {pct != null && (
                    <p className={cn('text-[11px] font-semibold sl-num mt-1', up ? 'text-signal-green' : 'text-signal-red')}>
                      {up ? '▲' : '▼'}{Math.abs(pct).toFixed(2)}%
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
