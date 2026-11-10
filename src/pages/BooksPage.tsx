import { useEffect, useState } from 'react';
import { BookMarked, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { supabase, type Book } from '@/lib/supabase';
import { PageHeader, Card } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Modal } from '@/components/Modal';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';

export function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [form, setForm] = useState({ title: '', author: '', publisher: '', publication_year: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let query = supabase.from('books').select('*').order('created_at', { ascending: false });
    if (search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,author.ilike.%${search.trim()}%`);
    }
    const { data } = await query;
    setBooks(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', author: '', publisher: '', publication_year: '' });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (book: Book) => {
    setEditing(book);
    setForm({
      title: book.title,
      author: book.author,
      publisher: book.publisher ?? '',
      publication_year: book.publication_year?.toString() ?? '',
    });
    setError(null);
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      publisher: form.publisher.trim() || null,
      publication_year: form.publication_year ? parseInt(form.publication_year, 10) : null,
    };

    if (!payload.title || !payload.author) {
      setError('Título e autor são obrigatórios.');
      setSaving(false);
      return;
    }

    if (editing) {
      const { error } = await supabase.from('books').update(payload).eq('id', editing.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('books').insert(payload);
      if (error) setError(error.message);
    }

    if (!error || !editing) {
      setModalOpen(false);
      load();
    }
    setSaving(false);
  };

  const remove = async (book: Book) => {
    if (!confirm(`Remover "${book.title}"?`)) return;
    await supabase.from('books').delete().eq('id', book.id);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Acervo"
        subtitle="Cadastre e consulte os livros da biblioteca"
        action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Novo livro</Button>}
      />

      <div className="mb-5 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por título ou autor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Carregando...</div>
      ) : books.length === 0 ? (
        <EmptyState
          icon={<BookMarked className="h-12 w-12" />}
          title="Nenhum livro cadastrado"
          message="Clique em 'Novo livro' para começar."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Autor</th>
                <th className="hidden md:table-cell px-4 py-3">Editora</th>
                <th className="hidden md:table-cell px-4 py-3">Ano</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{book.title}</td>
                  <td className="px-4 py-3 text-slate-600">{book.author}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-slate-500">{book.publisher ?? '—'}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-slate-500">{book.publication_year ?? '—'}</td>
                  <td className="px-4 py-3">
                    {book.available ? <Badge color="green">Disponível</Badge> : <Badge color="red">Emprestado</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(book)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(book)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modalOpen} title={editing ? 'Editar livro' : 'Novo livro'} onClose={() => setModalOpen(false)}>
        <form onSubmit={save} className="flex flex-col gap-4">
          <Field label="Título" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Dom Casmurro" />
          <Field label="Autor" required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Ex: Machado de Assis" />
          <Field label="Editora" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} placeholder="Ex: Editora Ática" />
          <Field label="Ano de publicação" type="number" value={form.publication_year} onChange={(e) => setForm({ ...form, publication_year: e.target.value })} placeholder="Ex: 1899" />
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
