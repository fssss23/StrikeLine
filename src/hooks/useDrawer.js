import { useWatchlistStore } from '../store/useWatchlistStore'
import { useWatchlist } from './queries/useWatchlistQuery'

export function useDrawer() {
  const { drawerOpen, drawerSymbol, openDrawer, closeDrawer } = useWatchlistStore()
  const { data: watchlist = [] } = useWatchlist()
  const security = watchlist?.find(s => s.symbol === drawerSymbol) ?? null
  return { drawerOpen, drawerSymbol, security, openDrawer, closeDrawer }
}
