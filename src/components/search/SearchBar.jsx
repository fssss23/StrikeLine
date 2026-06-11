import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../../lib/utils'
import { SearchDropdown } from './SearchDropdown'
import { useWatchlistStore } from '../../store/useWatchlistStore'
import { useWatchlist } from '../../hooks/queries/useWatchlistQuery'
import { supabase } from '../../lib/supabase'

export const SearchBar = ({ className }) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [results, setResults] = useState([])
  const containerRef = useRef(null)

  const { data: watchlist } = useWatchlist()
  const openDrawer = useWatchlistStore(state => state.openDrawer)

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length === 0) {
        setResults([])
        return
      }

      const safeQuery = query.replace(/"/g, '')
      const { data: securities, error } = await supabase
        .from('securities')
        .select('symbol, company_name, sector')
        .or(`symbol.ilike."%${safeQuery}%",company_name.ilike."%${safeQuery}%"`)
        .limit(8)

      if (error) {
        console.error('Search Error:', error.message)
        return
      }

      const items = securities || []
      if (items.length === 0) {
        setResults([])
        return
      }

      const symbols = items.map(s => s.symbol)
      const { data: prices } = await supabase
        .from('price_ticks')
        .select('symbol, last_price, change_pct')
        .in('symbol', symbols)
        .order('scraped_at', { ascending: false })
        .limit(symbols.length)

      const priceMap = {}
      for (const p of prices || []) {
        if (!priceMap[p.symbol]) priceMap[p.symbol] = p
      }

      setResults(items.map(s => ({
        ...s,
        name: s.company_name,
        price: priceMap[s.symbol]?.last_price ?? null,
        change: priceMap[s.symbol]?.change_pct ?? null
      })))
    }

    const timer = setTimeout(fetchResults, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Clicking a search result opens the drawer — does NOT auto-add to watchlist.
  // The user can add from the watchlist toggle inside the drawer.
  const handleSelect = (security) => {
    openDrawer(security.symbol)
    setQuery('')
    setIsFocused(false)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn('relative w-full z-40', className)}>
      <div className={cn(
        'flex items-center h-[52px] w-full rounded-[12px] border bg-surface-card px-4 transition-colors',
        isFocused ? 'border-brand-blue shadow-focus' : 'border-surface-border'
      )}>
        <Search className="w-5 h-5 text-text-secondary shrink-0 mr-3" />
        <input
          type="text"
          className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-text-secondary text-text-primary"
          placeholder="Search PSX securities — type symbol or company name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(e) => { if (e.key === 'Escape') setIsFocused(false) }}
        />
      </div>

      {isFocused && query.length > 0 && (
        <SearchDropdown
          results={results}
          query={query}
          onSelect={handleSelect}
          watchlist={watchlist || []}
        />
      )}
    </div>
  )
}
