import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Icon, inputCls, Field } from '../components/ui';
import { formatSAR, sectorName } from '../lib/finance';
import { STAGES, type Stage, type ClientRecord } from '../lib/sample';
import { useWs } from './store';
import { PageHead } from './Calculator';
const csvCell = (c: unknown) => `"${String(c ?? '').replace(/"/g,'""')}"`;
const csvDownload = (name: string, rows: unknown[][]) => {
  const content = '\uFEFF' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
  const link = document.createElement('a'); const url = URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
  link.href=url; link.download=name; link.click(); window.setTimeout(()=>URL.revokeObjectURL(url),1000);
};
export default function Clients() {
  const { records, setRecords, notify, loadRecord } = useWs();
  const navigate = useNavigate();
  const [q, setQ] = useState(''); const [stage, setStage] = useState<Stage|'all'>('all');
  const [selectedId, setSelectedId] = useState('');
  const [sort, setSort] = useState<'recent'|'amount'|'name'>('recent');
  const list = useMemo(() => {
    const filtered = records.filter(r => (stage === 'all' || r.stage === stage) &&
      (r.name.includes(q.trim()) || r.phone.includes(q.trim()) || (r.reference || '').includes(q.trim())));
    if(sort==='amount') return [...filtered].sort((a,b)=>b.bestAmount-a.bestAmount);
    if(sort==='name') return [...filtered].sort((a,b)=>a.name.localeCompare(b.name,'ar'));
    return filtered;
  },[records,q,stage,sort]);
  const selected = records.find(r=>r.id===selectedId);
  const edit = (id:string, patch: Partial<ClientRecord>) => setRecords(rs => rs.map(r=>r.id === id ? {...r,...patch,updated:new Date().toLocaleString('en-GB')} : r));
  const editCalculator = (r:ClientRecord) => {
    if(!loadRecord(r)) return notify('هذا الملف قديم ولا يحتوي على بيانات الحاسبة؛ أنشئ ملفاً جديداً', 'err');
    navigate('/app/calculator');
  };
  const exportCSV = () => {
    csvDownload('masar-financing-cases.csv', [
      ['الاسم','الجوال','القطاع','الدخل','البنك المختار','مبلغ التمويل التقديري','الحالة','مرجع الطلب','تاريخ الرفع','المتابعة القادمة','الملاحظات'],
      ...list.map(r=>[r.name,r.phone,sectorName(r.sector),r.income,r.bestBank,r.bestAmount,STAGES[r.stage]?.label||r.stage,r.reference,r.submittedAt,r.followUpAt,r.notes])]);
    notify('تم تصدير ملفات العملاء');
  };
  return <>
    <PageHead eyebrow="من الزيارة الأولى حتى نتيجة الطلب" title="ملفات التمويل ومتابعة الطلبات">
      <Link to="/app/calculator" className="px-4 py-2 rounded-xl text-sm font-semibold bg-ink-800 text-sand-50">+ حساب عميل جديد</Link>
    </PageHead>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {(Object.keys(STAGES) as Stage[]).map(s=><button key={s} onClick={()=>setStage(stage===s?'all':s)} className={`rounded-xl p-3 text-right border ${stage===s?'bg-ink-900 text-white':'bg-white border-sand-200'}`}>
        <p className="text-xs">{STAGES[s].label}</p><p className="text-2xl font-display mt-1">{records.filter(r=>r.stage===s).length}</p>
      </button>)}
    </div>
    <Card className="p-4 mb-5 flex gap-3 flex-wrap items-center">
      <input value={q} onChange={e=>setQ(e.target.value)} className={`${inputCls} flex-1 min-w-[180px]`} placeholder="بحث بالاسم أو الجوال أو مرجع الطلب" />
      <select value={sort} onChange={e=>setSort(e.target.value as typeof sort)} className={`${inputCls} w-auto`} aria-label="الترتيب"><option value="recent">الترتيب الحالي</option><option value="amount">أعلى تمويل</option><option value="name">الاسم</option></select>
      {stage!=='all' && <button onClick={()=>setStage('all')} className="text-sm underline">إزالة التصفية</button>}
      <button onClick={exportCSV} disabled={!list.length} className="px-4 py-2 rounded-xl text-xs font-bold bg-sand-100 disabled:opacity-40">تصدير CSV</button>
    </Card>
    {!list.length ? <Card className="p-12 text-center text-sm text-ink-500">لا توجد ملفات مطابقة. ابدأ من حاسبة الاستحقاق وأدخل بيانات عميل جديد.</Card> : <div className="space-y-3">
      {list.map(r=><Card key={r.id} className="overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1"><p className="font-bold">{r.name}</p><p className="text-xs text-ink-500">{r.phone || 'بدون رقم جوال'} · {sectorName(r.sector)} · دخل {formatSAR(r.income)}</p></div>
          <div className="min-w-[150px]"><p className="text-xs text-ink-500">البنك المختار</p><p className="font-semibold text-sm">{r.bestBank}</p><p className="text-xs text-ink-600">{formatSAR(r.bestAmount)}</p></div>
          <select value={r.stage} onChange={e=>edit(r.id,{stage:e.target.value as Stage,submittedAt:e.target.value==='submitted'?(r.submittedAt||new Date().toISOString().slice(0,10)):r.submittedAt})} className={`${inputCls} md:w-[178px] text-xs`} aria-label={`مرحلة طلب ${r.name}`}>
            {(Object.keys(STAGES) as Stage[]).map(s=><option key={s} value={s}>{STAGES[s].label}</option>)}
          </select>
          <button onClick={()=>setSelectedId(selectedId===r.id?'':r.id)} className="rounded-xl border border-sand-200 p-2.5 text-xs font-semibold">{selectedId===r.id?'إغلاق التفاصيل':'تفاصيل ومتابعة'}</button>
        </div>
        {selected?.id===r.id && <div className="p-5 border-t border-sand-200 bg-sand-50 space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <Field label="مرجع الطلب لدى البنك"><input value={r.reference||''} onChange={e=>edit(r.id,{reference:e.target.value})} className={inputCls} placeholder="رقم الطلب أو المعاملة" /></Field>
            <Field label="تاريخ رفع الطلب"><input type="date" value={r.submittedAt||''} onChange={e=>edit(r.id,{submittedAt:e.target.value})} className={inputCls}/></Field>
            <Field label="موعد المتابعة القادمة"><input type="date" value={r.followUpAt||''} onChange={e=>edit(r.id,{followUpAt:e.target.value})} className={inputCls}/></Field>
          </div>
          <Field label="ملاحظات المستشار / المستندات الناقصة"><textarea rows={3} value={r.notes||''} onChange={e=>edit(r.id,{notes:e.target.value})} className={inputCls} placeholder="مثال: انتظار تعريف الراتب وكشف الحساب" /></Field>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <button onClick={()=>editCalculator(r)} className="bg-ink-900 text-white px-4 py-2 rounded-xl text-xs font-bold">فتح بيانات العميل في الحاسبة</button>
            <button onClick={()=>{if(window.confirm(`حذف ملف ${r.name} نهائياً؟`)){setRecords(rs=>rs.filter(x=>x.id!==r.id));setSelectedId('');notify('تم حذف الملف');}}} className="text-red-700 text-xs underline">حذف ملف العميل</button>
          </div>
          <p className="text-xs text-ink-500">كل التعديلات تحفظ في متصفح هذا الجهاز تلقائياً. لا تضع بيانات حساسة قبل توفير حساب آمن وقاعدة بيانات.</p>
        </div>}
      </Card>)}
    </div>}
  </>;
}
