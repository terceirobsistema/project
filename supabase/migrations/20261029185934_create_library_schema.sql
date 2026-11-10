/*
# Sistema de Gestão de Biblioteca — Esquema Inicial

## Resumo
Cria as tabelas necessárias para um sistema de gestão de biblioteca com controle
de livros, leitores, empréstimos, devoluções e reservas. O acesso é restrito ao
administrador autenticado.

## Tabelas Criadas

### books (livros)
- id: identificador único (UUID)
- title: título do livro (texto, obrigatório)
- author: autor do livro (texto, obrigatório)
- publisher: editora do livro (texto, opcional)
- publication_year: ano de publicação (inteiro, opcional)
- available: indica se o livro está disponível para empréstimo (booleano, padrão true)
- created_at: data de criação do registro

### readers (leitores)
- id: identificador único (UUID)
- full_name: nome completo do leitor (texto, obrigatório)
- cpf: CPF do leitor (texto, obrigatório, único)
- created_at: data de criação do registro

### loans (empréstimos)
- id: identificador único (UUID)
- book_id: referência ao livro emprestado (FK → books)
- reader_id: referência ao leitor que pegou o livro (FK → readers)
- loan_date: data do empréstimo (data, padrão CURRENT_DATE)
- due_date: data prevista para devolução (data, obrigatório)
- return_date: data real de devolução (data, nulo enquanto não devolvido)
- created_at: data de criação do registro

### reservations (reservas)
- id: identificador único (UUID)
- book_id: referência ao livro reservado (FK → books)
- reader_id: referência ao leitor que reservou (FK → readers)
- fulfilled: indica se a reserva foi atendida (booleano, padrão false)
- cancelled: indica se a reserva foi cancelada (booleano, padrão false)
- created_at: data de criação do registro

## Segurança
- RLS habilitado em todas as tabelas.
- Acesso concedido apenas a usuários autenticados (TO authenticated).
- Como o sistema tem um único administrador, todas as políticas permitem
  acesso total aos dados autenticados (USING (true) / WITH CHECK (true)).
- Isso é apropriado porque todos os dados são compartilhados entre administradores.

## Notas
1. O status de empréstimo é derivado: return_date IS NULL → ativo; return_date
   preenchida → devolvido. Atraso é derivado: due_date < CURRENT_DATE AND
   return_date IS NULL.
2. A disponibilidade do livro (available) é atualizada pela aplicação ao
   registrar empréstimos e devoluções.
3. Reservas pendentes são: fulfilled = false AND cancelled = false.
*/

-- ===================== books =====================
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  publisher text,
  publication_year int,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON books TO authenticated;

DROP POLICY IF EXISTS "select_books" ON books;
CREATE POLICY "select_books" ON books FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_books" ON books;
CREATE POLICY "insert_books" ON books FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_books" ON books;
CREATE POLICY "update_books" ON books FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_books" ON books;
CREATE POLICY "delete_books" ON books FOR DELETE
  TO authenticated USING (true);

-- ===================== readers =====================
CREATE TABLE IF NOT EXISTS readers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  cpf text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE readers ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON readers TO authenticated;

DROP POLICY IF EXISTS "select_readers" ON readers;
CREATE POLICY "select_readers" ON readers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_readers" ON readers;
CREATE POLICY "insert_readers" ON readers FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_readers" ON readers;
CREATE POLICY "update_readers" ON readers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_readers" ON readers;
CREATE POLICY "delete_readers" ON readers FOR DELETE
  TO authenticated USING (true);

-- ===================== loans =====================
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  reader_id uuid NOT NULL REFERENCES readers(id) ON DELETE RESTRICT,
  loan_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  return_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON loans TO authenticated;

DROP POLICY IF EXISTS "select_loans" ON loans;
CREATE POLICY "select_loans" ON loans FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_loans" ON loans;
CREATE POLICY "insert_loans" ON loans FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_loans" ON loans;
CREATE POLICY "update_loans" ON loans FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_loans" ON loans;
CREATE POLICY "delete_loans" ON loans FOR DELETE
  TO authenticated USING (true);

-- ===================== reservations =====================
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  reader_id uuid NOT NULL REFERENCES readers(id) ON DELETE RESTRICT,
  fulfilled boolean NOT NULL DEFAULT false,
  cancelled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON reservations TO authenticated;

DROP POLICY IF EXISTS "select_reservations" ON reservations;
CREATE POLICY "select_reservations" ON reservations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_reservations" ON reservations;
CREATE POLICY "insert_reservations" ON reservations FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_reservations" ON reservations;
CREATE POLICY "update_reservations" ON reservations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_reservations" ON reservations;
CREATE POLICY "delete_reservations" ON reservations FOR DELETE
  TO authenticated USING (true);

-- ===================== indexes =====================
CREATE INDEX IF NOT EXISTS idx_books_title_lower ON books (lower(title));
CREATE INDEX IF NOT EXISTS idx_books_author_lower ON books (lower(author));
CREATE INDEX IF NOT EXISTS idx_loans_book_id ON loans (book_id);
CREATE INDEX IF NOT EXISTS idx_loans_reader_id ON loans (reader_id);
CREATE INDEX IF NOT EXISTS idx_loans_return_date ON loans (return_date);
CREATE INDEX IF NOT EXISTS idx_reservations_book_id ON reservations (book_id);
