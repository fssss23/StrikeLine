import React from 'react';
import { useWatchlist } from '../../hooks/queries/useWatchlistQuery';
import { WatchlistRow } from './WatchlistRow';
import { WatchlistEmpty } from './WatchlistEmpty';

export const WatchlistTable = () => {
  const { data: watchlist = [] } = useWatchlist();

  if (watchlist.length === 0) {
    return <WatchlistEmpty />;
  }

  return (
    <div className="bg-surface-card rounded-[12px] shadow-card border border-surface-border overflow-hidden">
      {watchlist.map((item) => (
        <WatchlistRow key={item.symbol} item={item} />
      ))}
    </div>
  );
};
