import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookmarkPlus, BookmarkCheck } from 'lucide-react'
import { useDrawer } from '../../hooks/useDrawer'
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '../../hooks/queries/useWatchlistQuery'
import { DrawerOverlay } from './DrawerOverlay'
import { DrawerHeader } from './DrawerHeader'
import { ChartTimeToggle } from './ChartTimeToggle'
import { CandlestickChart } from './CandlestickChart'
import { AlertConfigForm } from './AlertConfigForm'
import { cn } from '../../lib/utils'

export function SecurityDrawer() {
  const { drawerOpen, drawerSymbol, isLoading, closeDrawer } = useDrawer()
  const [activeTimeframe, setActiveTimeframe] = useState('1M')

  const { data: watchlist } = useWatchlist()
  const addMutation = useAddToWatchlist()
  const removeMutation = useRemoveFromWatchlist()
  const isInWatchlist = watchlist?.some(w => w.symbol === drawerSymbol) ?? false
  const watchlistPending = addMutation.isPending || removeMutation.isPending

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeDrawer])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const variants = {
    hidden: isMobile ? { y: '100%' } : { x: '100%' },
    visible: isMobile ? { y: 0 } : { x: 0 },
    exit: isMobile ? { y: '100%' } : { x: '100%' }
  }

  const handleWatchlistToggle = () => {
    if (!drawerSymbol) return
    if (isInWatchlist) {
      removeMutation.mutate(drawerSymbol)
    } else {
      addMutation.mutate(drawerSymbol)
    }
  }

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <DrawerOverlay onClick={closeDrawer} />
          <motion.div
            className={cn(
              'fixed bg-surface-card z-[60] flex flex-col overflow-hidden shadow-drawer',
              isMobile
                ? 'bottom-0 left-0 w-full h-[93dvh] rounded-t-[24px]'
                : 'top-0 right-0 h-full w-[480px] border-l border-surface-hairline'
            )}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag={isMobile ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              // Flick-to-dismiss as well as drag-past-threshold
              if (isMobile && (info.offset.y > 110 || info.velocity.y > 700)) closeDrawer()
            }}
          >
            {isMobile && (
              <div className="w-full flex justify-center pt-2.5 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 bg-surface-border rounded-full" />
              </div>
            )}

            <DrawerHeader />

            {/* Watchlist toggle */}
            <div className="px-5 py-2.5 border-b border-surface-hairline flex items-center justify-between gap-3 shrink-0 bg-surface-card">
              <span className="text-[12.5px] text-text-secondary min-w-0 truncate">
                {isInWatchlist ? 'Saved to your watchlist' : 'Track this security'}
              </span>
              <button
                onClick={handleWatchlistToggle}
                disabled={watchlistPending}
                className={cn(
                  'sl-tap flex items-center gap-1.5 px-3 h-9 rounded-pill text-[12.5px] font-semibold shrink-0',
                  'transition-all duration-200 disabled:opacity-50',
                  isInWatchlist
                    ? 'bg-surface-muted text-brand-navy ring-1 ring-inset ring-slate-900/[0.06] hover:bg-surface-border'
                    : 'bg-blue-gradient text-white shadow-cta hover:brightness-105'
                )}
              >
                {isInWatchlist
                  ? <><BookmarkCheck size={14} /> In Watchlist</>
                  : <><BookmarkPlus size={14} /> Add to Watchlist</>
                }
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scroll-touch overscroll-none-y">
              {isLoading ? (
                <div className="flex items-center justify-center h-56">
                  <div className="w-8 h-8 rounded-full border-[3px] border-surface-border border-t-brand-blue animate-spin" />
                </div>
              ) : (
                <>
                  <div className="p-5 border-b border-surface-hairline">
                    <ChartTimeToggle activeTimeframe={activeTimeframe} onChange={setActiveTimeframe} />
                    <CandlestickChart activeTimeframe={activeTimeframe} />
                  </div>
                  <AlertConfigForm />
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
