import { useEffect, useState } from 'react';
import { BookMarked, Users, ArrowLeftRight, AlertTriangle, BookCheck } from 'lucide-react';
import { supabase, type Loan, type Book } from '@/lib/supabase';
import { PageHeader, Card, StatCard } from '@/components/Layout';
import { Badge } from '@/components/Badge';
import { type PageKey } from '@/components/Layout';

function daysUntil(dateStr: string): number {
  const today = new Date(new Date().toISOString().split('T')[0]);
  const due = new Date(dateStr);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function DashboardPage({ onNavigate }: { onNavigate: (key: PageKey) => void }) {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    totalReaders: 0,
    activeLoans: 0,
    overdueLoans: 0,
    returnedToday: 0,
  });
  const [recentLoans, setRecentLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [
        { count: totalBooks },
        { count: availableBooks },
        { count: totalReaders },
        { count: activeLoans },
        { count: overdueLoans },
        { data: todayReturns },
        { data: loanData },
      ] = await Promise.all([
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('available', true),
        supabase.from('readers').select('*', { count: 'exact', head: true }),
        supabase.from('loans').select('*', { count: 'exact', head: true }).is('return_date', null),
        supabase.from('loans').select('*', { count: 'exact', head: true }).is('return_date', null).lt('due_date', new Date().toISOString().split('T')[0]),
        supabase.from('loans').select('*', { count: 'exact', head: true }).eq('return_date', new Date().toISOString().split('T')[0]),
        supabase.from('loans').select('*, book:books(*), reader:readers(*)').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        totalBooks: totalBooks ?? 0,
        availableBooks: availableBooks ?? 0,
        totalReaders: totalReaders ?? 0,
        activeLoans: activeLoans ?? 0,
        overdueLoans: overdueLoans ?? 0,
        returnedToday: todayReturns?.[0]?.count ?? 0,
      });
      setRecentLoans((loanData as Loan[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Carregando...</div>;
  }

  return (
    <div>
      <PageHeader title="Painel" subtitle="Visão geral da biblioteca" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total de livros" value={stats.totalBooks} icon={<BookMarked className="h-6 w-6" />} color="emerald" />
        <StatCard label="Disponíveis" value={stats.availableBooks} icon={<BookCheck className="h-6 w-6" />} color="blue" />
        <StatCard label="Leitores cadastrados" value={stats.totalReaders} icon={<Users className="h-6 w-6" />} color="blue" />
        <StatCard label="Empréstimos ativos" value={stats.activeLoans} icon={<ArrowLeftRight className="h-6 w-6" />} color="emerald" />
        <StatCard label="Atrasados" value={stats.overdueLoans} icon={<AlertTriangle className="h-6 w-6" />} color="red" />
        <StatCard label="Devoluções hoje" value={stats.returnedToday} icon={<BookCheck className="h-6 w-6" />} color="amber" />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Empréstimos recentes</h2>
          <button onClick={() => onNavigate('loans')} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            Ver todos
          </button>
        </div>

        {recentLoans.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-400">
            Nenhum empréstimo registrado ainda.
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Livro</th>
                  <th className="px-4 py-3">Leitor</th>
                  <th className="hidden md:table-cell px-4 py-3">Empréstimo</th>
                  <th className="px-4 py-3">Devolução</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLoans.map((loan) => {
                  const isReturned = loan.return_date !== null;
                  const days = daysUntil(loan.due_date);
                  const isOverdue = !isReturned && days < 0;

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{loan.book?.title ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{loan.reader?.full_name ?? '—'}</td>
                      <td className="hidden md:table-cell px-4 py-3 text-slate-500">{new Date(loan.loan_date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(loan.due_date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3">
                        {isReturned ? <Badge color="blue">Devolvido</Badge> : isOverdue ? <Badge color="red">Atrasado</Badge> : <Badge color="green">Ativo</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
