import type { Bank, Offer } from './finance';
import { calculateSNB, type SNBInput } from './snb';

/**
 * Converts SNB reference calculations into MASAR's shared offer format.
 * This is not a complete bank-eligibility or credit-approval check.
 */
export function buildSNBReferenceOffer(
  bank: Bank,
  input: SNBInput,
  propertyValue: number,
): Offer | null {
  if (bank.id !== 'snb' || !bank.active) return null;

  if (!Number.isFinite(propertyValue) || propertyValue < 0) return null;

  if (
    !Number.isFinite(bank.minDownPayment) ||
    bank.minDownPayment < 0 ||
    bank.minDownPayment >= 100 ||
    !Number.isFinite(bank.maxTenure) ||
    bank.maxTenure <= 0
  ) return null;

  let result: ReturnType<typeof calculateSNB>;

  try {
    result = calculateSNB(input);
  } catch {
    return null;
  }

  if (
    result.hasNonPositiveActivePayment ||
    !Number.isFinite(result.netFinancing) ||
    result.netFinancing <= 0 ||
    result.totalMonths > 360 ||
    result.totalMonths > bank.maxTenure * 12
  ) return null;

  const propertyLimit = propertyValue > 0
    ? propertyValue * (1 - bank.minDownPayment / 100)
    : Infinity;

  const loan = Math.min(result.netFinancing, propertyLimit);

  if (!Number.isFinite(loan) || Math.round(loan) <= 0) {
    return null;
  }

  const ratio = loan / result.netFinancing;

  const paymentStages = [
    {
      label: 'الفترة الأولى',
      months: input.firstMonths,
      monthlyPayment: result.firstPayment * ratio,
    },
    {
      label: 'الفترة الثانية',
      months: input.secondMonths,
      monthlyPayment: result.secondPayment * ratio,
    },
    {
      label: 'فترة ما بعد التقاعد',
      months: input.thirdMonths,
      monthlyPayment: result.thirdPayment * ratio,
    },
  ].filter(stage => stage.months > 0);

  const repayment = paymentStages.reduce(
    (sum, stage) => sum + stage.months * stage.monthlyPayment,
    0,
  );

  const firstPayment = paymentStages[0].monthlyPayment;
  const secondPayment =
    paymentStages[1]?.monthlyPayment ?? firstPayment;

  return {
    bank,
    apr: input.annualFlatMarginPct,
    pricingLabel: input.product === 'supported'
      ? 'مرجع SNB مدعوم — غير معتمد'
      : 'مرجع SNB اعتيادي — غير معتمد',
    calculationModel: 'flat',
    tenureYears: result.totalMonths / 12,
    maxLoanAmount: Math.round(loan),
    monthlyPMT: Math.round(firstPayment),
    laterMonthlyPMT: Math.round(secondPayment),
    firstPeriodMonths: paymentStages[0].months,
    totalProfit: Math.round(repayment - loan),
    totalRepayment: Math.round(repayment),
    requiredDownPayment: Math.round(
      propertyValue > 0 ? Math.max(0, propertyValue - loan) : 0
    ),
    cappedByPropertyValue: loan < result.netFinancing - 0.01,
    paymentStages,
    calculationSource: 'snb-reference',
  };
}
