import { useState } from 'react';
import { BankMark, Card, Field, Icon, NumberField, Switch, TextField, inputCls } from '../components/ui';
import { formatSAR, SECTORS, type Offer, type Sector } from '../lib/finance';
import { useWs } from './store';
import { EligibilityModal, QuoteModal } from './Documents';

export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-rise">
      <div>
        <p className="text-xs font-semibold text-gold-600">{eyebrow}</p>
        <h1 className="font-display text-3xl text-ink-900 mt-1">{title}</h1>
      </div>
      {children && <div className="flex gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <fieldset className="space-y-3">
    <legend className="text-[11px] font-bold text-ink-500 tracking-wide mb-3 flex items-center gap-2 w-full">
      <span>{title}</span><span className="flex-1 h-px bg-sand-200" />
    </legend>
    {children}
  </fieldset>
);

function DbrBar({ income, obligations, available }: { income: number; obligations: number; available: number }) {
  const pct = (v: number) => (income > 0 ? Math.min(100, (v / income) * 100) : 0);
  return (
    <div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-white/10" role="img" aria-label="توزيع الدخل الشهري">
        <div className="bg-red-400/80" style={{ width: pct(obligations) + '%' }} />
        <div className="bg-gold-400" style={{ width: pct(available) + '%' }} />
      </div>
      <div className="flex gap-4 mt-2 text-[11px] text-sand-200/70">
        <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-red-400/80" />التزامات</span>
        <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-gold-400" />متاح للتمويل</span>
        <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-white/20" />خارج نسبة الاستقطاع</span>
      </div>
    </div>
  );
}

function OfferRow({ offer, best, ratio, onQuote, i }: { offer: Offer; best: boolean; ratio: number; onQuote: () => void; i: number }) {
  return (
    <div className={`group relative rounded-2xl p-5 bg-white border transition hover:-translate-y-0.5 hover:shadow-lg animate-rise ${best ? 'border-gold-500 shadow-[0_0_0_4px_rgba(217,178,107,.12)]' : 'border-sand-200'}`} style={{ animationDelay: `${i * 70}ms` }}>
      {best && <span className="absolute -top-2.5 right-5 bg-gold-400 text-ink-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full">الأعلى تمويلاً</span>}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 sm:w-56">
          <BankMark color={offer.bank.color} short={offer.bank.short} />
          <div>
            <p className="font-bold text-ink-900 text-sm">{offer.bank.name}</p>
            <p className="text-[11px] text-ink-500">معدل سنوي تقديري <span className="num font-semibold text-ink-700">{offer.apr}%</span> · {offer.tenureYears} سنة</p>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div><p className="text-[11px] text-ink-400">أقصى تمويل</p><p className="font-display text-xl text-ink-900 num">{formatSAR(offer.maxLoanAmount)}</p></div>
          <div><p className="text-[11px] text-ink-400">القسط الشهري</p><p className="font-semibold text-ink-800 num">{formatSAR(offer.monthlyPMT)}</p></div>
        </div>
        <button onClick={onQuote} className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sand-100 text-ink-800 hover:bg-ink-800 hover:text-sand-50 transition flex items-center gap-1.5">
          <Icon name="doc" className="w-4 h-4" />عرض سعر
        </button>
      </div>
      <div className="mt-4 h-1 rounded-full bg-sand-100 overflow-hidden" aria-hidden="true">
        <div className={`h-full rounded-full origin-right transition-transform duration-700 ${best ? 'bg-gold-500' : 'bg-ink-300'}`} style={{ transform: `scaleX(${ratio})` }} />
      </div>
      <p className="text-[11px] text-ink-500 mt-2">الشريحة: {offer.pricingLabel} · {offer.calculationModel === "flat" ? "هامش ثابت" : "رصيد متناقص"}</p>
      {offer.cappedByPropertyValue && <p className="text-[11px] text-gold-600 mt-2">المبلغ محدود بقيمة العقار ونسبة الدفعة الأولى</p>}
    </div>
  );
}

