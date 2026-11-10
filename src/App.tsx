import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase, type Loan } from '@/lib/supabase';
import { LoginPage } from '@/pages/LoginPage';
import { Layout, type PageKey } from '@/components/Layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { BooksPage } from '@/pages/BooksPage';
import { ReadersPage } from '@/pages/ReadersPage';
import { LoansPage } from '@/pages/LoansPage';
import { NotificationsPage } from '@/pages/NotificationsPage';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function AppContent() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [notifCount, setNotifCount] = useState(0);
  const [notifRefreshKey, setNotifRefreshKey] = useState(0);

  useEffect(() => {
    if (!session) return;

    const calcCount = async () => {
      const { data } = await supabase
        .from('loans')
        .select('due_date, return_date')
        .is('return_date', null);

      let count = 0;
      (data ?? []).forEach((loan: Pick<Loan, 'due_date' | 'return_date'>) => {
        const due = new Date(loan.due_date);
        const today = new Date(todayISO());
        const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 3) count++;
      });
      setNotifCount(count);
    };

    calcCount();
  }, [session, page]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  const handleNavigate = (key: PageKey) => {
    setPage(key);
    if (key === 'notifications') setNotifRefreshKey((k) => k + 1);
  };

  return (
    <Layout current={page} onNavigate={handleNavigate} notificationCount={notifCount}>
      {page === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
      {page === 'books' && <BooksPage />}
      {page === 'readers' && <ReadersPage />}
      {page === 'loans' && <LoansPage />}
      {page === 'notifications' && <NotificationsPage refreshKey={notifRefreshKey} />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
