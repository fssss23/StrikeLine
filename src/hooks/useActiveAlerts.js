import { useWatchlist } from './queries/useWatchlistQuery'

// Count of enabled alert levels across the user's watchlist
export function useActiveAlerts() {
  const { data: watchlist } = useWatchlist()
  return (watchlist || []).reduce((sum, w) => {
    const r = w.alert_rule
    if (!r) return sum
    return sum
      + (r.support_enabled ? 1 : 0)
      + (r.resistance_enabled ? 1 : 0)
      + (r.breakout_enabled ? 1 : 0)
  }, 0)
}
