import { useEffect, useState } from 'react';
import { ArrowLeftRight, Plus, BookCheck, Calendar, AlertTriangle } from 'lucide-react';
import { supabase, type Loan, type Book, type Reader } from '@/lib/supabase';
import { PageHeader, Card } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Modal } from '@/components/Modal';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysUntil(dateStr: string): number {
  const today = new Date(todayISO());
  const due = new Date(dateStr);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');
  const [form, setForm] = useState({ book_id: '', reader_id: '', due_date: addDaysISO(14) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('loans')
      .select('*, book:books(*), reader:readers(*)')
      .order('created_at', { ascending: false });
    setLoans((data as Loan[]) ?? []);

    const { data: bookData } = await supabase.from('books').select('*').eq('available', true).order('title');
    setBooks(bookData ?? []);

    const { data: readerData } = await supabase.from('readers').select('*').order('full_name');
    setReaders(readerData ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ book_id: '', reader_id: '', due_date: addDaysISO(14) });
    setError(null);
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!form.book_id || !form.reader_id || !form.due_date) {
      setError('Selecione o livro, o leitor e a data de devolução.');
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from('loans').insert({
      book_id: form.book_id,
      reader_id: form.reader_id,
      loan_date: todayISO(),
      due_date: form.due_date,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    await supabase.from('books').update({ available: false }).eq('id', form.book_id);

    setModalOpen(false);
    load();
  };

  const returnBook = async (loan: Loan) => {
    const returnDate = todayISO();
    await supabase.from('loans').update({ return_date: returnDate }).eq('id', loan.id);
    await supabase.from('books').update({ available: true }).eq('id', loan.book_id);
    load();
  };

  const filtered = loans.filter((loan) => {
    if (filter === 'all') return true;
    if (filter === 'returned') return loan.return_date !== null;
    if (filter === 'active') return loan.return_date === null && daysUntil(loan.due_date) >= 0;
    if (filter === 'overdue') return loan.return_date === null && daysUntil(loan.due_date) < 0;
    return true;
  });

  const filterTabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'active', label: 'Ativos' },
    { key: 'overdue', label: 'Atrasados' },
    { key: 'returned', label: 'Devolvidos' },
  ];

  return (
    <div>
      <PageHeader
        title="Empréstimos"
        subtitle="Registre empréstimos e devoluções de livros"
        action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Novo empréstimo</Button>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="h-12 w-12" />}
          title="Nenhum empréstimo"
          message="Registre um novo empréstimo para começar."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((loan) => {
            const isReturned = loan.return_date !== null;
            const days = daysUntil(loan.due_date);
            const isOverdue = !isReturned && days < 0;

            return (
              <Card key={loan.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{loan.book?.title ?? 'Livro removido'}</span>
                      {isReturned ? (
                        <Badge color="blue">Devolvido</Badge>
                      ) : isOverdue ? (
                        <Badge color="red">Atrasado ({Math.abs(days)} dia{Math.abs(days) !== 1 ? 's' : ''})</Badge>
                      ) : days === 0 ? (
                        <Badge color="yellow">Vence hoje</Badge>
                      ) : (
                        <Badge color="green">Faltam {days} dia{days !== 1 ? 's' : ''}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>Leitor: <span className="text-slate-700">{loan.reader?.full_name ?? 'Removido'}</span></span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Empréstimo: {new Date(loan.loan_date).toLocaleDateString('pt-BR')}</span>
                      <span>Devolução prevista: {new Date(loan.due_date).toLocaleDateString('pt-BR')}</span>
                      {isReturned && <span>Devolvido em: {new Date(loan.return_date!).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>

                  {!isReturned && (
                    <Button variant="secondary" onClick={() => returnBook(loan)} className="shrink-0">
                      <BookCheck className="h-4 w-4" /> Registrar devolução
                    </Button>
                  )}
                </div>

                {isOverdue && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Este empréstimo está atrasado. Entre em contato com o leitor para a devolução.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} title="Novo empréstimo" onClose={() => setModalOpen(false)}>
        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Livro</label>
            <select
              required
              value={form.book_id}
              onChange={(e) => setForm({ ...form, book_id: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Selecione um livro disponível...</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>{book.title} — {book.author}</option>
              ))}
            </select>
            {books.length === 0 && <span className="text-xs text-amber-600">Não há livros disponíveis no acervo.</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Leitor</label>
            <select
              required
              value={form.reader_id}
              onChange={(e) => setForm({ ...form, reader_id: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Selecione um leitor...</option>
              {readers.map((reader) => (
                <option key={reader.id} value={reader.id}>{reader.full_name}</option>
              ))}
            </select>
            {readers.length === 0 && <span className="text-xs text-amber-600">Cadastre leitores primeiro.</span>}
          </div>

          <Field label="Data prevista de devolução" type="date" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving || books.length === 0 || readers.length === 0}>
              {saving ? 'Salvando...' : 'Registrar empréstimo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
