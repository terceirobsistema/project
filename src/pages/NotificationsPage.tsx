import { useEffect, useState } from 'react';
import { Bell, AlertTriangle, CalendarClock, BookCheck, Info } from 'lucide-react';
import { supabase, type Loan, type Book, type Reader, type Reservation } from '@/lib/supabase';
import { PageHeader, Card } from '@/components/Layout';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';

type NotificationItem = {
  id: string;
  type: 'overdue' | 'due-soon' | 'returned' | 'reservation-available';
  title: string;
  message: string;
  date: string;
  readerName?: string;
  bookTitle?: string;
};

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function daysUntil(dateStr: string): number {
  const today = new Date(todayISO());
  const due = new Date(dateStr);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function NotificationsPage({ refreshKey }: { refreshKey: number }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    const [
      { data: loanData },
      { data: bookData },
      { data: readerData },
      { data: reservationData },
    ] = await Promise.all([
      supabase.from('loans').select('*, book:books(*), reader:readers(*)').order('created_at', { ascending: false }),
      supabase.from('books').select('*'),
      supabase.from('readers').select('*'),
      supabase.from('reservations').select('*, book:books(*), reader:readers(*)').order('created_at', { ascending: false }),
    ]);

    const loans = (loanData as Loan[]) ?? [];
    const books = (bookData as Book[]) ?? [];
    const readers = (readerData as Reader[]) ?? [];
    const reservations = (reservationData as Reservation[]) ?? [];

    const readerMap = new Map(readers.map((r) => [r.id, r]));
    const bookMap = new Map(books.map((b) => [b.id, b]));

    const items: NotificationItem[] = [];

    loans.forEach((loan) => {
      const book = loan.book ?? bookMap.get(loan.book_id);
      const reader = loan.reader ?? readerMap.get(loan.reader_id);

      if (loan.return_date !== null) {
        items.push({
          id: `returned-${loan.id}`,
          type: 'returned',
          title: 'Livro devolvido',
          message: `"${book?.title ?? 'Livro'}" foi devolvido por ${reader?.full_name ?? 'leitor'} e já está disponível.`,
          date: loan.return_date,
          readerName: reader?.full_name,
          bookTitle: book?.title,
        });
      } else {
        const days = daysUntil(loan.due_date);
        if (days < 0) {
          items.push({
            id: `overdue-${loan.id}`,
            type: 'overdue',
            title: `Empréstimo atrasado — ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`,
            message: `${reader?.full_name ?? 'Leitor'} está com "${book?.title ?? 'livro'}" atrasado. A devolução era prevista para ${new Date(loan.due_date).toLocaleDateString('pt-BR')}.`,
            date: loan.due_date,
            readerName: reader?.full_name,
            bookTitle: book?.title,
          });
        } else if (days <= 3) {
          items.push({
            id: `due-soon-${loan.id}`,
            type: 'due-soon',
            title: days === 0 ? 'Devolução vence hoje' : `Devolução em ${days} dia${days !== 1 ? 's' : ''}`,
            message: `${reader?.full_name ?? 'Leitor'} deve devolver "${book?.title ?? 'livro'}" até ${new Date(loan.due_date).toLocaleDateString('pt-BR')}.`,
            date: loan.due_date,
            readerName: reader?.full_name,
            bookTitle: book?.title,
          });
        }
      }
    });

    reservations.forEach((res) => {
      if (res.fulfilled || res.cancelled) return;
      const book = res.book ?? bookMap.get(res.book_id);
      if (book?.available) {
        const reader = res.reader ?? readerMap.get(res.reader_id);
        items.push({
          id: `res-${res.id}`,
          type: 'reservation-available',
          title: 'Reserva disponível',
          message: `"${book.title}" já está disponível para ${reader?.full_name ?? 'leitor'} retirar.`,
          date: todayISO(),
          readerName: reader?.full_name,
          bookTitle: book.title,
        });
      }
    });

    items.sort((a, b) => {
      const order = { overdue: 0, 'due-soon': 1, 'reservation-available': 2, returned: 3 };
      return order[a.type] - order[b.type] || a.date.localeCompare(b.date);
    });

    setNotifications(items);
    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshKey]);

  const iconFor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'overdue': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'due-soon': return <CalendarClock className="h-5 w-5 text-amber-600" />;
      case 'returned': return <BookCheck className="h-5 w-5 text-blue-600" />;
      case 'reservation-available': return <Info className="h-5 w-5 text-emerald-600" />;
    }
  };

  const bgFor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'overdue': return 'border-l-red-500 bg-red-50/50';
      case 'due-soon': return 'border-l-amber-500 bg-amber-50/50';
      case 'returned': return 'border-l-blue-500 bg-blue-50/50';
      case 'reservation-available': return 'border-l-emerald-500 bg-emerald-50/50';
    }
  };

  const labelFor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'overdue': return <Badge color="red">Atraso</Badge>;
      case 'due-soon': return <Badge color="yellow">Aproximando</Badge>;
      case 'returned': return <Badge color="blue">Devolução</Badge>;
      case 'reservation-available': return <Badge color="green">Reserva</Badge>;
    }
  };

  return (
    <div>
      <PageHeader
        title="Notificações"
        subtitle="Avisos de prazos de devolução, atrasos e disponibilidade de reservas"
        action={<Button variant="secondary" onClick={load}>Atualizar</Button>}
      />

      {loading ? (
        <div className="py-20 text-center text-slate-400">Carregando...</div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title="Nenhuma notificação"
          message="Não há prazos próximos, atrasos ou reservas disponíveis no momento."
        />
      ) : (
        <div className="grid gap-3">
          {notifications.map((n) => (
            <Card key={n.id} className={`border-l-4 p-4 ${bgFor(n.type)}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{iconFor(n.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{n.title}</span>
                    {labelFor(n.type)}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
