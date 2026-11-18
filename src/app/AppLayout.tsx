import { NavLink, Outlet, Link } from 'react-router-dom';
import { Icon, Logo } from '../components/ui';
import { WorkspaceProvider, useWs } from './store';

const NAV = [
  { to: '/app', end: true, label: 'لوحة العمل', short: 'الرئيسية', icon: 'home' as const },
  { to: '/app/calculator', label: 'حاسبة الاستحقاق', short: 'الحاسبة', icon: 'calc' as const },
  { to: '/app/compare', label: 'مقارنة البنوك', short: 'البنوك', icon: 'scale' as const },
  { to: '/app/clients', label: 'ملفات التمويل', short: 'العملاء', icon: 'users' as const },
  { to: '/app/rentals', label: 'تحصيل الإيجارات', short: 'الإيجارات', icon: 'building' as const },
  { to: '/app/rates', label: 'قواعد البنوك والإعدادات', short: 'الإعدادات', icon: 'sliders' as const },
];

function Shell() {
  const { records, agency, toast } = useWs();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[248px_1fr]">
      <aside className="hidden md:flex flex-col bg-ink-900 text-sand-100 sticky top-0 h-screen relative grain overflow-hidden">
        <div className="absolute inset-0 lattice opacity-60" aria-hidden="true" />
        <div className="relative p-5 border-b border-white/10"><Link to="/"><Logo light /></Link></div>
        <nav className="relative flex-1 p-3 space-y-1" aria-label="التنقل الرئيسي">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-sand-50 text-ink-900 shadow' : 'text-sand-200/80 hover:bg-white/5 hover:text-sand-50'}`}>
              <Icon name={n.icon} className="w-[18px] h-[18px]" />
              <span className="flex-1">{n.label}</span>
              {n.icon === 'users' && <span className="text-[10px] num px-1.5 py-0.5 rounded-md bg-gold-400/20 text-gold-300">{records.length}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="relative p-4 m-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-[11px] text-sand-200/60">مساحة العمل</p>
          <p className="text-sm font-semibold leading-snug mt-0.5">{agency.agencyName}</p>
          <p className="text-[11px] text-gold-300 mt-1">{agency.agentName}</p>
        </div>
      </aside>

      <div className="min-w-0 pb-24 md:pb-0">
        <header className="md:hidden sticky top-0 z-30 bg-sand-50/90 backdrop-blur border-b border-sand-200 px-4 h-14 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <span className="text-[11px] text-ink-500">{agency.agencyName}</span>
        </header>
        <div className="bg-gold-400/15 border-b border-gold-400/30 text-gold-600 text-[12px] text-center py-1.5 px-4">
          نسخة عمل محلية: تُحفظ البيانات في هذا المتصفح فقط دون حماية حساب مستخدم. لا تستخدم بيانات حقيقية على موقع عام قبل تأمينها. نسب البنوك افتراضية إلى أن تدخلها بمصدر رسمي.
        </div>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8"><Outlet /></main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-sand-200 px-2 pt-2 pb-[calc(.5rem+env(safe-area-inset-bottom))] flex justify-around overflow-x-auto" aria-label="التنقل السفلي">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-[10px] whitespace-nowrap shrink-0 font-semibold ${isActive ? 'text-ink-900 bg-sand-100' : 'text-ink-400'}`}>
            <Icon name={n.icon} className="w-5 h-5" />{n.short}
          </NavLink>
        ))}
      </nav>

      {toast && (
        <div role="status" className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-rise">
          <div className={`px-4 py-2.5 rounded-xl shadow-xl text-sm font-semibold text-white flex items-center gap-2 ${toast.type === 'err' ? 'bg-red-700' : 'bg-ink-800'}`}>
            <Icon name={toast.type === 'err' ? 'alert' : 'check'} className="w-4 h-4" />{toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  return <WorkspaceProvider><Shell /></WorkspaceProvider>;
}
