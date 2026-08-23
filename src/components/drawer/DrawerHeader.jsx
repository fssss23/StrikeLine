import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useDrawer } from '../../hooks/useDrawer'
import { PriceChange } from '../ui/PriceChange'
import { usePriceFlash } from '../../hooks/usePriceFlash'
import { cn } from '../../lib/utils'

function formatVolume(v) {
  if (v == null) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return String(v)
}

export function DrawerHeader() {
  const { security, closeDrawer } = useDrawer()
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [prevPrice, setPrevPrice] = useState(security?.price)

  useEffect(() => {
    if (security?.price !== prevPrice) {
      setSecondsAgo(0)
      setPrevPrice(security?.price)
    }
  }, [security?.price, prevPrice])

  useEffect(() => {
    const interval = setInterval(() => setSecondsAgo(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const { flashClass } = usePriceFlash(security?.price)

  if (!security) return null

  const stats = [
    { label: 'Open', value: security.open_price != null ? security.open_price.toFixed(2) : '—' },
    { label: 'High', value: security.high_price != null ? security.high_price.toFixed(2) : '—' },
    { label: 'Low', value: security.low_price != null ? security.low_price.toFixed(2) : '—' },
    { label: 'Volume', value: formatVolume(security.volume) },
  ]

  return (
    <div className="flex flex-col shrink-0">
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-1.5 h-[20px] rounded-md bg-brand-navy text-white text-[11px] font-bold tracking-tight shrink-0">
                {security.symbol}
              </span>
              <span className="text-[11.5px] text-text-tertiary truncate">{security.sector}</span>
            </div>
            <h2 className="text-[17px] font-bold text-text-primary tracking-tighter leading-snug line-clamp-2">
              {security.company_name}
            </h2>
          </div>

          <button
            onClick={closeDrawer}
            aria-label="Close"
            className="sl-tap w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors shrink-0 -mt-1 -mr-1"
          >
            <X size={19} />
          </button>
        </div>

        {security.price != null ? (
          <div className="flex items-end gap-3 mt-4 flex-wrap">
            <div className={cn('text-[34px] leading-none font-bold sl-num text-text-primary rounded px-1 -mx-1 transition-colors', flashClass)}>
              {security.price.toFixed(2)}
            </div>
            <div className="flex items-center gap-2.5 pb-0.5">
              <PriceChange
                value={security.change_pct}
                absolute={security.change_abs}
                layout="inline"
                size="md"
              />
              <span className="text-[11px] text-text-tertiary sl-num whitespace-nowrap">
                {secondsAgo}s ago
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[13.5px] text-text-secondary mt-4">No price data available yet</p>
        )}
      </div>

      {/* Session stats straight from the latest tick */}
      <div className="grid grid-cols-4 bg-surface-sunken border-y border-surface-hairline">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={cn('px-3 py-2.5 min-w-0', i > 0 && 'border-l border-surface-hairline')}
          >
            <p className="sl-eyebrow leading-none mb-1.5">{s.label}</p>
            <p className="text-[12.5px] font-bold sl-num text-text-primary truncate">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
