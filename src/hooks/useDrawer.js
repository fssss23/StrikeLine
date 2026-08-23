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
          // open/high/low/volume come from the same tick row the price does —
          // they feed the session strip in the drawer header.
          .select('last_price, change_pct, change_abs, open_price, high_price, low_price, volume, scraped_at')
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
        open_price: priceResult.data?.open_price ?? null,
        high_price: priceResult.data?.high_price ?? null,
        low_price: priceResult.data?.low_price ?? null,
        volume: priceResult.data?.volume ?? null,
        scraped_at: priceResult.data?.scraped_at ?? null,
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
