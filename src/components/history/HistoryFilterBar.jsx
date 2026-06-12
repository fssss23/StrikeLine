import { useState } from 'react';
import { Input } from '../ui/Input';

export function HistoryFilterBar({ filters, setFilters, onClear, symbols = [] }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const hasActiveFilters = localFilters.dateFrom || localFilters.dateTo || localFilters.security !== 'All' || localFilters.types.length > 0 || localFilters.status !== 'All';

  const updateFilter = (key, value) => {
    const next = { ...localFilters, [key]: value };
    setLocalFilters(next);
    setFilters(next);
  };

  const toggleType = (type) => {
    const current = localFilters.types;
    let nextTypes = [];
    if (type === 'All') {
      nextTypes = [];
    } else {
      nextTypes = current.includes(type) 
        ? current.filter(t => t !== type)
        : [...current.filter(t => t !== 'All'), type];
    }
    updateFilter('types', nextTypes);
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-[12px] p-4 flex flex-col gap-3">
      <div className="flex flex-row flex-wrap gap-3 items-center">
        
        {/* Date Range */}
        <div className="flex gap-2">
          <Input 
            type="date" 
            className="w-[140px] text-[13px] h-9" 
            value={localFilters.dateFrom}
            onChange={e => updateFilter('dateFrom', e.target.value)}
          />
          <Input 
            type="date" 
            className="w-[140px] text-[13px] h-9"
            value={localFilters.dateTo}
            onChange={e => updateFilter('dateTo', e.target.value)}
          />
        </div>

        {/* Security Dropdown */}
        <select 
          className="h-9 px-3 border border-surface-border rounded-[8px] bg-white text-[13px] text-text-primary outline-none focus:border-brand-blue"
          value={localFilters.security}
          onChange={e => updateFilter('security', e.target.value)}
        >
          <option value="All">All securities</option>
          {symbols.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Type Pills */}
        <div className="flex gap-1 bg-surface-muted p-1 rounded-[8px]">
          {['All', 'Support', 'Resistance', 'Breakout'].map(t => {
            const isActive = t === 'All' ? localFilters.types.length === 0 : localFilters.types.includes(t);
            return (
              <button 
                key={t}
                onClick={() => toggleType(t)}
                className={`px-3 py-1 rounded-[6px] text-[12px] font-medium transition-colors ${
                  isActive ? 'bg-white shadow-sm text-brand-navy' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>

        {/* Status Pills */}
        <div className="flex gap-1 bg-surface-muted p-1 rounded-[8px]">
          {['All', 'Delivered', 'Failed'].map(t => {
            const isActive = localFilters.status === t;
            return (
              <button 
                key={t}
                onClick={() => updateFilter('status', t)}
                className={`px-3 py-1 rounded-[6px] text-[12px] font-medium transition-colors ${
                  isActive ? 'bg-white shadow-sm text-brand-navy' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>

        {hasActiveFilters && (
          <button 
            onClick={() => {
              const reset = { dateFrom: '', dateTo: '', security: 'All', types: [], status: 'All' };
              setLocalFilters(reset);
              setFilters(reset);
              if (onClear) onClear();
            }}
            className="ml-auto text-[13px] text-text-secondary hover:text-text-primary font-medium"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
