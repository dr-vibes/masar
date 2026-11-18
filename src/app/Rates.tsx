import { useRef, useState } from 'react';
import { BankMark, Card, Field, NumberField, Switch, TextField, inputCls } from '../components/ui';
import { FINANCE, SECTORS, type Bank, type BankPricingRule, type RateSector, type SupportCondition, type Sector } from '../lib/finance';
import { DEFAULT_BANKS } from '../lib/sample';
import { useWs, makeId } from './store';
import { PageHead } from './Calculator';

const labelForSupport: Record<SupportCondition, string> = { any: 'بغض النظر عن دعم سكني', yes: 'مدعوم فقط', no: 'غير مدعوم فقط' };
const blankRule = (): BankPricingRule => ({ id: makeId(), label: 'شريحة جديدة', sector: 'any', support: 'any', salaryTransfer: 'any', minIncome: 0, maxIncome: 0, annualRate: 4, enabled: true });
export default function Rates() {
  const { banks, updateBank, agency, setAgency, notify, exportBackup, importBackup } = useWs();
  const [tab, setTab] = useState<'banks' | 'agency' | 'backup'>('banks');
  const [currentId, setCurrentId] = useState(banks[0]?.id || '');
  const fileInput = useRef<HTMLInputElement>(null);
  const bank = banks.find(b => b.id === currentId) ?? banks[0];
  const patch = (data: Partial<Bank>) => { if (bank) updateBank(bank.id, data); };
  const rules = bank?.pricingRules ?? [];
  const patchRule = (id: string, patchData: Partial<BankPricingRule>) => patch({ pricingRules: rules.map(r => r.id === id ? { ...r, ...patchData } : r) });
  const deleteRule = (id: string) => { if (window.confirm('هل تريد حذف هذه الشريحة؟')) patch({ pricingRules: rules.filter(r => r.id !== id) }); };
  const reorder = (index: number, dir: number) => { const next = [...rules]; const j = index + dir;
    if (j < 0 || j >= next.length) return; [next[index], next[j]] = [next[j], next[index]]; patch({ pricingRules: next }); };
  const resetBank = () => { const original = DEFAULT_BANKS.find(b => b.id === bank.id); if (!original) return;
    if (window.confirm(`استعادة القيم التجريبية لبنك ${bank.name} وحذف شرائحه المخصصة؟`)) {
      const { id, ...rest } = original; updateBank(id, rest); notify('استُعيدت إعدادات البنك الافتراضية');
    } };
  return (
    <>
      <PageHead eyebrow="تهيئة سياسات التمويل" title="قواعد كل بنك وإعدادات العمل" />
      <Card className="p-4 mb-5 bg-amber-50 border-amber-200 text-amber-900 text-sm leading-7">
        <strong>تنبيه مهني:</strong> القيم الأساسية مأخوذة من نموذج تجريبي، وليست نسباً منشورة أو عروضاً صادرة من البنوك. أدخل السياسة الفعلية لكل بنك، وسجّل مصدرها وتاريخها قبل تقديم أي عرض للعميل. المعدل هنا معدل حسابي اسمي، وليس APR رسمياً.
      </Card>
      <div className="flex gap-2 mb-5 flex-wrap">
        {[['banks','بنوك وشروط التسعير'],['agency','بيانات المؤسسة'],['backup','النسخ الاحتياطي']] .map(([id,title]) =>
          <button key={id} onClick={() => setTab(id as typeof tab)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === id ? 'bg-ink-900 text-white' : 'bg-white border border-sand-200 text-ink-700'}`}>{title}</button>)}
      </div>
      {tab === 'banks' && bank && (
        <div className="grid lg:grid-cols-[240px_1fr] gap-5 items-start">
          <Card className="p-3 space-y-2">
            <p className="text-xs font-bold text-ink-500 mb-2 px-2">اختر البنك لتعديل شروطه</p>
            {banks.map(b => <button key={b.id} onClick={() => setCurrentId(b.id)} className={`w-full p-3 rounded-xl flex items-center gap-2 text-right ${b.id === bank.id ? 'bg-ink-900 text-white' : 'hover:bg-sand-100'}`}>
              <BankMark color={b.color} short={b.short} size="w-8 h-8 text-sm" />
              <span className="text-xs font-bold flex-1">{b.name}</span><span className="text-[10px]">{b.active ? '●' : '○'}</span>
            </button>)}
          </Card>
          <div className="space-y-5">
            <Card className="p-5 space-y-4">
              <div className="flex justify-between gap-3 items-center flex-wrap"><h2 className="font-bold text-lg">{bank.name}</h2><Switch label="إدراج في المقارنة" checked={bank.active} onChange={active => patch({ active })} /></div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <NumberField label="النسبة الأساسية حكومي / عسكري (%)" value={bank.aprGov} min={0} max={100} step={0.05} onChange={aprGov => patch({ aprGov })} />
                <NumberField label="النسبة الأساسية قطاع خاص (%)" value={bank.aprPrivate} min={0} max={100} step={0.05} onChange={aprPrivate => patch({ aprPrivate })} />
                <NumberField label="الحد الأدنى للدخل (ر.س)" value={bank.minIncome ?? 0} min={0} onChange={minIncome => patch({ minIncome })} />
                <NumberField label="حد الاستقطاع الخاص بالبنك % (0 = الافتراضي)" value={bank.maxDebtRatioPct ?? 0} min={0} max={100} onChange={maxDebtRatioPct => patch({ maxDebtRatioPct })} />
                <NumberField label="المدة القصوى (سنة)" value={bank.maxTenure} min={1} max={FINANCE.maxTenureYears} onChange={maxTenure => patch({ maxTenure })} />
                <NumberField label="الدفعة الأولى (%)" value={bank.minDownPayment} min={0} max={99} onChange={minDownPayment => patch({ minDownPayment })} />
                <NumberField label="حد العمر عند نهاية التمويل (0 = بلا قيد)" value={bank.maxAgeAtMaturity ?? 0} min={0} onChange={maxAgeAtMaturity => patch({ maxAgeAtMaturity })} />
                <Field label="طريقة احتساب الربح الافتراضية">
                  <select value={bank.calculationModel ?? 'reducing'} onChange={e => patch({ calculationModel: e.target.value as Bank['calculationModel'] })} className={inputCls}>
                    <option value="reducing">قسط تمويل على الرصيد المتناقص</option>
                    <option value="flat">هامش ثابت على أصل التمويل</option>
                  </select>
                </Field>
                <div className="self-end pb-3"><Switch label="يسمح بالتمويل المرن" hint="يحتاج تأكيد سياسة البنك الفعلية" checked={bank.allowFlexible === true} onChange={allowFlexible => patch({ allowFlexible })} /></div>
              </div>
              <div>
                <p className="text-xs font-bold mb-2">القطاعات المقبولة (عدم تحديد أي قطاع = إتاحة الكل)</p>
                <div className="flex flex-wrap gap-3">{SECTORS.map(([id,label]) => <label key={id} className="text-xs flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!bank.acceptedSectors?.includes(id)} onChange={e => patch({ acceptedSectors: e.target.checked ? [...(bank.acceptedSectors ?? []), id] : (bank.acceptedSectors ?? []).filter(s => s !== id) })} />{label}</label>)}</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <TextField label="مصدر النسبة / رقم العرض" value={bank.rateSource ?? ''} onChange={rateSource => patch({ rateSource })} />
                <Field label="تاريخ تحديث النسبة"><input type="date" value={bank.rateUpdatedAt ?? ''} onChange={e => patch({ rateUpdatedAt: e.target.value })} className={inputCls} /></Field>
              </div>
              <button onClick={resetBank} className="text-xs text-red-700 hover:underline">استعادة البيانات التجريبية لهذا البنك</button>
            </Card>
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div><h2 className="font-bold text-lg">شرائح النسب حسب حالة العميل</h2><p className="text-xs text-ink-500 mt-1">تُطبّق أول شريحة مفعّلة تطابق القطاع والدعم والدخل؛ وإلا تُستخدم النسبة الأساسية.</p></div>
                <button onClick={() => patch({ pricingRules: [...rules, blankRule()] })} className="bg-ink-900 text-white rounded-xl px-4 py-2 text-sm font-bold">+ إضافة شريحة</button>
              </div>
              {!rules.length && <p className="p-4 bg-sand-50 rounded-xl text-sm text-ink-500">لا توجد شرائح مخصصة بعد. يمكنك إضافة شرائح للمُدعوم أو العسكري أو رواتب فئات محددة، بعد تأكيد شروط البنك.</p>}
              {rules.map((rule,index) => <div key={rule.id} className="border border-sand-200 p-4 rounded-xl space-y-3">
                <div className="flex gap-2 items-center justify-between flex-wrap"><p className="font-semibold text-sm">الشريحة {index + 1}</p><div className="flex items-center gap-2 text-xs">
                  <button disabled={!index} onClick={() => reorder(index,-1)} className="underline disabled:opacity-30">لأعلى</button>
                  <button disabled={index === rules.length - 1} onClick={() => reorder(index,1)} className="underline disabled:opacity-30">لأسفل</button>
                  <button onClick={() => deleteRule(rule.id)} className="text-red-700 underline">حذف</button>
                </div></div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <TextField label="اسم الشريحة / سبب النسبة" value={rule.label} onChange={label => patchRule(rule.id,{label})}/>
                  <Field label="القطاع"><select value={rule.sector} onChange={e => patchRule(rule.id,{sector:e.target.value as RateSector})} className={inputCls}>
                    <option value="any">جميع القطاعات</option>{SECTORS.map(([id,label])=><option key={id} value={id}>{label}</option>)}
                  </select></Field>
                  <Field label="الدعم السكني"><select value={rule.support} onChange={e=>patchRule(rule.id,{support:e.target.value as SupportCondition})} className={inputCls}>
                    {(Object.keys(labelForSupport) as SupportCondition[]).map(x=><option key={x} value={x}>{labelForSupport[x]}</option>)}
                  </select></Field>
                  <Field label="تحويل الراتب إلى هذا البنك"><select value={rule.salaryTransfer ?? 'any'} onChange={e=>patchRule(rule.id,{salaryTransfer:e.target.value as SupportCondition})} className={inputCls}>
                    <option value="any">بغض النظر عن التحويل</option><option value="yes">الراتب محوّل للبنك</option><option value="no">الراتب غير محوّل للبنك</option>
                  </select></Field>
                  <NumberField label="الدخل من (ر.س)" value={rule.minIncome} min={0} onChange={minIncome => patchRule(rule.id,{minIncome})}/>
                  <NumberField label="الدخل إلى (0 = بلا سقف)" value={rule.maxIncome} min={0} onChange={maxIncome => patchRule(rule.id,{maxIncome})}/>
                  <NumberField label="معدل الشريحة السنوي (%)" value={rule.annualRate} min={0} max={100} step={0.05} onChange={annualRate => patchRule(rule.id,{annualRate})}/>
                </div>
                {rule.maxIncome > 0 && rule.maxIncome < rule.minIncome && <p className="text-xs text-red-700">الحد الأعلى للدخل أقل من الحد الأدنى؛ لن تنطبق هذه الشريحة.</p>}
                <Switch label="تفعيل هذه الشريحة" checked={rule.enabled} onChange={enabled => patchRule(rule.id,{enabled})}/>
              </div>)}
            </Card>
          </div>
        </div>
      )}
      {tab === 'agency' && <Card className="p-6 space-y-4 max-w-3xl">
        <h2 className="font-bold">بيانات المؤسسة التي تظهر في التقارير</h2>
        <TextField label="اسم المؤسسة" value={agency.agencyName} onChange={agencyName => setAgency(a=>({...a,agencyName}))}/>
        <TextField label="اسم المستشار" value={agency.agentName} onChange={agentName => setAgency(a=>({...a,agentName}))}/>
        <TextField label="هاتف المستشار" value={agency.agentPhone} onChange={agentPhone => setAgency(a=>({...a,agentPhone}))}/>
      </Card>}
      {tab === 'backup' && <Card className="p-6 space-y-5 max-w-3xl">
        <h2 className="font-bold">النسخ الاحتياطي والاستعادة</h2>
        <p className="text-sm text-ink-600 leading-7">تحفظ هذه النسخة بيانات العمل في متصفح هذا الجهاز فقط. حذف بيانات المتصفح، أو استخدام جهاز آخر، أو تغيير المتصفح قد يؤدي إلى فقدانها. الملف المُصدّر يحتوي على أسماء وأرقام هواتف العملاء والمستأجرين دون تشفير؛ احفظه في مكان آمن ولا تشاركه مع الآخرين.</p>
        <button onClick={exportBackup} className="bg-ink-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">تنزيل نسخة احتياطية JSON</button>
        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-semibold">استعادة نسخة محفوظة</p>
          <p className="text-xs text-red-700">ستحل بيانات الملف مكان جميع البيانات الحالية؛ صدّر نسخة احتياطية أولاً.</p>
          <input ref={fileInput} type="file" accept=".json,application/json" className="text-sm" onChange={async e => { const file = e.target.files?.[0]; if (file && window.confirm('استبدال جميع بيانات مسار الحالية بالملف؟')) await importBackup(file); e.target.value=''; }}/>
        </div>
      </Card>}
    </>
  );
}