export default function Calculator() {
  const { client, banks, updateClient, capacity, offers, best, chosen, agency, notify, resetClient, saveCurrentClient, editingId, selectedBankId, setSelectedBankId } = useWs();
  const [quote, setQuote] = useState<Offer | null>(null);
  const [elig, setElig] = useState(false);

  const ageErr = client.age >= client.retirementAge ? 'العمر يساوي أو يتجاوز سن التقاعد' : undefined;
  const salaryErr = client.basicSalary <= 0 ? 'أدخل الراتب الأساسي' : undefined;
  const sorted = [...offers].sort((a, b) => b.maxLoanAmount - a.maxLoanAmount);

  const save = () => saveCurrentClient();

  return (
    <>
      <PageHead eyebrow={editingId ? "تعديل ملف عميل محفوظ" : "ملف عميل جديد"} title="حاسبة الاستحقاق التمويلي">
        <button onClick={resetClient} className="px-3.5 py-2 rounded-xl text-sm font-semibold text-ink-600 hover:bg-sand-100">إعادة تعيين</button>
        <button onClick={save} className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-sand-200 hover:border-ink-300 flex items-center gap-1.5"><Icon name="plus" className="w-4 h-4" />{editingId ? "تحديث ملف العميل" : "حفظ ملف العميل"}</button>
        <button onClick={() => setElig(true)} className="px-4 py-2 rounded-xl text-sm font-semibold bg-ink-800 text-sand-50 hover:bg-ink-700 flex items-center gap-1.5"><Icon name="shield" className="w-4 h-4" />تقرير الاستحقاق</button>
      </PageHead>

      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6 items-start">
        <Card className="p-6 space-y-7 animate-rise">
          <Section title="العميل والوظيفة">
            <div className="grid sm:grid-cols-2 gap-3">
              <TextField label="اسم العميل" value={client.clientName} onChange={(v) => updateClient('clientName', v)} />
              <TextField label="رقم الجوال" value={client.clientPhone} onChange={(v) => updateClient('clientPhone', v)} inputMode="tel" dir="ltr" className={`${inputCls} text-right`} />
              <Field label="القطاع الوظيفي">
                <select value={client.sector} onChange={(e) => updateClient('sector', e.target.value as Sector)} className={inputCls}>
                  {SECTORS.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
                </select>
              </Field>
              <Field label="البنك المحوّل إليه الراتب (إن وجد)">
                <select value={client.salaryBankId ?? ''} onChange={e => updateClient('salaryBankId',e.target.value)} className={inputCls}>
                  <option value="">لا يوجد / غير محدد</option>
                  {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="العمر" value={client.age} onChange={(v) => updateClient('age', v)} error={ageErr} />
                <NumberField label="سن التقاعد" value={client.retirementAge} onChange={(v) => updateClient('retirementAge', v)} />
              </div>
            </div>
          </Section>

          <Section title="الدخل الشهري">
            <div className="grid sm:grid-cols-2 gap-3">
              <NumberField label="الراتب الأساسي" suffix="ر.س" value={client.basicSalary} onChange={(v) => updateClient('basicSalary', v)} error={salaryErr} />
              <NumberField label="بدل السكن" suffix="ر.س" value={client.housingAllowance} onChange={(v) => updateClient('housingAllowance', v)} />
            </div>
            <div className="rounded-xl bg-sand-50 border border-sand-200 p-3.5">
              <Switch label="مستفيد من دعم سكني" hint="المحرك يستخدم افتراضات تقديرية للاستقطاع؛ لا تعتمدها كقرار ائتماني دون سياسة الجهة الممولة." checked={client.isSakaniSupported} onChange={(v) => updateClient('isSakaniSupported', v)} />
            </div>
          </Section>

          <Section title="العقار والتمويل">
            <div className="grid sm:grid-cols-2 gap-3">
              <NumberField label="قيمة العقار" suffix="ر.س" value={client.propertyValue} onChange={(v) => updateClient('propertyValue', v)} />
              <NumberField label="المدة المطلوبة" suffix="سنة" value={client.desiredTenureYears} onChange={(v) => updateClient('desiredTenureYears', v)} />
            </div>
          </Section>

          <Section title="الالتزامات القائمة">
            <Switch label="يوجد التزامات شهرية" checked={client.hasExistingObligations} onChange={(v) => updateClient('hasExistingObligations', v)} />
            {client.hasExistingObligations && (
              <div className="grid grid-cols-2 gap-3 animate-rise">
                <NumberField label="قسط القرض الشخصي" suffix="ر.س" value={client.personalLoanPayment} onChange={(v) => updateClient('personalLoanPayment', v)} />
                <NumberField label="الأشهر المتبقية" suffix="شهر" value={client.personalLoanMonthsLeft} onChange={(v) => updateClient('personalLoanMonthsLeft', v)} />
                <NumberField label="قسط السيارة" suffix="ر.س" value={client.carLoanPayment} onChange={(v) => updateClient('carLoanPayment', v)} />
                <NumberField label="حد البطاقات الائتمانية" suffix="ر.س" value={client.creditCardLimit} onChange={(v) => updateClient('creditCardLimit', v)} />
                <div className="col-span-2 rounded-xl bg-sand-50 border border-sand-200 p-3.5">
                  <Switch label="تمويل مرن 2 في 1" hint="يُطبّق فقط إذا سمحت إعدادات البنك بتمويل مرن، ويحتاج إلى تأكيد العرض الرسمي." checked={client.useFlexible2in1} onChange={(v) => updateClient('useFlexible2in1', v)} />
                </div>
              </div>
            )}
          </Section>
        </Card>

        <div className="space-y-5 lg:sticky lg:top-6">
          <div className="relative overflow-hidden rounded-2xl bg-ink-900 text-sand-50 p-6 grain animate-rise">
            <div className="absolute inset-0 lattice" aria-hidden="true" />
            <div className="relative grid sm:grid-cols-[1fr_auto] gap-6">
              <div>
                <p className="text-xs text-sand-200/70">القسط الشهري المتاح للتمويل العقاري</p>
                <p className="font-display text-4xl text-gold-300 num mt-1">{formatSAR(capacity.netAvailablePMT)}</p>
              </div>
              <dl className="grid grid-cols-3 sm:grid-cols-1 gap-3 text-sm">
                <div><dt className="text-[11px] text-sand-200/60">نسبة الاستقطاع</dt><dd className="font-semibold num">{Math.round(capacity.maxDBR * 100)}%</dd></div>
                <div><dt className="text-[11px] text-sand-200/60">المدة الفعالة</dt><dd className="font-semibold">{capacity.effectiveTenureYears} سنة</dd></div>
                <div><dt className="text-[11px] text-sand-200/60">للتقاعد</dt><dd className="font-semibold">{Math.max(0, capacity.yearsToRetirement)} سنة</dd></div>
              </dl>
            </div>
            <div className="relative mt-6"><DbrBar income={capacity.totalIncome} obligations={capacity.totalObligations} available={capacity.netAvailablePMT} /></div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink-900">عروض البنوك <span className="text-ink-400 font-normal text-sm">({offers.length})</span></h2>
            <span className="text-[11px] text-gold-600">حسب القواعد التي أدخلتها لكل بنك · غير ملزمة</span>
          </div>
          {sorted.length > 0 && (
            <Card className="p-4 space-y-2">
              <label htmlFor="selected-bank" className="block text-sm font-bold">البنك المختار للمتابعة ورفع الطلب</label>
              <select id="selected-bank" value={selectedBankId || best?.bank.id || ''} onChange={e => setSelectedBankId(e.target.value)} className={inputCls}>
                {sorted.map(o => <option key={o.bank.id} value={o.bank.id}>{o.bank.name} — {o.apr}% ({o.pricingLabel})</option>)}
              </select>
              <p className="text-xs text-ink-500">الاختيار يُحفظ مع ملف العميل، ويمكن تغيير مرحلة الطلب لاحقاً من ملفات العملاء.</p>
              {chosen && <p className="text-xs text-ink-700">أساس التسعير: {chosen.pricingLabel} · {chosen.calculationModel === 'flat' ? 'هامش ثابت (افتراضي)' : 'رصيد متناقص (افتراضي)'}</p>}
            </Card>
          )}
          {sorted.length === 0 ? (
            <Card className="p-10 text-center">
              <Icon name="building" className="w-8 h-8 mx-auto text-ink-300" />
              <p className="font-semibold mt-3">لا توجد عروض مطابقة لهذه البيانات</p>
              <p className="text-sm text-ink-500">تأكد من الدخل والسن والالتزامات وقواعد أهلية كل بنك من صفحة النسب.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sorted.map((o, i) => (
                <OfferRow key={o.bank.id} i={i} offer={o} best={best?.bank.id === o.bank.id} ratio={best?.maxLoanAmount ? o.maxLoanAmount / best.maxLoanAmount : 0} onQuote={() => setQuote(o)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {quote && <QuoteModal offer={quote} client={client} agency={agency} onClose={() => setQuote(null)} />}
      {elig && <EligibilityModal client={client} capacity={capacity} best={best} agency={agency} onClose={() => setElig(false)} />}
    </>
  );
}
