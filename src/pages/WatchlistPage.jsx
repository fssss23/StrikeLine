import { SearchBar } from '../components/search/SearchBar';
import { WatchlistTable } from '../components/watchlist/WatchlistTable';
import { PageHeader } from '../components/ui/PageHeader';
import { useWatchlist } from '../hooks/queries/useWatchlistQuery';

export default function WatchlistPage() {
  const { data: watchlist } = useWatchlist();
  const count = (watchlist || []).length;

  return (
    <div className="max-w-7xl mx-auto w-full">
      <PageHeader
        eyebrow="Pakistan Stock Exchange"
        title="My Watchlist"
        count={count}
        subtitle="Every security you track, with live prices and the alert levels you have armed."
      />

      <div className="mb-4">
        <SearchBar />
      </div>

      <WatchlistTable />
    </div>
  );
}
