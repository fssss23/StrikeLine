import { WatchlistTable } from '../components/watchlist/WatchlistTable'

export default function WatchlistPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[22px] font-bold text-text-primary">My Watchlist</h1>
      <WatchlistTable />
    </div>
  )
}
