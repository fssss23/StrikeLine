import { useState, useRef, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { SearchDropdown } from './SearchDropdown'
import { useWatchlistStore } from '../../store/useWatchlistStore'
import { useWatchlist } from '../../hooks/queries/useWatchlistQuery'
import { supabase } from '../../lib/supabase'

export const SearchBar = ({ className }) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState([])
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const { data: watchlist } = useWatchlist()
  const openDrawer = useWatchlistStore(state => state.openDrawer)

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length === 0) {
        setResults([])
        setIsSearching(false)
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
        setIsSearching(false)
        return
      }

      const items = securities || []
      if (items.length === 0) {
        setResults([])
        setIsSearching(false)
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
      setIsSearching(false)
    }

    if (query.length > 0) setIsSearching(true)
    const timer = setTimeout(fetchResults, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Clicking a search result opens the drawer — does NOT auto-add to watchlist.
  // The user can add from the watchlist toggle inside the drawer.
  const handleSelect = (security) => {
    openDrawer(security.symbol)
    setQuery('')
    setIsFocused(false)
    inputRef.current?.blur()
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

  const isOpen = isFocused && query.length > 0

  return (
    <div ref={containerRef} className={cn('relative w-full z-40', className)}>
      <div
        className={cn(
          'flex items-center h-[52px] w-full rounded-[14px] bg-surface-card px-4',
          'border transition-all duration-200 ease-swift',
          isFocused
            ? 'border-brand-blue shadow-focus'
            : 'border-surface-hairline shadow-card hover:border-surface-border hover:shadow-raised'
        )}
      >
        <Search
          className={cn(
            'w-[18px] h-[18px] shrink-0 mr-3 transition-colors',
            isFocused ? 'text-brand-blue' : 'text-text-tertiary'
          )}
        />
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-[16px] md:text-[15px] placeholder:text-text-tertiary text-text-primary"
          placeholder="Search PSX — symbol or company"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(e) => { if (e.key === 'Escape') { setIsFocused(false); inputRef.current?.blur() } }}
        />

        {isSearching && query.length > 0 && (
          <Loader2 className="w-4 h-4 text-text-tertiary animate-spin shrink-0 mr-1.5" />
        )}

        {query.length > 0 ? (
          <button
            type="button"
            onClick={() => { setQuery(''); inputRef.current?.focus() }}
            aria-label="Clear search"
            className="sl-tap shrink-0 w-7 h-7 -mr-1 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <kbd className="hidden lg:inline-flex items-center h-6 px-1.5 rounded-md bg-surface-muted text-[10.5px] font-semibold text-text-tertiary ring-1 ring-inset ring-slate-900/[0.05] shrink-0">
            PSX
          </kbd>
        )}
      </div>

      {isOpen && (
        <SearchDropdown
          results={results}
          query={query}
          isSearching={isSearching}
          onSelect={handleSelect}
          watchlist={watchlist || []}
        />
      )}
    </div>
  )
}
