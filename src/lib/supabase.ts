import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Book = {
  id: string;
  title: string;
  author: string;
  publisher: string | null;
  publication_year: number | null;
  available: boolean;
  created_at: string;
};

export type Reader = {
  id: string;
  full_name: string;
  cpf: string;
  created_at: string;
};

export type Loan = {
  id: string;
  book_id: string;
  reader_id: string;
  loan_date: string;
  due_date: string;
  return_date: string | null;
  created_at: string;
  book?: Book;
  reader?: Reader;
};

export type Reservation = {
  id: string;
  book_id: string;
  reader_id: string;
  fulfilled: boolean;
  cancelled: boolean;
  created_at: string;
  book?: Book;
  reader?: Reader;
};
