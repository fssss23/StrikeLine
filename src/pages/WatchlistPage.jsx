import { SearchBar } from '../components/search/SearchBar';
import { WatchlistTable } from '../components/watchlist/WatchlistTable';
import { useWatchlist } from '../hooks/queries/useWatchlistQuery';

export default function WatchlistPage() {
  const { data: watchlist } = useWatchlist();
  const count = (watchlist || []).length;

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary">My Watchlist</h1>
          <span className="bg-surface-muted text-text-primary text-xs font-bold px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <p className="text-text-secondary text-sm mt-1">
          All the PSX securities you track, with live prices and configured alert levels.
        </p>
      </div>

      <SearchBar />

      <WatchlistTable />
    </div>
  );
}
