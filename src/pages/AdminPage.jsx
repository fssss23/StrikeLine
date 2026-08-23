import { RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorState } from '../components/ui/States';
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
        <ErrorState
          title="Couldn't load admin data"
          message={overview.error?.message}
          onRetry={refetchAll}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto w-full">
      <PageHeader
        eyebrow="Operations"
        title="Admin"
        subtitle="System health, global alert controls, and user management."
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={refetchAll}
            loading={overview.isFetching && !overview.isLoading}
          >
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        }
      />

      <div className="space-y-4 md:space-y-5">
        <AdminStats stats={overview.data?.stats} scraper={overview.data?.scraper} />
        <AdminControls settings={overview.data?.settings} />
        <AdminUsersTable users={users.data?.users} isLoading={users.isLoading} />
        <AdminRecentEvents events={events.data?.events} isLoading={events.isLoading} />
      </div>
    </div>
  );
}
