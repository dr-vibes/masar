import { useEffect, type ReactNode } from 'react';
import { Icon, BankMark } from '../components/ui';
import { eligibilityChecks, formatSAR, OVERALL, sectorName, type Capacity, type Client, type Offer } from '../lib/finance';
import type { DEFAULT_AGENCY } from '../lib/sample';

const DISCLAIMER = 'هذه حسابات استرشادية بناءً على بيانات العميل وشروط ونسب أدخلها المستشار أو كانت افتراضية في البرنامج، ولا تمثل موافقة ائتمانية أو عرضاً مصرفياً ملزماً. تحقق من سياسة البنك وتكلفة التمويل السنوية الفعلية (APR) والرسوم قبل تقديم معلومات نهائية.';

function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade" role="dialog" aria-modal="true" onClick={onClose}>
      <div id="printable" className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto animate-rise" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const Row = ({ k, v, strong }: { k: string; v: ReactNode; strong?: boolean }) => (
  <div className="flex justify-between gap-4 py-2.5 border-b border-sand-100 last:border-0 text-sm">
    <span className="text-ink-500">{k}</span><span className={strong ? 'font-bold text-ink-900' : 'font-semibold text-ink-800'}>{v}</span>
  </div>
);

function DocHeader({ tag, agency }: { tag: string; agency: typeof DEFAULT_AGENCY }) {
  return (
    <div className="bg-ink-900 text-sand-50 p-6 sm:p-8 relative overflow-hidden grain">
      <div className="absolute inset-0 lattice" aria-hidden="true" />
      <div className="relative">
        <span className="text-[11px] font-semibold text-gold-300 tracking-wide">{tag}</span>
        <h2 className="font-display text-2xl mt-1">{agency.agencyName}</h2>
        <p className="text-xs text-sand-200/70 mt-1">{agency.agentName} · <span className="num">{agency.agentPhone}</span> · {new Date().toLocaleDateString('ar-SA')}</p>
      </div>
    </div>
  );
}

function Actions({ onClose, label }: { onClose: () => void; label: string }) {
  return (
    <div className="flex gap-3 pt-5 border-t border-sand-100 print:hidden">
      <button onClick={() => window.print()} className="flex-1 py-3 bg-ink-800 text-sand-50 rounded-xl text-sm font-semibold hover:bg-ink-700 flex items-center justify-center gap-2">
        <Icon name="download" className="w-4 h-4" />{label}
      </button>
      <button onClick={onClose} className="px-6 py-3 bg-sand-100 text-ink-700 rounded-xl text-sm font-semibold hover:bg-sand-200">إغلاق</button>
    </div>
  );
}

export function QuoteModal({ offer, client, agency, onClose }: { offer: Offer; client: Client; agency: typeof DEFAULT_AGENCY; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <DocHeader tag="عرض تمويلي استرشادي" agency={agency} />
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <BankMark color={offer.bank.color} short={offer.bank.short} />
          <div><p className="text-xs text-ink-500">الجهة التمويلية</p><p className="font-bold">{offer.bank.name}</p></div>
          <div className="me-auto text-left"><p className="text-xs text-ink-500">العميل</p><p className="font-bold">{client.clientName}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-sand-100 p-4"><p className="text-xs text-ink-500">أقصى مبلغ تمويل</p><p className="font-display text-2xl text-ink-900 num mt-1">{formatSAR(offer.maxLoanAmount)}</p></div>
          <div className="rounded-2xl border border-sand-200 p-4"><p className="text-xs text-ink-500">القسط الشهري</p><p className="font-display text-2xl text-ink-900 num mt-1">{formatSAR(offer.monthlyPMT)}</p></div>
        </div>
        <div>
          <Row k="معدل الربح الحسابي السنوي (غير APR رسمي)" v={<span className="num">{offer.apr}%</span>} />
          <Row k="شريحة التسعير المطبقة" v={offer.pricingLabel} />
          <Row k="طريقة الحساب" v={offer.calculationModel === "flat" ? "هامش ثابت افتراضي" : "الرصيد المتناقص افتراضي"} />
          <Row k="مصدر النسبة" v={offer.bank.rateSource || "غير محدد"} />
          <Row k="تاريخ مراجعة النسبة" v={offer.bank.rateUpdatedAt || "لم يحدد"} />
          <Row k="مدة التمويل" v={`${offer.tenureYears} سنة`} />
          <Row k="الدفعة أو التمويل الذاتي اللازم تقديرياً" v={<span className="num">{formatSAR(offer.requiredDownPayment)}</span>} />
          {offer.firstPeriodMonths > 0 && offer.laterMonthlyPMT !== offer.monthlyPMT && <Row k={`القسط بعد ${offer.firstPeriodMonths} شهر`} v={<span className="num">{formatSAR(offer.laterMonthlyPMT)}</span>} />}
          <Row k="إجمالي الأرباح" v={<span className="num">{formatSAR(offer.totalProfit)}</span>} />
          <Row k="إجمالي السداد" v={<span className="num">{formatSAR(offer.totalRepayment)}</span>} strong />
        </div>
        <p className="text-[11px] text-ink-400 leading-relaxed">{DISCLAIMER}</p>
        <Actions onClose={onClose} label="طباعة / حفظ PDF" />
      </div>
    </Modal>
  );
}

const TONE = {
  ok: { box: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-600', icon: 'check' as const },
  warn: { box: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500', icon: 'alert' as const },
  fail: { box: 'bg-red-50 text-red-800 border-red-200', dot: 'bg-red-600', icon: 'x' as const },
};

export function EligibilityModal({ client, capacity, best, agency, onClose }: { client: Client; capacity: Capacity; best: Offer | null; agency: typeof DEFAULT_AGENCY; onClose: () => void }) {
  const { list, overall } = eligibilityChecks(client, capacity, best);
  return (
    <Modal onClose={onClose}>
      <DocHeader tag="تقرير استحقاق العميل" agency={agency} />
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div><p className="font-bold text-lg">{client.clientName}</p><p className="text-xs text-ink-500">{sectorName(client.sector)} · دخل <span className="num">{formatSAR(capacity.totalIncome)}</span></p></div>
          <span className={`px-4 py-2 rounded-xl border text-sm font-bold ${TONE[overall].box}`}>{OVERALL[overall]}</span>
        </div>
        <ul className="space-y-2">
          {list.map((i) => (
            <li key={i.label} className="flex gap-3 p-3.5 rounded-xl bg-sand-50 border border-sand-100">
              <span className={`w-6 h-6 rounded-full grid place-items-center text-white shrink-0 ${TONE[i.status].dot}`}><Icon name={TONE[i.status].icon} className="w-3.5 h-3.5" /></span>
              <span><strong className="block text-sm">{i.label}</strong><span className="text-xs text-ink-500">{i.note}</span></span>
            </li>
          ))}
        </ul>
        {best && (
          <div className="rounded-2xl bg-ink-900 text-sand-50 p-5 flex justify-between items-center">
            <div><p className="text-xs text-sand-200/70">أعلى عرض · {best.bank.name}</p><p className="font-display text-2xl text-gold-300 num">{formatSAR(best.maxLoanAmount)}</p></div>
            <div className="text-left"><p className="text-xs text-sand-200/70">القسط</p><p className="font-bold num">{formatSAR(best.monthlyPMT)}</p></div>
          </div>
        )}
        <p className="text-[11px] text-ink-400 leading-relaxed">{DISCLAIMER}</p>
        <Actions onClose={onClose} label="طباعة التقرير" />
      </div>
    </Modal>
  );
}
