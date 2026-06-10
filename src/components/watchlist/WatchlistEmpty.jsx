import React from 'react';
import { BookmarkPlus } from 'lucide-react';

export const WatchlistEmpty = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-surface-border rounded-[12px] bg-surface-card/50">
      <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue mb-4">
        <BookmarkPlus className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">Your watchlist is empty</h3>
      <p className="text-text-secondary max-w-sm">
        Search for PSX securities above to add them to your watchlist and start setting custom price alerts.
      </p>
    </div>
  );
};
