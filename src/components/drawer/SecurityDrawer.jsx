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
            className={`fixed bg-white z-50 flex flex-col overflow-hidden shadow-drawer
              ${isMobile
                ? 'bottom-0 left-0 w-full h-[92vh] rounded-t-2xl'
                : 'top-0 right-0 h-full w-[460px]'
              }`}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag={isMobile ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(_, info) => { if (isMobile && info.offset.y > 100) closeDrawer() }}
          >
            {isMobile && (
              <div className="w-full flex justify-center mt-3 mb-2 shrink-0">
                <div className="w-9 h-1 bg-[#E4E7ED] rounded-full" />
              </div>
            )}

            <DrawerHeader />

            {/* Watchlist Toggle */}
            <div className="px-6 py-3 border-b border-surface-border flex items-center justify-between shrink-0">
              <span className="text-[13px] text-text-secondary">
                {isInWatchlist ? 'Saved to your watchlist' : 'Track this security in your watchlist'}
              </span>
              <button
                onClick={handleWatchlistToggle}
                disabled={watchlistPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors disabled:opacity-50
                  ${isInWatchlist
                    ? 'bg-brand-navy/10 text-brand-navy hover:bg-brand-navy/20'
                    : 'bg-brand-blue text-white hover:bg-brand-navy'
                  }`}
              >
                {isInWatchlist
                  ? <><BookmarkCheck size={14} /> In Watchlist</>
                  : <><BookmarkPlus size={14} /> Add to Watchlist</>
                }
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div
                    className="w-8 h-8 rounded-full border-[3px] border-surface-border border-t-brand-blue animate-spin"
                  />
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-surface-border">
                    <ChartTimeToggle activeTimeframe={activeTimeframe} onChange={setActiveTimeframe} />
                    <CandlestickChart activeTimeframe={activeTimeframe} />
                  </div>
                  <div className="p-6">
                    <AlertConfigForm />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
