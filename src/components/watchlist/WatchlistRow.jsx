import { memo } from 'react'
import { ChevronRight } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { PriceChange } from '../ui/PriceChange'
import { AlertLevelBadge } from './AlertLevelBadge'
import { usePriceFlash } from '../../hooks/usePriceFlash'
import { useWatchlistStore } from '../../store/useWatchlistStore'
import { cn } from '../../lib/utils'

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

const NearestNote = ({ nearest, className }) => {
  if (!nearest) return null
  const close = Math.abs(nearest.pct) < 1
  return (
    <span
      className={cn(
        'sl-num text-[11px] whitespace-nowrap',
        close ? 'text-signal-amber font-semibold' : 'text-text-tertiary',
        className
      )}
    >
      {close && <span className="mr-1" aria-hidden="true">●</span>}
      {Math.abs(nearest.pct).toFixed(1)}% {nearest.pct >= 0 ? 'above' : 'below'} {nearest.type}
    </span>
  )
}

const LevelChips = ({ rule, className }) => (
  <div className={cn('flex gap-1.5', className)}>
    <AlertLevelBadge type="support" level={rule?.support_level ?? null} enabled={rule?.support_enabled ?? false} triggered={false} />
    <AlertLevelBadge type="resistance" level={rule?.resistance_level ?? null} enabled={rule?.resistance_enabled ?? false} triggered={false} />
    <AlertLevelBadge type="breakout" level={rule?.breakout_level ?? null} enabled={rule?.breakout_enabled ?? false} triggered={false} />
  </div>
)

const WatchlistRowInner = ({ item }) => {
  const openDrawer = useWatchlistStore(state => state.openDrawer)
  const { flashClass } = usePriceFlash(item.price)

  const name = item.securities?.company_name ?? item.symbol
  const sector = item.securities?.sector ?? '—'
  const rule = item.alert_rule
  const nearest = getNearestLevel(item.price, rule)
  const priceText = item.price != null ? item.price.toFixed(2) : '—'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openDrawer(item.symbol)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrawer(item.symbol) } }}
      className={cn(
        'group cursor-pointer tap-none outline-none transition-all duration-200 ease-swift',
        // Mobile: a standalone card. Desktop: a flush row inside the table card.
        'bg-surface-card rounded-xcard border border-surface-hairline shadow-card',
        'active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-brand-blue/35',
        'md:rounded-none md:border-0 md:border-b md:border-surface-hairline md:shadow-none',
        'md:last:border-b-0 md:active:scale-100 md:hover:bg-surface-page/70'
      )}
    >
      {/* ---------------- Mobile ---------------- */}
      <div className="md:hidden p-3.5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-brand-navy tracking-tight">{item.symbol}</span>
              <span className="text-text-tertiary text-[11px]">·</span>
              <span className="text-[11px] text-text-tertiary truncate">{sector}</span>
            </div>
            <p className="text-[14px] font-semibold text-text-primary truncate mt-0.5 tracking-tightish">
              {name}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className={cn('text-[20px] leading-none font-bold sl-num text-text-primary rounded px-1 -mx-1 transition-colors', flashClass)}>
              {priceText}
            </p>
            <PriceChange
              value={item.change_pct ?? null}
              absolute={item.change_abs ?? null}
              layout="inline"
              className="justify-end mt-1.5"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-hairline">
          <LevelChips rule={rule} className="overflow-x-auto no-scrollbar flex-1 min-w-0" />
          {nearest && <NearestNote nearest={nearest} className="shrink-0" />}
        </div>
      </div>

      {/* ---------------- Desktop ---------------- */}
      <div className="hidden md:flex items-center gap-4 px-5 py-3.5">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14.5px] text-text-primary truncate tracking-tightish">{name}</p>
          <p className="text-[12px] text-text-tertiary font-medium tracking-wide mt-0.5">{item.symbol}</p>
        </div>

        <div className="hidden lg:block w-[128px] shrink-0">
          <Badge variant="grey" className="max-w-full truncate">{sector}</Badge>
        </div>

        <div className="w-[120px] text-right shrink-0">
          <p className={cn('text-[18px] leading-none font-bold sl-num text-text-primary rounded px-1 -mx-1 transition-colors', flashClass)}>
            {priceText}
          </p>
          <NearestNote nearest={nearest} className="block mt-1" />
        </div>

        <div className="w-[86px] shrink-0">
          <PriceChange value={item.change_pct ?? null} absolute={item.change_abs ?? null} />
        </div>

        <LevelChips rule={rule} className="w-[248px] shrink-0 justify-end" />

        <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
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
