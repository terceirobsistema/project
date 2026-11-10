import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  BookMarked,
  Users,
  ArrowLeftRight,
  Bell,
  LogOut,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/Button';

export type PageKey = 'dashboard' | 'books' | 'readers' | 'loans' | 'notifications';

type NavItem = {
  key: PageKey;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Painel', icon: <LayoutDashboard className="h-5 w-5" /> },
  { key: 'books', label: 'Livros', icon: <BookMarked className="h-5 w-5" /> },
  { key: 'readers', label: 'Leitores', icon: <Users className="h-5 w-5" /> },
  { key: 'loans', label: 'Empréstimos', icon: <ArrowLeftRight className="h-5 w-5" /> },
  { key: 'notifications', label: 'Notificações', icon: <Bell className="h-5 w-5" /> },
];

export function Layout({
  current,
  onNavigate,
  children,
  notificationCount,
}: {
  current: PageKey;
  onNavigate: (key: PageKey) => void;
  children: ReactNode;
  notificationCount?: number;
}) {
  const { signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (key: PageKey) => {
    onNavigate(key);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 border-r border-slate-800">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Biblioteca</p>
            <p className="text-xs text-slate-400">Gestão</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full ${
                current === item.key
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.key === 'notifications' && notificationCount && notificationCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {notificationCount}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            <span className="font-bold text-slate-900">Biblioteca</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden">
            <nav className="flex flex-col gap-1 bg-white border-b border-slate-200 p-3">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    current === item.key
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.key === 'notifications' && notificationCount && notificationCount > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                      {notificationCount}
                    </span>
                  ) : null}
                </button>
              ))}
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <LogOut className="h-5 w-5" />
                Sair
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 md:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  color = 'emerald',
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: 'emerald' | 'blue' | 'amber' | 'red';
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export { Button };
