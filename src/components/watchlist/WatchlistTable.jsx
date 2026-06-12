import { AlertTriangle } from 'lucide-react';
import { useWatchlist } from '../../hooks/queries/useWatchlistQuery';
import { WatchlistRow } from './WatchlistRow';
import { WatchlistEmpty } from './WatchlistEmpty';

function WatchlistSkeleton() {
  return (
    <div className="bg-surface-card rounded-[12px] shadow-card border border-surface-border overflow-hidden">
      {[0, 1, 2].map(i => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-surface-border last:border-b-0 animate-pulse">
          <div className="flex-1 min-w-[150px]">
            <div className="h-4 w-36 bg-surface-muted rounded mb-2" />
            <div className="h-3 w-16 bg-surface-muted rounded" />
          </div>
          <div className="hidden md:block h-5 w-20 bg-surface-muted rounded-pill" />
          <div className="h-4 w-16 bg-surface-muted rounded" />
          <div className="hidden sm:flex gap-1.5">
            <div className="h-5 w-16 bg-surface-muted rounded-pill" />
            <div className="h-5 w-16 bg-surface-muted rounded-pill" />
            <div className="h-5 w-16 bg-surface-muted rounded-pill" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const WatchlistTable = () => {
  const { data: watchlist, isLoading, isError, error, refetch } = useWatchlist();

  if (isLoading) return <WatchlistSkeleton />;

  if (isError) {
    console.error('Watchlist load failed:', error?.message);
    return (
      <div className="bg-surface-card rounded-[12px] shadow-card border border-surface-border p-10 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-signal-redBg text-signal-red flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-[15px] font-bold text-text-primary mb-1">Couldn't load your watchlist</h3>
        <p className="text-[13px] text-text-secondary mb-4">Check your connection and try again.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-[8px] bg-brand-navy text-white text-[13px] font-semibold hover:bg-[#1A4A7A] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const items = watchlist || [];
  if (items.length === 0) return <WatchlistEmpty />;

  return (
    <div className="bg-surface-card rounded-[12px] shadow-card border border-surface-border overflow-hidden">
      {items.map((item) => (
        <WatchlistRow key={item.symbol} item={item} />
      ))}
    </div>
  );
};
