import { useQuery } from '@tanstack/react-query'
import { useWatchlistStore } from '../store/useWatchlistStore'
import { useUserStore } from '../store/useUserStore'
import { supabase } from '../lib/supabase'

export function useDrawer() {
  const { drawerOpen, drawerSymbol, openDrawer, closeDrawer } = useWatchlistStore()
  const session = useUserStore(state => state.session)

  const { data: security, isLoading } = useQuery({
    queryKey: ['drawer-security', drawerSymbol, session?.user?.id],
    queryFn: async () => {
      if (!drawerSymbol) return null

      const [secResult, priceResult] = await Promise.all([
        supabase
          .from('securities')
          .select('symbol, company_name, sector')
          .eq('symbol', drawerSymbol)
          .single(),
        supabase
          .from('price_ticks')
          .select('last_price, change_pct, change_abs')
          .eq('symbol', drawerSymbol)
          .order('scraped_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ])

      const alertResult = session
        ? await supabase
            .from('alert_rules')
            .select('*')
            .eq('symbol', drawerSymbol)
            .eq('user_id', session.user.id)
            .maybeSingle()
        : { data: null, error: null }

      if (secResult.error) {
        console.error('Error fetching security:', secResult.error.message)
      }

      return {
        symbol: drawerSymbol,
        company_name: secResult.data?.company_name ?? drawerSymbol,
        sector: secResult.data?.sector ?? '—',
        price: priceResult.data?.last_price ?? null,
        change_pct: priceResult.data?.change_pct ?? null,
        change_abs: priceResult.data?.change_abs ?? null,
        alert_rule: alertResult.data ?? null
      }
    },
    enabled: !!drawerSymbol,
    staleTime: 30_000
  })

  return {
    drawerOpen,
    drawerSymbol,
    security: security ?? null,
    isLoading: isLoading && !!drawerSymbol,
    openDrawer,
    closeDrawer
  }
}
