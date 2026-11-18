import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BankMark, Icon, Logo } from '../components/ui';
import { calcCapacity, calcOffers, formatNum, pickBestOffer } from '../lib/finance';
import { DEFAULT_BANKS, DEFAULT_CLIENT } from '../lib/sample';

function HeroCalculator() {
  const [salary, setSalary] = useState(14600);
  const [sakani, setSakani] = useState(true);
  const client = useMemo(() => ({ ...DEFAULT_CLIENT, basicSalary: Math.round(salary * 0.8), housingAllowance: Math.round(salary * 0.2), isSakaniSupported: sakani, propertyValue: 0 }), [salary, sakani]);
  const cap = calcCapacity(client);
  const offers = calcOffers(client, DEFAULT_BANKS, cap).sort((a, b) => b.maxLoanAmount - a.maxLoanAmount);
  const best = pickBestOffer(offers);

  return (
    <div className="relative rounded-[28px] bg-white/95 border border-sand-200 shadow-[0_40px_80px_-40px_rgba(7,31,31,.55)] p-6 sm:p-7 animate-rise" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink-500">جرّبها الآن</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sand-100 text-ink-600">نسب تقريبية</span>
      </div>
      <label className="block mt-4">
        <span className="flex justify-between text-sm"><span className="text-ink-600">إجمالي الراتب الشهري</span><b className="num text-ink-900">{formatNum(salary)} ر.س</b></span>
        <input type="range" min={6000} max={40000} step={50} value={salary} onChange={(e) => setSalary(Number(e.target.value))} className="w-full mt-3 accent-[#0d3b3a]" aria-label="إجمالي الراتب" />
      </label>
      <label className="flex items-center gap-2 mt-3 text-sm text-ink-600 cursor-pointer">
        <input type="checkbox" checked={sakani} onChange={(e) => setSakani(e.target.checked)} className="w-4 h-4 accent-[#0d3b3a]" /> مستفيد من دعم سكني
      </label>

      <div className="mt-5 rounded-2xl bg-ink-900 text-sand-50 p-5 relative overflow-hidden grain">
        <div className="absolute inset-0 lattice" aria-hidden="true" />
        <div className="relative">
          <p className="text-[11px] text-sand-200/70">أعلى مبلغ تمويل متاح · {best?.bank.name}</p>
          <p className="font-display text-4xl text-gold-300 num mt-1">{formatNum(best?.maxLoanAmount ?? 0)} <span className="text-base text-sand-200/70">ر.س</span></p>
          <p className="text-[11px] text-sand-200/70 mt-1">قسط شهري <span className="num">{formatNum(cap.netAvailablePMT)}</span> ر.س · استقطاع <span className="num">{Math.round(cap.maxDBR * 100)}%</span> · {cap.effectiveTenureYears} سنة</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {offers.slice(0, 4).map((o) => (
          <li key={o.bank.id} className="flex items-center gap-3 text-sm">
            <BankMark color={o.bank.color} short={o.bank.short} size="w-7 h-7 text-xs" />
            <span className="w-32 truncate text-ink-700">{o.bank.name}</span>
            <span className="flex-1 h-1.5 rounded-full bg-sand-100 overflow-hidden"><span className="block h-full bg-ink-600 origin-right transition-transform duration-500" style={{ transform: `scaleX(${best ? o.maxLoanAmount / best.maxLoanAmount : 0})` }} /></span>
            <span className="num text-xs text-ink-600 w-20 text-left">{formatNum(o.maxLoanAmount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const FEATURES = [
  { icon: 'shield' as const, title: 'محرك استحقاق ملتزم بضوابط ساما', body: 'نسب استقطاع 55% و65% تُطبّق تلقائياً حسب الدخل ودعم سكني، مع احتساب البطاقات الائتمانية والتزامات العميل وسن التقاعد.', span: 'lg:col-span-7 lg:row-span-2', dark: true },
  { icon: 'scale' as const, title: 'مقارنة متعددة البنوك', body: 'أقصى تمويل، القسط، الأرباح والدفعة الأولى لكل بنك في جدول واحد.', span: 'lg:col-span-5' },
  { icon: 'doc' as const, title: 'عروض أسعار باسم مكتبك', body: 'عرض تمويلي وتقرير استحقاق جاهزان للطباعة أو الإرسال للعميل.', span: 'lg:col-span-5' },
  { icon: 'users' as const, title: 'مسار العملاء من أول اتصال', body: 'تتبع كل ملف من الحساب إلى الموافقة المبدئية.', span: 'lg:col-span-4' },
  { icon: 'sliders' as const, title: 'تحكم كامل بالنسب', body: 'حدّث هوامش البنوك حسب القطاع متى تغيّرت.', span: 'lg:col-span-4' },
  { icon: 'spark' as const, title: 'تمويل مرن 2 في 1', body: 'احسب أثر انتهاء القرض الشخصي على القدرة التمويلية.', span: 'lg:col-span-4' },
];

const RULES = [
  ['55%', 'الحد الأقصى لنسبة الاستقطاع للدخل أقل من 15,000 ر.س'],
  ['65%', 'للدخل المرتفع أو المستفيدين من دعم سكني'],
  ['5%', 'من حد البطاقات الائتمانية يُحتسب التزاماً شهرياً'],
  ['10%', 'الحد الأدنى للدفعة الأولى للمسكن الأول'],
];

const PLANS = [
  { name: 'المستشار', price: '349', note: 'لمستشار مستقل', items: ['مستخدم واحد', 'حسابات استحقاق غير محدودة', '5 بنوك', 'عروض أسعار بشعارك'] },
  { name: 'المكتب', price: '1,190', note: 'الأكثر اختياراً لمكاتب الوساطة', featured: true, items: ['حتى 8 مستخدمين', 'ملفات عملاء مشتركة', 'كل البنوك وجهات التمويل', 'تقارير أداء الفريق'] },
  { name: 'المؤسسة', price: 'حسب الطلب', note: 'للشركات متعددة الفروع', items: ['مستخدمون غير محدودين', 'ربط مع أنظمة CRM', 'صلاحيات وأدوار مخصصة', 'مدير حساب مخصص'] },
];

const FAQ = [
  ['هل الأرقام عروض رسمية من البنوك؟', 'لا. المنصة تحسب القدرة التمويلية وفق الضوابط والنسب التي تحددها أنت، والنتيجة استرشادية. الموافقة النهائية تخضع لدراسة البنك.'],
  ['كيف تُحدَّث نسب الهامش؟', 'من صفحة النسب والإعدادات يمكنك تعديل هامش كل بنك للقطاع الحكومي والخاص، وأقصى مدة ونسبة الدفعة الأولى.'],
  ['هل تدعم المنصة عملاء القطاع الخاص غير المعتمد؟', 'نعم، وتظهر لهم ملاحظة في تقرير الاستحقاق لأن فرص القبول قد تكون أقل لدى بعض البنوك.'],
  ['أين تُحفظ بيانات العملاء؟', 'في النسخة التجريبية لا تُحفظ البيانات بعد إغلاق الصفحة. الحسابات الكاملة ستستضيف البيانات بشكل آمن مع صلاحيات لكل مستخدم.'],
];

export default function Landing() {
  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative bg-ink-900 text-sand-50 grain">
        <div className="absolute inset-0 lattice" aria-hidden="true" />
        <div className="absolute -left-40 top-10 w-[520px] h-[520px] rounded-full bg-gold-500/10 blur-3xl" aria-hidden="true" />
        <header className="relative max-w-6xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
          <Logo light />
          <nav className="hidden md:flex gap-8 text-sm text-sand-200/80">
            <a href="#features" className="hover:text-sand-50">المزايا</a>
            <a href="#compliance" className="hover:text-sand-50">الامتثال</a>
            <a href="#pricing" className="hover:text-sand-50">الأسعار</a>
            <a href="#faq" className="hover:text-sand-50">الأسئلة</a>
          </nav>
          <Link to="/app" className="px-4 py-2 rounded-xl bg-sand-50 text-ink-900 text-sm font-semibold hover:bg-gold-300 transition">دخول المنصة</Link>
        </header>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-24 lg:pb-32 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-gold-300 border border-gold-400/30 rounded-full px-3 py-1 animate-rise">
              <Icon name="shield" className="w-3.5 h-3.5" />مبني على ضوابط البنك المركزي السعودي للتمويل العقاري
            </p>
            <h1 className="font-display text-[2.6rem] sm:text-6xl leading-[1.15] mt-6 animate-rise" style={{ animationDelay: '80ms' }}>
              من راتب العميل
              <br />
              إلى <span className="text-gold-400">أفضل عرض بنكي</span>
              <br />
              في دقيقتين.
            </h1>
            <p className="text-sand-200/80 text-lg max-w-lg mt-6 leading-relaxed animate-rise" style={{ animationDelay: '140ms' }}>
              مسار منصة لمكاتب الوساطة العقارية والمستشارين الماليين: تحسب الاستحقاق التمويلي، تقارن عروض البنوك السعودية جنباً إلى جنب، وتصدر عرض السعر باسم مكتبك.
            </p>
            <div className="flex flex-wrap gap-3 mt-9 animate-rise" style={{ animationDelay: '200ms' }}>
              <Link to="/app" className="group px-6 py-3.5 rounded-xl bg-gold-400 text-ink-950 font-semibold hover:bg-gold-300 transition flex items-center gap-2">
                افتح النسخة التجريبية <Icon name="arrow" className="w-4 h-4 transition group-hover:-translate-x-1" />
              </Link>
              <a href="#pricing" className="px-6 py-3.5 rounded-xl border border-sand-200/25 text-sand-50 font-semibold hover:bg-white/5">الباقات والأسعار</a>
            </div>
            <dl className="grid grid-cols-3 gap-6 mt-14 max-w-md border-t border-white/10 pt-6">
              <div><dt className="text-[11px] text-sand-200/60">بنوك مدعومة</dt><dd className="font-display text-2xl num">5</dd></div>
              <div><dt className="text-[11px] text-sand-200/60">قطاعات وظيفية</dt><dd className="font-display text-2xl num">4</dd></div>
              <div><dt className="text-[11px] text-sand-200/60">زمن الحساب</dt><dd className="font-display text-2xl">لحظي</dd></div>
            </dl>
          </div>
          <div className="text-ink-900 lg:-mb-48"><HeroCalculator /></div>
        </div>
      </section>

      {/* HOW */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-24 lg:pt-56 pb-20">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-10">
          <h2 className="font-display text-3xl sm:text-4xl text-ink-900 leading-snug">ثلاث خطوات،<br />بدلاً من خمس مكالمات للبنوك.</h2>
          <ol className="grid sm:grid-cols-3 gap-6">
            {[
              ['أدخل بيانات العميل', 'الراتب، البدلات، القطاع، العمر، والالتزامات القائمة.'],
              ['قارن العروض لحظياً', 'أقصى تمويل والقسط والأرباح لكل بنك مفعّل.'],
              ['أصدر العرض', 'تقرير استحقاق وعرض سعر باسم مكتبك، جاهز للطباعة.'],
            ].map(([t, b], i) => (
              <li key={t} className={`relative ${i === 1 ? 'sm:mt-10' : i === 2 ? 'sm:mt-20' : ''}`}>
                <span className="font-display text-6xl text-sand-300 leading-none">{i + 1}</span>
                <p className="font-bold text-ink-900 mt-2">{t}</p>
                <p className="text-sm text-ink-500 mt-1">{b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
        <p className="text-xs font-semibold text-gold-600">المزايا</p>
        <h2 className="font-display text-3xl sm:text-4xl text-ink-900 mt-2 max-w-xl">كل ما يحتاجه المستشار التمويلي في شاشة واحدة.</h2>
        <div className="grid lg:grid-cols-12 gap-4 mt-10">
          {FEATURES.map((f) => (
            <article key={f.title} className={`${f.span} rounded-3xl p-7 border transition hover:-translate-y-1 ${f.dark ? 'bg-ink-900 text-sand-50 border-ink-900 relative overflow-hidden grain' : 'bg-white border-sand-200'}`}>
              {f.dark && <div className="absolute inset-0 lattice" aria-hidden="true" />}
              <div className="relative h-full flex flex-col">
                <span className={`w-11 h-11 rounded-xl grid place-items-center ${f.dark ? 'bg-gold-400 text-ink-950' : 'bg-sand-100 text-ink-800'}`}><Icon name={f.icon} /></span>
                <h3 className={`font-bold mt-5 ${f.dark ? 'font-display text-2xl' : 'text-lg'}`}>{f.title}</h3>
                <p className={`text-sm mt-2 leading-relaxed ${f.dark ? 'text-sand-200/80 max-w-md' : 'text-ink-500'}`}>{f.body}</p>
                {f.dark && (
                  <div className="mt-auto pt-10 grid grid-cols-3 gap-3 text-center">
                    {[['دخل أقل من 15 ألف', '55%'], ['15 ألف فأكثر', '65%'], ['مستفيد من سكني', '65%']].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-white/5 border border-white/10 py-4"><p className="font-display text-2xl text-gold-300 num">{v}</p><p className="text-[11px] text-sand-200/60">{k}</p></div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* COMPLIANCE */}
      <section id="compliance" className="bg-sand-100 border-y border-sand-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold text-gold-600">الامتثال</p>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-900 mt-2">الضوابط مدمجة في الحساب، لا في ذاكرة الموظف.</h2>
            <p className="text-ink-600 mt-4 leading-relaxed">كل حساب في مسار يطبق ضوابط التمويل العقاري المسؤول تلقائياً، فلا يحصل العميل على رقم لا يستطيع البنك اعتماده. وكل تقرير يحمل تنبيهاً واضحاً بأن النتيجة استرشادية.</p>
          </div>
          <ul className="grid sm:grid-cols-2 gap-3">
            {RULES.map(([v, t]) => (
              <li key={v + t} className="rounded-2xl bg-white border border-sand-200 p-5">
                <p className="font-display text-4xl text-ink-800 num">{v}</p>
                <p className="text-sm text-ink-600 mt-2">{t}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 sm:px-8 py-24">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <p className="text-xs font-semibold text-gold-600">الأسعار</p>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-900 mt-2">باقات شهرية بالريال، بدون عقود طويلة.</h2>
          </div>
          <p className="text-sm text-ink-500">الأسعار لا تشمل ضريبة القيمة المضافة</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-10 items-stretch">
          {PLANS.map((p) => (
            <div key={p.name} className={`rounded-3xl p-7 border flex flex-col ${p.featured ? 'bg-ink-900 text-sand-50 border-ink-900 md:-translate-y-4 shadow-2xl relative overflow-hidden grain' : 'bg-white border-sand-200'}`}>
              {p.featured && <div className="absolute inset-0 lattice" aria-hidden="true" />}
              <div className="relative flex flex-col h-full">
                <p className="font-bold">{p.name}</p>
                <p className={`text-xs mt-1 ${p.featured ? 'text-gold-300' : 'text-ink-500'}`}>{p.note}</p>
                <p className="mt-6"><span className="font-display text-4xl num">{p.price}</span>{p.price !== 'حسب الطلب' && <span className={`text-sm ms-1 ${p.featured ? 'text-sand-200/70' : 'text-ink-500'}`}>ر.س / شهرياً</span>}</p>
                <ul className="mt-6 space-y-2.5 text-sm flex-1">
                  {p.items.map((it) => <li key={it} className="flex gap-2"><Icon name="check" className={`w-4 h-4 mt-0.5 shrink-0 ${p.featured ? 'text-gold-400' : 'text-ink-600'}`} />{it}</li>)}
                </ul>
                <Link to="/app" className={`mt-8 text-center py-3 rounded-xl font-semibold text-sm transition ${p.featured ? 'bg-gold-400 text-ink-950 hover:bg-gold-300' : 'bg-sand-100 text-ink-900 hover:bg-sand-200'}`}>
                  {p.price === 'حسب الطلب' ? 'تواصل مع المبيعات' : 'ابدأ بالنسخة التجريبية'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-5 sm:px-8 pb-24">
        <h2 className="font-display text-3xl text-ink-900 text-center">أسئلة متكررة</h2>
        <div className="mt-8 divide-y divide-sand-200 border-y border-sand-200">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex justify-between items-center cursor-pointer list-none font-semibold text-ink-900">
                {q}<Icon name="plus" className="w-4 h-4 text-ink-400 transition group-open:rotate-45" />
              </summary>
              <p className="text-sm text-ink-600 mt-3 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA + FOOTER */}
      <footer className="bg-ink-950 text-sand-50 relative grain">
        <div className="absolute inset-0 lattice opacity-50" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-16 flex flex-col md:flex-row gap-8 justify-between md:items-center">
          <h2 className="font-display text-3xl max-w-md">جرّب حساب أول عميل الآن، دون تسجيل.</h2>
          <Link to="/app" className="self-start px-6 py-3.5 rounded-xl bg-gold-400 text-ink-950 font-semibold hover:bg-gold-300">افتح المنصة</Link>
        </div>
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 justify-between text-xs text-sand-200/50">
          <Logo light />
          <p>© 2026 مسار. الحسابات استرشادية ولا تُغني عن دراسة البنك.</p>
        </div>
      </footer>
    </div>
  );
}
