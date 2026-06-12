import { create } from 'zustand'
import { queryClient } from '../lib/queryClient'

export const useWatchlistStore = create((set) => ({
  drawerOpen: false,
  drawerSymbol: null,

  openDrawer: (symbol) => set({ drawerOpen: true, drawerSymbol: symbol }),
  closeDrawer: () => set({ drawerOpen: false, drawerSymbol: null }),

  updatePrice: (symbol, last_price, change_pct, change_abs) => {
    // Patch the watchlist rows
    queryClient.setQueryData(['watchlist'], (oldData) => {
      if (!oldData) return oldData;
      return oldData.map(item =>
        item.symbol === symbol
          ? { ...item, price: last_price, change_pct, change_abs }
          : item
      );
    });

    // Patch any open drawer showing this symbol (partial key match covers user-scoped keys)
    queryClient.setQueriesData({ queryKey: ['drawer-security', symbol] }, (oldData) => {
      if (!oldData) return oldData;
      return { ...oldData, price: last_price, change_pct, change_abs };
    });

    // Patch the KSE-100 index badge in the top bar
    if (symbol === 'KSE100') {
      queryClient.setQueryData(['kse-100'], { last_price, change_pct });
    }
  }
}))
