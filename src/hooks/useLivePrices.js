import { useEffect } from 'react'
import { useWatchlistStore } from '../store/useWatchlistStore'
import { mockSecurities } from '../data/mockData'

export function useLivePrices() {
  const watchlist = useWatchlistStore(state => state.watchlist)
  const updatePrice = useWatchlistStore(state => state.updatePrice)

  useEffect(() => {
    const interval = setInterval(() => {
      watchlist.forEach(item => {
        // Fallback if price is not currently in item, get from mockSecurities
        const baseSecurity = mockSecurities.find(s => s.symbol === item.symbol)
        const currentPrice = item.price || baseSecurity?.price || 100
        const openPrice = baseSecurity?.open || currentPrice
        
        const direction = Math.random() > 0.48 ? 1 : -1
        const movePct = (Math.random() * 0.007 + 0.001) * direction
        const newPrice = parseFloat((currentPrice * (1 + movePct)).toFixed(2))
        const newChange = parseFloat(((newPrice - openPrice) / openPrice * 100).toFixed(2))
        const newChangeAbs = parseFloat((newPrice - openPrice).toFixed(2))
        
        updatePrice(item.symbol, newPrice, newChange, newChangeAbs)
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [watchlist.length, updatePrice]) // Ensure effect runs properly
}
