import { Check } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const SearchDropdown = ({ results, query, onSelect, watchlist }) => {
  const highlightText = (text, highlight) => {
    if (!highlight.trim() || !text) return text;
    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = String(text).split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <span key={i} className="text-brand-blue">{part}</span> : part
    );
  };

  const items = results || [];
  const watching = watchlist || [];

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-surface-card rounded-[12px] shadow-drawer border border-surface-border max-h-[320px] overflow-y-auto overflow-x-hidden">
      {items.length === 0 ? (
        <div className="p-4 text-center text-sm text-text-secondary">No securities found for "{query}"</div>
      ) : (
        <div className="flex flex-col py-2">
          {items.map((security) => {
            const isWatching = watching.some(w => w.symbol === security.symbol);

            return (
              <div
                key={security.symbol}
                className="flex items-center justify-between px-4 h-12 cursor-pointer hover:bg-surface-page transition-colors"
                onClick={() => onSelect(security)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Badge variant="navy">{highlightText(security.symbol, query)}</Badge>
                  <span className="font-semibold text-[14px] text-text-primary truncate">
                    {highlightText(security.name, query)}
                  </span>
                  {isWatching && (
                    <div className="flex items-center gap-1 text-signal-green shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">Watching</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-text-secondary hidden sm:inline">{security.sector}</span>
                  <span className="font-bold tabular-nums text-text-primary">
                    {typeof security.price === 'number' ? security.price.toFixed(2) : '—'}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="h-10 mt-2 flex items-center justify-center border-t border-surface-border">
            <span className="text-[12px] text-text-secondary">Click a security to view details and set alerts</span>
          </div>
        </div>
      )}
    </div>
  );
};
