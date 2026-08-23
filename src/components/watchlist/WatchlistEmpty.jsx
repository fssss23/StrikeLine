import React from 'react';
import { BookmarkPlus } from 'lucide-react';
import { EmptyState } from '../ui/States';

export const WatchlistEmpty = () => (
  <EmptyState
    icon={BookmarkPlus}
    title="Your watchlist is empty"
    description="Search for any PSX security above to open it, then add it to your watchlist and arm support, resistance, or breakout alerts."
  />
);
