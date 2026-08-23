import { useWatchlist } from '../../hooks/queries/useWatchlistQuery';
import { WatchlistRow } from './WatchlistRow';
import { WatchlistEmpty } from './WatchlistEmpty';
import { ErrorState } from '../ui/States';

function WatchlistSkeleton() {
  return (
    <div className="space-y-2.5 md:space-y-0 md:bg-surface-card md:rounded-xcard md:border md:border-surface-hairline md:shadow-card md:overflow-hidden">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="bg-surface-card rounded-xcard border border-surface-hairline shadow-card p-3.5 md:p-0 md:rounded-none md:border-0 md:border-b md:border-surface-hairline md:shadow-none md:last:border-b-0 animate-pulse"
        >
          <div className="md:flex md:items-center md:gap-4 md:px-5 md:py-4">
            <div className="flex items-start justify-between gap-3 md:flex-1">
              <div className="flex-1 min-w-0">
                <div className="h-3 w-20 bg-surface-muted rounded mb-2" />
                <div className="h-4 w-40 max-w-full bg-surface-muted rounded" />
              </div>
              <div className="md:hidden text-right">
                <div className="h-5 w-16 bg-surface-muted rounded mb-2 ml-auto" />
                <div className="h-3 w-12 bg-surface-muted rounded ml-auto" />
              </div>
            </div>
            <div className="hidden md:block h-5 w-24 bg-surface-muted rounded-pill" />
            <div className="hidden md:block h-5 w-16 bg-surface-muted rounded" />
            <div className="flex gap-1.5 mt-3 pt-3 border-t border-surface-hairline md:mt-0 md:pt-0 md:border-t-0">
              <div className="h-[22px] w-[70px] bg-surface-muted rounded-pill" />
              <div className="h-[22px] w-[70px] bg-surface-muted rounded-pill" />
              <div className="h-[22px] w-[70px] bg-surface-muted rounded-pill" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Column labels — desktop only; the mobile cards are self-labelling. */
function TableHead() {
  return (
    <div className="hidden md:flex items-center gap-4 px-5 py-2.5 bg-surface-sunken border-b border-surface-hairline">
      <div className="flex-1 min-w-0 sl-eyebrow">Security</div>
      <div className="hidden lg:block w-[128px] shrink-0 sl-eyebrow">Sector</div>
      <div className="w-[120px] shrink-0 sl-eyebrow text-right">Last Price</div>
      <div className="w-[86px] shrink-0 sl-eyebrow text-right">Change</div>
      <div className="w-[248px] shrink-0 sl-eyebrow text-right">Alert Levels</div>
      <div className="w-4 shrink-0" />
    </div>
  );
}

export const WatchlistTable = () => {
  const { data: watchlist, isLoading, isError, error, refetch } = useWatchlist();

  if (isLoading) return <WatchlistSkeleton />;

  if (isError) {
    console.error('Watchlist load failed:', error?.message);
    return (
      <ErrorState
        title="Couldn't load your watchlist"
        message="Check your connection and try again."
        onRetry={() => refetch()}
      />
    );
  }

  const items = watchlist || [];
  if (items.length === 0) return <WatchlistEmpty />;

  return (
    <div className="space-y-2.5 md:space-y-0 md:bg-surface-card md:rounded-xcard md:border md:border-surface-hairline md:shadow-card md:overflow-hidden">
      <TableHead />
      {items.map((item) => (
        <WatchlistRow key={item.symbol} item={item} />
      ))}
    </div>
  );
};
