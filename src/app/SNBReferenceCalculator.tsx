import { useState } from 'react';
import { Card, Field, NumberField, inputCls } from '../components/ui';
import {
  calculateSNB,
  type SNBInput,
  type SNBProduct,
} from '../lib/snb';

const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' ر.س';

const fields = [
  { key: 'monthlySalary', label: 'الراتب المعتمد للتمويل' },
  { key: 'monthlyPension', label: 'الراتب التقاعدي' },
  { key: 'personalLoanPayment', label: 'القسط الشخصي' },
  { key: 'otherPayments', label: 'الالتزامات الأخرى' },
  { key: 'firstMonths', label: 'أشهر الفترة الأولى' },
  { key: 'secondMonths', label: 'أشهر الفترة الثانية' },
  { key: 'thirdMonths', label: 'أشهر فترة التقاعد' },
  { key: 'annualFlatMarginPct', label: 'هامش الربح السنوي (%)' },
] as const;

export default function SNBReferenceCalculator() {
  const [input, setInput] = useState<SNBInput>({
    product: 'supported',
    monthlySalary: 10000,
    monthlyPension: 6500,
    personalLoanPayment: 1000,
    otherPayments: 500,
    firstMonths: 12,
    secondMonths: 108,
    thirdMonths: 60,
    annualFlatMarginPct: 4,
  });

  const changeNumber = (
    key: Exclude<keyof SNBInput, 'product'>,
    value: number
  ) => setInput(previous => ({
    ...previous,
    [key]: value,
  }));

  let result: ReturnType<typeof calculateSNB> | null = null;
  let error = '';

  try {
    result = calculateSNB(input);
  } catch {
    error = 'راجع المدخلات ومدد التمويل؛ توجد قيمة غير صالحة.';
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="font-bold text-lg text-ink-900">
          حاسبة البنك الأهلي السعودي
        </h2>
        <p className="text-xs text-ink-500 mt-1">
          نسخة مرجعية تجريبية — ليست عرضًا أو موافقة ائتمانية
        </p>
      </div>

      <Field label="نوع التمويل">
        <select
          className={inputCls}
          value={input.product}
          onChange={event => setInput(previous => ({
            ...previous,
            product: event.target.value as SNBProduct,
          }))}
        >
          <option value="supported">مدعوم — 65%</option>
          <option value="standard">اعتيادي — 55%</option>
        </select>
      </Field>

      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map(field => (
          <NumberField
            key={field.key}
            label={field.label}
            value={input[field.key]}
            onChange={value => changeNumber(field.key, value)}
            min={0}
            step={field.key.endsWith('Months') ? 1 : 0.01}
          />
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-3 border-t border-sand-200 pt-5">
          <h3 className="font-bold">نتائج الفترات الثلاث</h3>

          {[
            ['القسط الأول', result.firstPayment],
            ['القسط الثاني', result.secondPayment],
            ['قسط ما بعد التقاعد', result.thirdPayment],
            ['إجمالي الأقساط', result.totalRepayment],
            ['إجمالي الأرباح', result.totalProfit],
            ['صافي التمويل الحسابي', result.netFinancing],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between gap-3 text-sm"
            >
              <span>{label}</span>
              <strong className="num">{money(value as number)}</strong>
            </div>
          ))}

          {result.hasNonPositiveActivePayment && (
            <p role="alert" className="text-sm text-red-700">
              تنبيه: توجد فترة نشطة بقسط صفري أو سالب.
              لا تُعتبر النتيجة تمويلًا متاحًا أو أهلية معتمدة.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
