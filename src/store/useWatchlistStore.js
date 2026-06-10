import { create } from 'zustand'
import { queryClient } from '../lib/queryClient'

export const useWatchlistStore = create((set) => ({
  drawerOpen: false,
  drawerSymbol: null,
  
  openDrawer: (symbol) => set({ drawerOpen: true, drawerSymbol: symbol }),
  closeDrawer: () => set({ drawerOpen: false, drawerSymbol: null }),

  updatePrice: (symbol, last_price, change_pct, change_abs) => {
    // Update the React Query cache directly
    queryClient.setQueryData(['watchlist'], (oldData) => {
      if (!oldData) return oldData;
      return oldData.map(item => 
        item.symbol === symbol 
          ? { ...item, price: last_price, change_pct, change_abs }
          : item
      );
    });
  }
}))
