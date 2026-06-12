import { memo } from 'react'
import { Badge } from '../ui/Badge'
import { PriceChange } from '../ui/PriceChange'
import { Button } from '../ui/Button'
import { AlertLevelBadge } from './AlertLevelBadge'
import { usePriceFlash } from '../../hooks/usePriceFlash'
import { useWatchlistStore } from '../../store/useWatchlistStore'

// Distance from the live price to the nearest enabled alert level,
// so users can see which alerts are close to firing
const getNearestLevel = (price, rule) => {
  if (price == null || !rule) return null
  const levels = []
  if (rule.support_enabled && rule.support_level) levels.push({ type: 'support', level: rule.support_level })
  if (rule.resistance_enabled && rule.resistance_level) levels.push({ type: 'resistance', level: rule.resistance_level })
  if (rule.breakout_enabled && rule.breakout_level) levels.push({ type: 'breakout', level: rule.breakout_level })
  if (levels.length === 0) return null

  let nearest = null
  for (const l of levels) {
    const pct = ((price - l.level) / l.level) * 100
    if (!nearest || Math.abs(pct) < Math.abs(nearest.pct)) nearest = { ...l, pct }
  }
  return nearest
}

const WatchlistRowInner = ({ item }) => {
  const openDrawer = useWatchlistStore(state => state.openDrawer)
  const { flashClass } = usePriceFlash(item.price)

  const name = item.securities?.company_name ?? item.symbol
  const sector = item.securities?.sector ?? '—'
  const rule = item.alert_rule
  const nearest = getNearestLevel(item.price, rule)

  return (
    <div
      className="group flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 border-b border-surface-border last:border-b-0 hover:border-brand-navy hover:shadow-card cursor-pointer transition-all duration-150 bg-surface-card"
      onClick={() => openDrawer(item.symbol)}
    >
      <div className="text-surface-border group-hover:text-text-secondary transition-colors cursor-grab hidden sm:block opacity-0 group-hover:opacity-100">
        ⠿
      </div>

      <div className="flex-1 min-w-[150px]">
        <p className="font-semibold text-[15px] text-text-primary truncate">{name}</p>
        <p className="text-xs text-text-secondary font-mono">{item.symbol}</p>
      </div>

      <div className="hidden md:block w-[120px]">
        <Badge variant="grey">{sector}</Badge>
      </div>

      <div className="flex-1 flex justify-between sm:justify-end items-center sm:gap-6">
        <div className="text-right">
          <p className={`text-price-sm font-bold tabular-nums text-text-primary rounded-sm px-1 -mx-1 transition-colors ${flashClass}`}>
            {item.price != null ? item.price.toFixed(2) : '—'}
          </p>
          {nearest && (
            <p className={`text-[11px] tabular-nums whitespace-nowrap ${Math.abs(nearest.pct) < 1 ? 'text-signal-amber font-medium' : 'text-text-secondary'}`}>
              {Math.abs(nearest.pct).toFixed(1)}% {nearest.pct >= 0 ? 'above' : 'below'} {nearest.type}
            </p>
          )}
        </div>
        <div className="w-[80px] text-right">
          <PriceChange value={item.change_pct ?? null} absolute={item.change_abs ?? null} />
        </div>
      </div>

      <div className="w-full sm:w-[240px] flex gap-1.5 flex-wrap shrink-0">
        <AlertLevelBadge
          type="support"
          level={rule?.support_level ?? null}
          enabled={rule?.support_enabled ?? false}
          triggered={false}
        />
        <AlertLevelBadge
          type="resistance"
          level={rule?.resistance_level ?? null}
          enabled={rule?.resistance_enabled ?? false}
          triggered={false}
        />
        <AlertLevelBadge
          type="breakout"
          level={rule?.breakout_level ?? null}
          enabled={rule?.breakout_enabled ?? false}
          triggered={false}
        />
      </div>

      <div className="hidden lg:block w-[120px] text-right opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="text-brand-blue hover:text-brand-navy"
          onClick={(e) => { e.stopPropagation(); openDrawer(item.symbol) }}
        >
          View Details →
        </Button>
      </div>
    </div>
  )
}

// Re-render only when the live price or the alert rule actually changes
export const WatchlistRow = memo(WatchlistRowInner, (prev, next) =>
  prev.item.symbol === next.item.symbol &&
  prev.item.price === next.item.price &&
  prev.item.change_pct === next.item.change_pct &&
  prev.item.alert_rule === next.item.alert_rule
)
