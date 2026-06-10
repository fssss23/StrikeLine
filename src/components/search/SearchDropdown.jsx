import React from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../ui/Badge';

export const SearchDropdown = ({ results, query, onSelect, watchlist }) => {
  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <span key={i} className="text-brand-blue">{part}</span> : part
    );
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-surface-card rounded-[12px] shadow-drawer border border-surface-border max-h-[320px] overflow-y-auto overflow-x-hidden">
      {results.length === 0 ? (
        <div className="p-4 text-center text-sm text-text-secondary">No securities found for "{query}"</div>
      ) : (
        <div className="flex flex-col py-2">
          {results.map((security) => {
            const isWatching = watchlist.some(w => w.symbol === security.symbol);
            
            return (
              <div 
                key={security.symbol}
                className={`flex items-center justify-between px-4 h-12 transition-colors ${
                  isWatching ? 'cursor-default opacity-80' : 'cursor-pointer hover:bg-surface-page'
                }`}
                onClick={() => {
                  if (!isWatching) {
                    onSelect(security);
                    toast.success(`${security.symbol} added to watchlist`);
                  }
                }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Badge variant="navy">{highlightText(security.symbol, query)}</Badge>
                  <span className="font-semibold text-[14px] text-text-primary truncate">
                    {highlightText(security.name, query)}
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-text-secondary">{security.sector}</span>
                  {isWatching ? (
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Check className="w-4 h-4" />
                      <span className="text-xs">Watching</span>
                    </div>
                  ) : (
                    <span className="font-bold tabular-nums text-text-primary">
                      {security.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div className="h-10 mt-2 flex items-center justify-center border-t border-surface-border">
            <span className="text-[12px] text-text-secondary">Press Enter or click to add to watchlist</span>
          </div>
        </div>
      )}
    </div>
  );
};
