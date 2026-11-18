import { useMemo, useState } from 'react';
import { Card, Field, NumberField, TextField, inputCls } from '../components/ui';
import { formatSAR } from '../lib/finance';
import { dayNow, monthNow, rentRow, isActiveInMonth, overdueRentRows, type RentalUnit, type RentPayment } from '../lib/rentals';
import { makeId, useWs } from './store';
import { PageHead } from './Calculator';

const badge: Record<string, string> = { paid:'مُحصّل بالكامل', partial:'مدفوع جزئياً', overdue:'متأخر', upcoming:'لم يحِن / قيد التحصيل' };
const tone: Record<string, string> = { paid:'bg-emerald-50 text-emerald-700', partial:'bg-amber-50 text-amber-800', overdue:'bg-red-50 text-red-700', upcoming:'bg-sand-100 text-ink-700' };
const cleanNum = (n: number) => Number.isFinite(n) ? Math.max(0,n) : 0;
const downloadCsv = (rows: (string|number)[][]) => {
  const csv = '\uFEFF'+rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='masar-rent-collections.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
export default function Rentals() {
  const { projects,units,payments,setProjects,setUnits,setPayments,notify } = useWs();
  const [month,setMonth] = useState(monthNow());
  const [projectFilter,setProjectFilter] = useState('all');
  const [projectName,setProjectName] = useState(''); const [projectLocation,setProjectLocation] = useState('');
  const [addingProject,setAddingProject] = useState(false); const [addingUnit,setAddingUnit] = useState(false); const [editingUnitId,setEditingUnitId] = useState('');
  const [unitDraft,setUnitDraft] = useState<Omit<RentalUnit,'id'>>({projectId:'',number:'',tenantName:'',tenantPhone:'',monthlyRent:0,dueDay:1,leaseStart:dayNow(),leaseEnd:'',notes:''});
  const [paymentUnitId,setPaymentUnitId] = useState('');
  const [amount,setAmount] = useState(0); const [payDate,setPayDate] = useState(dayNow());
  const [method,setMethod] = useState<RentPayment['method']>('transfer');const [reference,setReference]=useState('');
  const rows = useMemo(()=>units.filter(u=>isActiveInMonth(u,month) && (projectFilter==='all'||u.projectId===projectFilter))
    .map(u=>({unit:u,...rentRow(u,payments,month)})),[units,payments,month,projectFilter]);
  const overdue = useMemo(() => overdueRentRows(units.filter(u=>projectFilter==='all'||u.projectId===projectFilter),payments),[units,payments,projectFilter]);
  const overdueAmount = overdue.reduce((total,r)=>total+r.remaining,0);
  const summary=rows.reduce((t,r)=>({due:t.due+r.expected,paid:t.paid+r.paid,remaining:t.remaining+r.remaining,late:t.late+(r.status==='overdue'?1:0)}),{due:0,paid:0,remaining:0,late:0});
  const chosen=rows.find(r=>r.unit.id===paymentUnitId);
  const addProject=()=>{
    if(!projectName.trim())return notify('أدخل اسم المشروع','err');
    setProjects(prev=>[...prev,{id:makeId(),name:projectName.trim(),location:projectLocation.trim()}]);
    setProjectName('');setProjectLocation('');setAddingProject(false);notify('أُضيف المشروع');
  };
  const addUnit=()=>{
    if(!unitDraft.projectId || !unitDraft.number.trim() || !unitDraft.tenantName.trim())return notify('اختر المشروع وأدخل رقم الوحدة واسم المستأجر','err');
    if(unitDraft.monthlyRent<=0||!Number.isFinite(unitDraft.monthlyRent))return notify('الإيجار الشهري يجب أن يكون أكبر من صفر','err');
    if(unitDraft.dueDay<1||unitDraft.dueDay>31||!unitDraft.leaseStart)return notify('حدد يوم الاستحقاق (1–31) وبداية العقد','err');
    if(unitDraft.leaseEnd && unitDraft.leaseEnd<unitDraft.leaseStart)return notify('نهاية العقد تسبق بدايته','err');
    if(units.some(u=>u.id!==editingUnitId&&u.projectId===unitDraft.projectId&&u.number.trim()===unitDraft.number.trim()))return notify('رقم الوحدة موجود في هذا المشروع','err');
    if(editingUnitId) setUnits(prev=>prev.map(u=>u.id===editingUnitId?{...unitDraft,id:editingUnitId,monthlyRent:cleanNum(unitDraft.monthlyRent)}:u));
    else setUnits(prev=>[...prev,{...unitDraft,id:makeId(),monthlyRent:cleanNum(unitDraft.monthlyRent)}]);
    setUnitDraft({projectId:unitDraft.projectId,number:'',tenantName:'',tenantPhone:'',monthlyRent:0,dueDay:1,leaseStart:dayNow(),leaseEnd:'',notes:''});
    setAddingUnit(false);setEditingUnitId('');notify(editingUnitId?'تم تحديث الوحدة والعقد':'أُضيفت الوحدة والعقد');
  };
  const recordPayment=()=>{
    if(!chosen) return notify('اختر وحدة نشطة لهذا الشهر','err');
    if(!Number.isFinite(amount)||amount<=0||amount>chosen.remaining+0.001)return notify(`المبلغ يجب أن يكون بين 0 والمستحق المتبقي ${formatSAR(chosen.remaining)}`,'err');
    if(!payDate)return notify('حدد تاريخ التحصيل','err');
    setPayments(prev=>[...prev,{id:makeId(),unitId:chosen.unit.id,period:month,amount:Math.round(amount*100)/100,date:payDate,method,reference:reference.trim()}]);
    setPaymentUnitId('');setAmount(0);setReference('');notify('تم تسجيل التحصيل لهذا الشهر');
  };
  const editUnit=(u:RentalUnit)=>{ const {id,...draft}=u;setUnitDraft(draft);setEditingUnitId(id);setAddingUnit(true);window.scrollTo({top:0,behavior:'smooth'}); };
  const deleteUnit=(u:RentalUnit)=>{
    if(payments.some(p=>p.unitId===u.id))return notify('لا يمكن حذف وحدة لها سجل تحصيل؛ احتفظ بالسجل للمراجعة','err');
    if(window.confirm(`حذف الوحدة ${u.number}؟`))setUnits(list=>list.filter(x=>x.id!==u.id));
  };
  const exportCSV=()=>{
    downloadCsv([['الشهر','المشروع','الوحدة','المستأجر','الجوال','الإيجار المستحق','المحصّل','المتبقي','يوم الاستحقاق','الحالة'],
      ...rows.map(r=>[month,projects.find(p=>p.id===r.unit.projectId)?.name||'',r.unit.number,r.unit.tenantName,r.unit.tenantPhone,r.expected,r.paid,r.remaining,r.deadline,badge[r.status]])]);
    notify('تم تصدير تقرير التحصيل');
  };
  return <>
    <PageHead eyebrow="متابعة التحصيل الشهري" title="إدارة إيجارات المشاريع">
      <button onClick={()=>setAddingProject(!addingProject)} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold">+ مشروع</button>
      <button disabled={!projects.length} onClick={()=>{setEditingUnitId('');setUnitDraft(d=>({...d,projectId:d.projectId||projects[0].id}));setAddingUnit(!addingUnit);}} className="px-4 py-2 bg-ink-900 text-white rounded-xl text-xs font-bold disabled:opacity-40">+ وحدة / عقد</button>
    </PageHead>
    <Card className="p-4 mb-5 text-xs text-ink-600 leading-7 bg-sand-50">سجل التحصيل للمتابعة الداخلية فقط، ولا يصدر فواتير ضريبية أو إيصالات دفع رسمية، ولا يرسل رسائل للمستأجرين أو يتصل بنظام إيجار. يُحتسب إيجار شهري كامل لكل شهر يقع ضمن مدة العقد دون تجزئة للأيام. احفظ نسخة احتياطية بشكل دوري.</Card>
    {addingProject && <Card className="p-5 mb-4 grid md:grid-cols-3 gap-3 items-end">
      <TextField label="اسم المشروع" value={projectName} onChange={setProjectName}/>
      <TextField label="الموقع / الحي (اختياري)" value={projectLocation} onChange={setProjectLocation}/>
      <button onClick={addProject} className="rounded-xl bg-ink-900 text-white px-4 py-2.5 text-sm">حفظ المشروع</button>
    </Card>}
    {addingUnit && <Card className="p-5 mb-4 space-y-4">
      <h2 className="font-bold">{editingUnitId ? 'تعديل الوحدة وعقد الإيجار' : 'تسجيل وحدة وعقد إيجار'}</h2>
      <div className="grid md:grid-cols-3 gap-3">
        <Field label="المشروع"><select value={unitDraft.projectId} onChange={e=>setUnitDraft(d=>({...d,projectId:e.target.value}))} className={inputCls}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <TextField label="رقم الوحدة" value={unitDraft.number} onChange={number=>setUnitDraft(d=>({...d,number}))}/>
        <TextField label="اسم المستأجر" value={unitDraft.tenantName} onChange={tenantName=>setUnitDraft(d=>({...d,tenantName}))}/>
        <TextField label="جوال المستأجر" value={unitDraft.tenantPhone} onChange={tenantPhone=>setUnitDraft(d=>({...d,tenantPhone}))}/>
        <NumberField label="قيمة الإيجار الشهري" value={unitDraft.monthlyRent} min={0} onChange={monthlyRent=>setUnitDraft(d=>({...d,monthlyRent}))}/>
        <NumberField label="يوم الاستحقاق من كل شهر" value={unitDraft.dueDay} min={1} max={31} onChange={dueDay=>setUnitDraft(d=>({...d,dueDay}))}/>
        <Field label="بداية العقد"><input type="date" value={unitDraft.leaseStart} onChange={e=>setUnitDraft(d=>({...d,leaseStart:e.target.value}))} className={inputCls}/></Field>
        <Field label="نهاية العقد (اختياري)"><input type="date" value={unitDraft.leaseEnd} onChange={e=>setUnitDraft(d=>({...d,leaseEnd:e.target.value}))} className={inputCls}/></Field>
        <TextField label="ملاحظات" value={unitDraft.notes||''} onChange={notes=>setUnitDraft(d=>({...d,notes}))}/>
      </div>
      <button onClick={addUnit} className="rounded-xl bg-ink-900 text-white px-4 py-2.5 text-sm font-bold">{editingUnitId?'حفظ التعديلات':'حفظ الوحدة والعقد'}</button>
    </Card>}
    <div className="flex gap-3 flex-wrap items-end mb-4">
      <Field label="الشهر"><input type="month" value={month} onChange={e=>setMonth(e.target.value)} className={inputCls}/></Field>
      <Field label="المشروع"><select className={inputCls} value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}><option value="all">كل المشاريع</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <button disabled={!rows.length} onClick={exportCSV} className="px-4 py-2.5 rounded-xl border border-sand-200 bg-white text-sm disabled:opacity-40">تصدير تقرير CSV</button>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {[['المستحق هذا الشهر',formatSAR(summary.due)],['المحصّل',formatSAR(summary.paid)],['المتبقي',formatSAR(summary.remaining)],['وحدات متأخرة',String(summary.late)]].map(([title,value])=><Card key={title} className="p-4"><p className="text-xs text-ink-500">{title}</p><p className="font-display text-xl mt-2">{value}</p></Card>)}
    </div>
    {overdue.length>0 && <Card className="p-4 mb-5 border-red-200 bg-red-50">
      <p className="font-bold text-red-800">متأخرات الإيجارات عبر الأشهر: {formatSAR(overdueAmount)} ({overdue.length} استحقاق)</p>
      <p className="text-xs text-red-700 mt-1">لتحصيل قسط قديم اختر شهره من أعلى الصفحة ثم سجّل الدفعة لذلك الشهر. تظهر المتأخرات حتى لو تغيّر الشهر المعروض.</p>
      <div className="flex flex-wrap gap-2 mt-3">{overdue.slice(0,12).map((r,i)=><button key={`${r.unit.id}-${r.period}-${i}`} onClick={()=>{setMonth(r.period);setPaymentUnitId(r.unit.id);setAmount(r.remaining);}} className="rounded-lg bg-white border border-red-200 text-red-800 text-xs px-3 py-2">{r.unit.number} · {r.period} · {formatSAR(r.remaining)}</button>)}</div>
    </Card>}
    <Card className="p-5 mb-5 space-y-4">
      <h2 className="font-bold">تسجيل دفعة إيجار</h2>
      <div className="grid md:grid-cols-3 gap-3">
        <Field label="الوحدة والمستأجر"><select className={inputCls} value={paymentUnitId} onChange={e=>{const id=e.target.value;setPaymentUnitId(id); const r=rows.find(x=>x.unit.id===id);setAmount(r?.remaining||0);}}><option value="">اختر وحدة عليها مستحق</option>{rows.filter(r=>r.remaining>0).map(r=><option key={r.unit.id} value={r.unit.id}>{projects.find(p=>p.id===r.unit.projectId)?.name} / {r.unit.number} — {r.unit.tenantName} ({formatSAR(r.remaining)})</option>)}</select></Field>
        <NumberField label="المبلغ المستلم" value={amount} min={0.01} step={0.01} onChange={setAmount}/>
        <Field label="تاريخ التحصيل"><input type="date" className={inputCls} value={payDate} onChange={e=>setPayDate(e.target.value)}/></Field>
        <Field label="طريقة الاستلام"><select className={inputCls} value={method} onChange={e=>setMethod(e.target.value as RentPayment['method'])}><option value="transfer">تحويل بنكي</option><option value="cash">نقداً</option><option value="other">أخرى</option></select></Field>
        <TextField label="مرجع الدفع / ملاحظة" value={reference} onChange={setReference}/>
        <button onClick={recordPayment} className="rounded-xl bg-ink-900 text-white px-4 py-2.5 text-sm font-bold self-end">تسجيل التحصيل</button>
      </div>
      <p className="text-xs text-ink-500">يمكن تسجيل أكثر من دفعة لنفس الوحدة خلال الشهر؛ يظهر المتبقي تلقائياً.</p>
    </Card>
    <Card className="overflow-x-auto mb-5">
      <table className="w-full min-w-[850px] text-sm">
        <thead><tr className="border-b text-xs text-ink-500">{['المشروع / الوحدة','المستأجر','المستحق','المحصّل','المتبقي','الاستحقاق','الحالة',''].map(h=><th className="p-3 text-right" key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(r=><tr className="border-b border-sand-100" key={r.unit.id}>
          <td className="p-3 font-semibold">{projects.find(p=>p.id===r.unit.projectId)?.name} / {r.unit.number}</td>
          <td className="p-3"><p>{r.unit.tenantName}</p><p className="text-xs text-ink-500">{r.unit.tenantPhone}</p></td>
          <td className="p-3">{formatSAR(r.expected)}</td><td className="p-3">{formatSAR(r.paid)}</td>
          <td className="p-3 font-bold">{formatSAR(r.remaining)}</td><td className="p-3">{r.deadline}</td>
          <td className="p-3"><span className={`rounded-xl px-2 py-1 text-xs ${tone[r.status]}`}>{badge[r.status]}</span></td>
          <td className="p-3"><div className="flex gap-2"><button onClick={()=>editUnit(r.unit)} className="text-xs text-ink-700 underline">تعديل</button><button onClick={()=>deleteUnit(r.unit)} className="text-xs text-red-700 underline">حذف</button></div></td>
        </tr>)}</tbody>
      </table>
      {!rows.length&&<p className="p-10 text-center text-sm text-ink-500">لا توجد عقود نشطة في الشهر المحدد. أضف مشروعاً ووحدة مع تاريخ بداية العقد.</p>}
    </Card>
    <Card className="p-5">
      <h2 className="font-bold mb-3">سجل المدفوعات — {month}</h2>
      <div className="space-y-2">
        {payments.filter(p=>p.period===month&& (projectFilter==='all'||units.find(u=>u.id===p.unitId)?.projectId===projectFilter)).map(p=>{
          const u=units.find(x=>x.id===p.unitId);
          return <div key={p.id} className="flex flex-wrap items-center gap-3 text-sm border-b border-sand-100 pb-2">
            <span className="flex-1">{u?.tenantName || 'وحدة محذوفة'} — وحدة {u?.number || '—'}<span className="block text-xs text-ink-500">{p.date} · {p.method==='transfer'?'تحويل':p.method==='cash'?'نقداً':'أخرى'} · {p.reference}</span></span>
            <span className="font-bold">{formatSAR(p.amount)}</span>
            <button onClick={()=>{if(window.confirm('إلغاء تسجيل هذه الدفعة؟'))setPayments(list=>list.filter(x=>x.id!==p.id));}} className="text-xs underline text-red-700">إلغاء</button>
          </div>;
        })}
        {!payments.some(p=>p.period===month)&&<p className="text-xs text-ink-500">لم تسجل مدفوعات لهذا الشهر.</p>}
      </div>
    </Card>
  </>;
}
