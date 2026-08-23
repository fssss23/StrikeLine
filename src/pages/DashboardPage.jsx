import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SearchBar } from '../components/search/SearchBar';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { WatchlistTable } from '../components/watchlist/WatchlistTable';
import { useWatchlist } from '../hooks/queries/useWatchlistQuery';
import { useUserStore } from '../store/useUserStore';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { data: watchlist } = useWatchlist();
  const user = useUserStore(state => state.user);
  const watchlistCount = (watchlist || []).length;

  const firstName = (user?.display_name || user?.email?.split('@')[0] || '')
    .split(' ')[0]
    .replace(/^./, c => c.toUpperCase());

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Greeting — mobile only; desktop already has the TopBar page title */}
      <div className="md:hidden mb-4">
        <p className="sl-eyebrow mb-1">{greeting()}{firstName ? `, ${firstName}` : ''}</p>
        <h2 className="text-[22px] font-bold text-text-primary tracking-tighter leading-tight">
          Your PSX levels, live.
        </h2>
      </div>

      <div className="mb-5 md:mb-7">
        <SearchBar />
      </div>

      <SummaryCards />

      <section className="mt-7 md:mt-9">
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-[17px] md:text-lg font-bold text-text-primary tracking-tighter">
              My Watchlist
            </h2>
            <span className="bg-surface-muted text-text-secondary text-[11.5px] font-bold px-2 py-0.5 rounded-pill tabular-nums ring-1 ring-inset ring-slate-900/[0.05]">
              {watchlistCount}
            </span>
          </div>
          <Link
            to="/watchlist"
            className="sl-tap group inline-flex items-center gap-1 text-[13px] font-semibold text-brand-blue hover:text-brand-navy transition-colors shrink-0"
          >
            Manage
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <WatchlistTable />
      </section>
    </div>
  );
}
