import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useDrawer } from '../../hooks/useDrawer'
import { Badge } from '../ui/Badge'
import { PriceChange } from '../ui/PriceChange'
import { usePriceFlash } from '../../hooks/usePriceFlash'

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

  return (
    <div className="flex flex-col">
      <div className="h-[64px] px-6 flex flex-row items-center justify-between border-b border-surface-border shrink-0">

        {/* Left: Name + Symbol */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-row items-center gap-2 mb-0.5">
            <span className="text-[18px] font-bold text-text-primary truncate">
              {security.company_name}
            </span>
            <Badge variant="navy" className="shrink-0">{security.symbol}</Badge>
          </div>
          <div className="flex flex-row items-center gap-2">
            <span className="text-[12px] text-text-secondary">{security.sector}</span>
            <Badge variant="grey" className="text-[10px] py-0">PSX Main Board</Badge>
          </div>
        </div>

        {/* Center: Price */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {security.price != null ? (
            <>
              <div className={`text-[28px] leading-none font-bold tabular-nums text-text-primary transition-colors ${flashClass}`}>
                {security.price.toFixed(2)}
              </div>
              <div className="flex flex-row items-center gap-2 mt-1">
                <PriceChange value={security.change_pct} absolute={security.change_abs} />
                <span className="text-[11px] text-text-secondary">Updated {secondsAgo}s ago</span>
              </div>
            </>
          ) : (
            <span className="text-[14px] text-text-secondary">No price data</span>
          )}
        </div>

        {/* Right: Close */}
        <div className="flex-1 flex justify-end">
          <button
            onClick={closeDrawer}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-surface-page hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Market detail strip — static labels, DB does not expose these fields */}
      <div className="px-6 py-2 flex flex-row items-center gap-6 bg-surface-muted border-b border-surface-border overflow-x-auto no-scrollbar">
        <DetailItem label="52W High" value={null} />
        <div className="w-[1px] h-3 bg-surface-border" />
        <DetailItem label="52W Low" value={null} />
        <div className="w-[1px] h-3 bg-surface-border" />
        <DetailItem label="Mkt Cap" value={null} />
        <div className="w-[1px] h-3 bg-surface-border" />
        <DetailItem label="P/E" value={null} />
        <div className="w-[1px] h-3 bg-surface-border" />
        <DetailItem label="Avg Vol" value={null} />
      </div>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="flex flex-row items-center gap-1.5 whitespace-nowrap">
      <span className="text-[10px] uppercase text-text-secondary font-medium tracking-wide">{label}</span>
      <span className="text-[12px] font-bold text-text-primary">{value ?? '—'}</span>
    </div>
  )
}
