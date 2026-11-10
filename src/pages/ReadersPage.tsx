import { useEffect, useState } from 'react';
import { Users, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { supabase, type Reader } from '@/lib/supabase';
import { PageHeader, Card } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function ReadersPage() {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reader | null>(null);
  const [form, setForm] = useState({ full_name: '', cpf: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let query = supabase.from('readers').select('*').order('created_at', { ascending: false });
    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search.trim()}%,cpf.ilike.%${search.trim()}%`);
    }
    const { data } = await query;
    setReaders(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const openNew = () => {
    setEditing(null);
    setForm({ full_name: '', cpf: '' });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (reader: Reader) => {
    setEditing(reader);
    setForm({ full_name: reader.full_name, cpf: reader.cpf });
    setError(null);
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      full_name: form.full_name.trim(),
      cpf: form.cpf.replace(/\D/g, ''),
    };

    if (!payload.full_name || !payload.cpf) {
      setError('Nome e CPF são obrigatórios.');
      setSaving(false);
      return;
    }

    if (editing) {
      const { error } = await supabase.from('readers').update(payload).eq('id', editing.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('readers').insert(payload);
      if (error) setError(error.message);
    }

    if (!error) {
      setModalOpen(false);
      load();
    }
    setSaving(false);
  };

  const remove = async (reader: Reader) => {
    if (!confirm(`Remover o leitor "${reader.full_name}"?`)) return;
    const { error } = await supabase.from('readers').delete().eq('id', reader.id);
    if (error) {
      alert('Não foi possível remover: este leitor possui empréstimos vinculados.');
      return;
    }
    load();
  };

  return (
    <div>
      <PageHeader
        title="Leitores"
        subtitle="Cadastre os dados dos leitores da biblioteca"
        action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Novo leitor</Button>}
      />

      <div className="mb-5 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Carregando...</div>
      ) : readers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="Nenhum leitor cadastrado"
          message="Clique em 'Novo leitor' para começar."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Nome completo</th>
                <th className="px-4 py-3">CPF</th>
                <th className="hidden md:table-cell px-4 py-3">Cadastro</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {readers.map((reader) => (
                <tr key={reader.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{reader.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCPF(reader.cpf)}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-slate-500">
                    {new Date(reader.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(reader)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(reader)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition-colors">
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

      <Modal open={modalOpen} title={editing ? 'Editar leitor' : 'Novo leitor'} onClose={() => setModalOpen(false)}>
        <form onSubmit={save} className="flex flex-col gap-4">
          <Field label="Nome completo" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Ex: João da Silva" />
          <Field label="CPF" required value={form.cpf} onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" maxLength={14} />
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
