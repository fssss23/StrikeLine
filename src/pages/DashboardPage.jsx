import React from 'react';
import { SearchBar } from '../components/search/SearchBar';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { WatchlistTable } from '../components/watchlist/WatchlistTable';
import { useWatchlist } from '../hooks/queries/useWatchlistQuery';

export default function DashboardPage() {
  const { data: watchlist = [] } = useWatchlist();
  const watchlistCount = watchlist.length;

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6 md:mb-8">
        <SearchBar />
      </div>

      <SummaryCards />

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-text-primary">My Watchlist</h2>
            <span className="bg-surface-muted text-text-primary text-xs font-bold px-2 py-0.5 rounded-full">
              {watchlistCount}
            </span>
          </div>
          <button className="text-sm font-medium text-brand-blue hover:text-brand-navy transition-colors">
            Manage
          </button>
        </div>
        
        <WatchlistTable />
      </div>
    </div>
  );
}
