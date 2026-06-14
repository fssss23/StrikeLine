import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AdminStats } from '../components/admin/AdminStats';
import { AdminControls } from '../components/admin/AdminControls';
import { AdminUsersTable } from '../components/admin/AdminUsersTable';
import { AdminRecentEvents } from '../components/admin/AdminRecentEvents';
import { useAdminOverview, useAdminUsers, useAdminRecentEvents } from '../hooks/queries/useAdminQuery';

export default function AdminPage() {
  const overview = useAdminOverview();
  const users = useAdminUsers();
  const events = useAdminRecentEvents();

  const refetchAll = () => {
    overview.refetch();
    users.refetch();
    events.refetch();
  };

  if (overview.isError) {
    return (
      <div className="max-w-[1200px] mx-auto w-full">
        <div className="bg-white border border-signal-red/30 rounded-[12px] p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-signal-red mx-auto mb-3" />
          <h2 className="text-lg font-bold text-text-primary mb-1">Couldn't load admin data</h2>
          <p className="text-sm text-text-secondary mb-4">{overview.error?.message}</p>
          <Button variant="primary" onClick={refetchAll}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin</h1>
          <p className="text-text-secondary text-sm mt-1">
            System health, global alert controls, and user management.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={refetchAll}>
          Refresh
        </Button>
      </div>

      <AdminStats stats={overview.data?.stats} scraper={overview.data?.scraper} />

      <AdminControls settings={overview.data?.settings} />

      <AdminUsersTable users={users.data?.users} isLoading={users.isLoading} />

      <AdminRecentEvents events={events.data?.events} isLoading={events.isLoading} />
    </div>
  );
}
