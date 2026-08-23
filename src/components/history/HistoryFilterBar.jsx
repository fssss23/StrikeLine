import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const EMPTY = { dateFrom: '', dateTo: '', security: 'All', types: [], status: 'All' };

/** Segmented control — the app's standard multi-choice affordance. */
function Segmented({ options, isActive, onSelect, label }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex gap-0.5 bg-surface-muted p-0.5 rounded-[10px] shrink-0 ring-1 ring-inset ring-slate-900/[0.04]"
    >
      {options.map(opt => {
        const active = isActive(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className={cn(
              'sl-tap px-2.5 h-8 rounded-[8px] text-[12px] font-semibold whitespace-nowrap transition-all duration-200',
              active
                ? 'bg-surface-card text-brand-navy shadow-card'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

const selectClass =
  'h-9 pl-3 pr-8 border border-surface-border rounded-[10px] bg-surface-card text-[13px] text-text-primary ' +
  'shadow-inset outline-none transition-all focus:border-brand-blue focus:shadow-focus';

const dateClass =
  'h-9 px-2.5 border border-surface-border rounded-[10px] bg-surface-card text-[12.5px] text-text-primary ' +
  'shadow-inset outline-none transition-all focus:border-brand-blue focus:shadow-focus';

export function HistoryFilterBar({ filters, setFilters, onClear, symbols = [] }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [expanded, setExpanded] = useState(false);

  const advancedCount =
    (localFilters.dateFrom ? 1 : 0) +
    (localFilters.dateTo ? 1 : 0) +
    (localFilters.security !== 'All' ? 1 : 0);

  const hasActiveFilters =
    advancedCount > 0 || localFilters.types.length > 0 || localFilters.status !== 'All';

  const updateFilter = (key, value) => {
    const next = { ...localFilters, [key]: value };
    setLocalFilters(next);
    setFilters(next);
  };

  const toggleType = (type) => {
    const current = localFilters.types;
    const nextTypes = type === 'All'
      ? []
      : current.includes(type)
        ? current.filter(t => t !== type)
        : [...current.filter(t => t !== 'All'), type];
    updateFilter('types', nextTypes);
  };

  const clearAll = () => {
    setLocalFilters(EMPTY);
    setFilters(EMPTY);
    setExpanded(false);
    if (onClear) onClear();
  };

  const dateInputs = (
    <>
      <input
        type="date"
        aria-label="From date"
        className={cn(dateClass, 'w-full md:w-[140px]')}
        value={localFilters.dateFrom}
        onChange={e => updateFilter('dateFrom', e.target.value)}
      />
      <input
        type="date"
        aria-label="To date"
        className={cn(dateClass, 'w-full md:w-[140px]')}
        value={localFilters.dateTo}
        onChange={e => updateFilter('dateTo', e.target.value)}
      />
    </>
  );

  const securitySelect = (
    <select
      aria-label="Security"
      className={cn(selectClass, 'w-full md:w-auto md:max-w-[180px]')}
      value={localFilters.security}
      onChange={e => updateFilter('security', e.target.value)}
    >
      <option value="All">All securities</option>
      {symbols.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  );

  return (
    <div className="sl-card p-2.5 md:p-3">
      <div className="flex items-center gap-2">
        {/* Scrolls horizontally on mobile so the segments never squash */}
        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
          <div className="hidden md:flex gap-2 shrink-0">{dateInputs}</div>
          <div className="hidden md:block shrink-0">{securitySelect}</div>

          <Segmented
            label="Alert type"
            options={['All', 'Support', 'Resistance', 'Breakout']}
            isActive={(o) => (o === 'All' ? localFilters.types.length === 0 : localFilters.types.includes(o))}
            onSelect={toggleType}
          />
          <Segmented
            label="Delivery status"
            options={['All', 'Delivered', 'Failed']}
            isActive={(o) => localFilters.status === o}
            onSelect={(o) => updateFilter('status', o)}
          />
        </div>

        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          className={cn(
            'sl-tap md:hidden shrink-0 h-9 px-2.5 rounded-[10px] flex items-center gap-1.5',
            'text-[12px] font-semibold transition-colors ring-1 ring-inset',
            expanded || advancedCount > 0
              ? 'bg-brand-blueSoft text-brand-blue ring-brand-blue/15'
              : 'bg-surface-muted text-text-secondary ring-slate-900/[0.04]'
          )}
        >
          <SlidersHorizontal size={14} />
          {advancedCount > 0 && <span className="tabular-nums">{advancedCount}</span>}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="hidden md:inline-flex items-center gap-1 ml-auto shrink-0 text-[12.5px] font-semibold text-text-secondary hover:text-signal-red transition-colors"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden"
          >
            <div className="pt-3 mt-2.5 border-t border-surface-hairline space-y-2.5">
              <div>
                <p className="sl-eyebrow mb-1.5">Date range</p>
                <div className="grid grid-cols-2 gap-2">{dateInputs}</div>
              </div>
              <div>
                <p className="sl-eyebrow mb-1.5">Security</p>
                {securitySelect}
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="sl-tap w-full h-9 rounded-[10px] bg-surface-muted text-[12.5px] font-semibold text-text-secondary hover:text-signal-red transition-colors flex items-center justify-center gap-1.5"
                >
                  <X size={13} /> Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
