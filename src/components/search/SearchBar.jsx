import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SearchDropdown } from './SearchDropdown';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { useAddToWatchlist } from '../../hooks/queries/useWatchlistQuery';
import { supabase } from '../../lib/supabase';

export const SearchBar = ({ className }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState([]);
  const containerRef = useRef(null);
  
  const addMutation = useAddToWatchlist();

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length === 0) {
        setResults([]);
        return;
      }
      
      const safeQuery = query.replace(/"/g, '');
      const { data: securities, error } = await supabase
        .from('securities')
        .select('symbol, company_name, sector')
        .or(`symbol.ilike."%${safeQuery}%",company_name.ilike."%${safeQuery}%"`)
        .limit(8);
        
      if (error) {
        console.error("Search Error:", error.message, error.details);
      }
        
      if (error || !securities) return;
      
      const symbols = securities.map(s => s.symbol);
      const { data: prices } = await supabase
        .from('price_ticks')
        .select('symbol, last_price, change_pct')
        .in('symbol', symbols)
        .order('scraped_at', { ascending: false })
        .limit(symbols.length);
        
      const priceMap = {};
      if (prices) {
        prices.forEach(p => {
          if (!priceMap[p.symbol]) priceMap[p.symbol] = p;
        });
      }
      
      const enriched = securities.map(s => ({
        ...s,
        name: s.company_name, // Map for UI compatibility
        price: priceMap[s.symbol]?.last_price || null,
        change: priceMap[s.symbol]?.change_pct || null
      }));
      
      setResults(enriched);
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = (security) => {
    addMutation.mutate(security.symbol);
    setQuery('');
    setIsFocused(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full z-40", className)}>
      <div className={cn(
        "flex items-center h-[52px] w-full rounded-[12px] border bg-surface-card px-4 transition-colors",
        isFocused ? "border-brand-blue shadow-focus" : "border-surface-border"
      )}>
        <Search className="w-5 h-5 text-text-secondary shrink-0 mr-3" />
        <input 
          type="text"
          className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-text-secondary text-text-primary"
          placeholder="Search PSX securities — type symbol or company name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
        />
      </div>
      
      {isFocused && query.length > 0 && (
        <SearchDropdown 
          results={results} 
          query={query} 
          onSelect={handleSelect}
        />
      )}
    </div>
  );
};
