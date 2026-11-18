import { BankMark, Card, Icon } from '../components/ui';
import { formatSAR, type Offer } from '../lib/finance';
import { useWs } from './store';
import { PageHead } from './Calculator';
import { Link } from 'react-router-dom';

type Metric = { key: keyof Offer; label: string; better: 'high' | 'low'; fmt: (o: Offer) => string };
const METRICS: Metric[] = [
  { key: 'maxLoanAmount', label: 'أقصى مبلغ تمويل', better: 'high', fmt: (o) => formatSAR(o.maxLoanAmount) },
  { key: 'apr', label: 'المعدل السنوي التقديري (ليس APR رسمياً)', better: 'low', fmt: (o) => o.apr + '%' },
  { key: 'monthlyPMT', label: 'القسط الشهري', better: 'low', fmt: (o) => formatSAR(o.monthlyPMT) },
  { key: 'tenureYears', label: 'مدة التمويل', better: 'high', fmt: (o) => o.tenureYears + ' سنة' },
  { key: 'requiredDownPayment', label: 'الدفعة الأولى', better: 'low', fmt: (o) => formatSAR(o.requiredDownPayment) },
  { key: 'totalProfit', label: 'إجمالي الأرباح', better: 'low', fmt: (o) => formatSAR(o.totalProfit) },
  { key: 'totalRepayment', label: 'إجمالي السداد', better: 'low', fmt: (o) => formatSAR(o.totalRepayment) },
];

export default function Compare() {
  const { offers, client } = useWs();
  const bestIn = (m: Metric) => {
    const vals = offers.map((o) => o[m.key] as number);
    const target = m.better === 'high' ? Math.max(...vals) : Math.min(...vals);
    return new Set(offers.filter((o) => (o[m.key] as number) === target).map((o) => o.bank.id));
  };

  return (
    <>
      <PageHead eyebrow={`العميل: ${client.clientName || "جديد"}`} title="مقارنة عروض البنوك">
        <Link to="/app/calculator" className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-sand-200 hover:border-ink-300 flex items-center gap-1.5">
          <Icon name="arrow" className="w-4 h-4 rotate-180" />تعديل بيانات العميل
        </Link>
      </PageHead>

      {offers.length < 2 ? (
        <Card className="p-12 text-center">
          <Icon name="scale" className="w-9 h-9 mx-auto text-ink-300" />
          <p className="font-semibold mt-3">تحتاج بنكين مفعّلين على الأقل للمقارنة</p>
          <Link to="/app/rates" className="text-sm text-gold-600 font-semibold mt-2 inline-block">إدارة البنوك ←</Link>
        </Card>
      ) : (
        <Card className="overflow-x-auto animate-rise">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-sand-200">
                <th className="text-right font-semibold text-ink-500 text-xs p-4 w-44">البند</th>
                {offers.map((o) => (
                  <th key={o.bank.id} className="p-4 text-right">
                    <span className="flex items-center gap-2.5"><BankMark color={o.bank.color} short={o.bank.short} size="w-8 h-8 text-sm" /><span className="font-bold text-ink-900 text-[13px] leading-tight">{o.bank.name}</span></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => {
                const winners = bestIn(m);
                return (
                  <tr key={m.key} className="border-b border-sand-100 last:border-0 hover:bg-sand-50/60">
                    <td className="p-4 text-ink-500 text-xs">{m.label}<span className="block text-[10px] text-ink-300">{m.better === 'high' ? 'الأعلى أفضل' : 'الأقل أفضل'}</span></td>
                    {offers.map((o) => {
                      const win = winners.has(o.bank.id) && winners.size < offers.length;
                      return (
                        <td key={o.bank.id} className="p-4">
                          <span className={`num inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${win ? 'bg-gold-400/20 text-ink-900 font-bold' : 'text-ink-700'}`}>
                            {win && <Icon name="check" className="w-3.5 h-3.5 text-gold-600" />}{m.fmt(o)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <p className="text-[11px] text-ink-400 mt-4">الخلايا المظللة تشير إلى أفضل قيمة في كل بند. النسب تقريبية ولا تمثل عروضاً رسمية.</p>
    </>
  );
}
