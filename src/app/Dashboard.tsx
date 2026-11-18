import { Link } from 'react-router-dom';
import { Card } from '../components/ui';
import { formatSAR } from '../lib/finance';
import { monthNow, rentRow, isActiveInMonth, overdueRentRows } from '../lib/rentals';
import { useWs } from './store';
import { PageHead } from './Calculator';
import { STAGES } from '../lib/sample';
export default function Dashboard() {
  const { records, projects, units, payments, agency } = useWs();
  const now = monthNow();
  const due = units.filter(u=>isActiveInMonth(u,now)).map(u=>rentRow(u,payments,now));
  const overdueRows = overdueRentRows(units,payments);
  const overdue = new Set(overdueRows.map(r=>r.unit.id)).size;
  const overdueTotal = overdueRows.reduce((total,r)=>total+r.remaining,0);
  const remaining = due.reduce((sum,r)=>sum+r.remaining,0);
  const awaiting = records.filter(r=>['docs','submitted','review'].includes(r.stage));
  const upcoming = [...records].filter(r=>r.followUpAt && r.followUpAt >= new Date().toISOString().slice(0,10)).sort((a,b)=>(a.followUpAt||'').localeCompare(b.followUpAt||'')).slice(0,5);
  return <>
    <PageHead eyebrow={agency.agencyName} title="لوحة عملي اليومية" />
    <p className="text-sm text-ink-600 mb-6">من استقبال العميل واحتساب التمويل، إلى رفع طلبه ومتابعته، بالإضافة إلى إدارة إيجارات المشاريع.</p>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {[['ملفات التمويل',String(records.length)],['طلبات تحتاج متابعة',String(awaiting.length)],['متبقي تحصيل الشهر',formatSAR(remaining)],['متأخرات الإيجار',formatSAR(overdueTotal)]].map(([label,value])=><Card key={label} className="p-5"><p className="text-xs text-ink-500">{label}</p><p className="font-display text-2xl mt-2">{value}</p></Card>)}
    </div>
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      <Link to="/app/calculator" className="p-6 rounded-2xl bg-ink-900 text-white hover:opacity-90"><p className="text-gold-300 text-xs">التمويل العقاري</p><h2 className="text-xl font-bold mt-2">ابدأ حساب استحقاق عميل</h2><p className="text-sand-200 text-sm mt-2">اجمع البيانات، طبّق نسب البنوك حسب شريحة العميل، ثم احفظ البنك المختار.</p><span className="inline-block mt-4 font-bold text-sm">فتح الحاسبة ←</span></Link>
      <Link to="/app/rentals" className="p-6 rounded-2xl bg-white border border-sand-200 hover:border-ink-500"><p className="text-gold-700 text-xs">التحصيل الإيجاري</p><h2 className="text-xl font-bold mt-2">تابع إيجارات المشاريع</h2><p className="text-ink-600 text-sm mt-2">سجّل المشاريع والوحدات والمدفوعات الجزئية، وراقب المتأخرات.</p><span className="inline-block mt-4 font-bold text-sm">فتح التحصيل ←</span></Link>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-5"><div className="flex justify-between"><h2 className="font-bold">طلبات التمويل قيد التنفيذ</h2><Link to="/app/clients" className="text-xs text-ink-600 underline">عرض الكل</Link></div>
        <div className="space-y-3 mt-4">{awaiting.slice(0,5).map(r=><div key={r.id} className="text-sm border-b border-sand-100 pb-2"><p className="font-semibold">{r.name}</p><p className="text-xs text-ink-500">{STAGES[r.stage].label} · {r.bestBank}</p></div>)}
          {!awaiting.length&&<p className="text-sm text-ink-500">لا توجد طلبات قيد التنفيذ حالياً.</p>}
        </div></Card>
      <Card className="p-5"><div className="flex justify-between"><h2 className="font-bold">المتابعات القادمة</h2><Link to="/app/clients" className="text-xs text-ink-600 underline">ملفات العملاء</Link></div>
        <div className="space-y-3 mt-4">{upcoming.map(r=><div key={r.id} className="text-sm border-b border-sand-100 pb-2"><p className="font-semibold">{r.name}</p><p className="text-xs text-ink-500">موعد المتابعة: {r.followUpAt} · {r.reference||'بلا مرجع'}</p></div>)}
          {!upcoming.length&&<p className="text-sm text-ink-500">لا توجد مواعيد متابعة قادمة.</p>}
        </div></Card>
    </div>
    <p className="text-xs text-ink-500 mt-6">وحدات لديها متأخرات: {overdue} · المشاريع المسجلة: {projects.length} · الوحدات المسجلة: {units.length}. البيانات محفوظة محلياً على هذا المتصفح فقط، وليست على خادم آمن.</p>
  </>;
}
