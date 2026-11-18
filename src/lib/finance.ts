// محرك تقديري قابل للضبط: لا يُعد عرضاً ملزماً أو قراراً ائتمانياً أو تطبيقاً معتمداً للوائح.
export const FINANCE = {
  dbrStandard: 0.55,
  dbrHigh: 0.65,
  highIncomeThreshold: 15000,
  creditCardFactor: 0.05,
  maxTenureYears: 30,
};
export type Sector = 'gov' | 'military' | 'private_acc' | 'private_unacc';
export const SECTORS: [Sector, string][] = [
  ['gov', 'حكومي مدني'], ['military', 'عسكري'],
  ['private_acc', 'قطاع خاص معتمد'], ['private_unacc', 'قطاع خاص غير معتمد'],
];
export const sectorName = (id: Sector) => SECTORS.find(([key]) => key === id)?.[1] ?? 'غير محدد';

export interface Client {
  clientName: string; clientPhone: string; sector: Sector;
  salaryBankId?: string; // البنك المحوّل إليه الراتب إن وجد
  age: number; retirementAge: number; basicSalary: number; housingAllowance: number;
  isSakaniSupported: boolean; hasExistingObligations: boolean;
  personalLoanPayment: number; personalLoanMonthsLeft: number;
  carLoanPayment: number; creditCardLimit: number;
  desiredTenureYears: number; propertyValue: number; useFlexible2in1: boolean;
}
export type RateSector = Sector | 'any';
export type SupportCondition = 'any' | 'yes' | 'no';
export type CalculationModel = 'reducing' | 'flat';

/** القواعد بالترتيب: أول قاعدة مفعّلة ومطابقة للعميل هي التي تطبّق. */
export interface BankPricingRule {
  id: string;
  label: string;
  sector: RateSector;
  support: SupportCondition;
  salaryTransfer?: SupportCondition; // تحويل الراتب لهذا البنك
  minIncome: number;
  maxIncome: number; // 0 = بلا سقف
  annualRate: number;
  enabled: boolean;
}
export interface Bank {
  id: string; name: string; short: string; color: string;
  aprGov: number; aprPrivate: number; maxTenure: number;
  minDownPayment: number; active: boolean;
  calculationModel?: CalculationModel;
  minIncome?: number;
  maxDebtRatioPct?: number; // 0 = استخدام الاستقطاع الافتراضي العام
  maxAgeAtMaturity?: number; // 0 = غير مقيّد بشرط إضافي
  acceptedSectors?: Sector[]; // [] = جميع القطاعات
  allowFlexible?: boolean;
  pricingRules?: BankPricingRule[];
  rateSource?: string;
  rateUpdatedAt?: string;
}
export interface Capacity {
  totalIncome: number; maxDBR: number; totalObligations: number;
  netAvailablePMT: number; yearsToRetirement: number; effectiveTenureYears: number;
}
export interface Offer {
  bank: Bank;
  apr: number;
  pricingLabel: string;
  calculationModel: CalculationModel;
  tenureYears: number; maxLoanAmount: number;
  monthlyPMT: number; laterMonthlyPMT: number; firstPeriodMonths: number;
  totalProfit: number; totalRepayment: number; requiredDownPayment: number;
  cappedByPropertyValue: boolean;
}
const validNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const num = (v: unknown) => validNum(v) ? Math.max(0, v as number) : 0;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const formatSAR = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(Number.isFinite(n) ? n : 0)) + ' ر.س';
export const formatNum = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(Number.isFinite(n) ? n : 0));
const presentValue = (pmt: number, r: number, n: number) => n <= 0 ? 0 : r > 0 ? (pmt * (1 - Math.pow(1 + r, -n))) / r : pmt * n;

export function calcCapacity(c: Client): Capacity {
  const totalIncome = num(c.basicSalary) + num(c.housingAllowance);
  const maxDBR = c.isSakaniSupported || totalIncome > FINANCE.highIncomeThreshold ? FINANCE.dbrHigh : FINANCE.dbrStandard;
  const totalObligations = c.hasExistingObligations ? num(c.personalLoanPayment) + num(c.carLoanPayment) + num(c.creditCardLimit) * FINANCE.creditCardFactor : 0;
  const netAvailablePMT = Math.max(0, totalIncome * maxDBR - totalObligations);
  const yearsToRetirement = validNum(c.age) && validNum(c.retirementAge) ? c.retirementAge - c.age : 0;
  const effectiveTenureYears = Math.max(0, Math.min(num(c.desiredTenureYears), yearsToRetirement, FINANCE.maxTenureYears));
  return { totalIncome, maxDBR, totalObligations, netAvailablePMT, yearsToRetirement, effectiveTenureYears };
}

export function bankAvailablePayment(cap: Capacity, b: Bank): number {
  const dbr = Number.isFinite(b.maxDebtRatioPct) && (b.maxDebtRatioPct ?? 0) > 0 && (b.maxDebtRatioPct ?? 0) <= 100
    ? (b.maxDebtRatioPct ?? 0) / 100 : cap.maxDBR;
  return Math.max(0, cap.totalIncome * dbr - cap.totalObligations);
}
export function evaluateBank(c: Client, b: Bank, cap: Capacity): string[] {
  const reasons: string[] = [];
  if (!b.active) reasons.push('البنك غير مفعّل');
  if (!Number.isFinite(c.basicSalary) || c.basicSalary < 0 || cap.totalIncome <= 0) reasons.push('لا يوجد دخل شهري صالح');
  if (!Number.isFinite(c.age) || c.age <= 0 || cap.effectiveTenureYears <= 0) reasons.push('العمر أو المدة غير صالحين');
  if (bankAvailablePayment(cap, b) <= 0) reasons.push('لا توجد قدرة شهرية بعد الالتزامات');
  if (num(b.minIncome) > cap.totalIncome) reasons.push(`الحد الأدنى للدخل في الإعدادات: ${formatSAR(num(b.minIncome))}`);
  if (b.acceptedSectors?.length && !b.acceptedSectors.includes(c.sector)) reasons.push('القطاع غير متاح وفق إعدادات البنك');
  if (num(b.maxAgeAtMaturity) > 0 && c.age >= num(b.maxAgeAtMaturity)) reasons.push('العمر يتجاوز الحد المحدد في الإعدادات');
  if (!validNum(b.maxTenure) || b.maxTenure <= 0 || b.maxTenure > FINANCE.maxTenureYears) reasons.push('مدة البنك غير صالحة');
  if (!validNum(b.minDownPayment) || b.minDownPayment < 0 || b.minDownPayment >= 100) reasons.push('الدفعة الأولى غير صالحة');
  return reasons;
}

export function matchBankRate(c: Client, b: Bank, totalIncome: number): { rate: number; label: string } {
  // لا تُستنتج شروط البنوك الرسمية؛ تُطابق القواعد التي يدخلها المستشار ويؤكد مصدرها.
  const rule = (b.pricingRules ?? []).find((item) => item.enabled &&
    (item.sector === 'any' || item.sector === c.sector) &&
    (item.support === 'any' || (item.support === 'yes') === c.isSakaniSupported) &&
    (!item.salaryTransfer || item.salaryTransfer === 'any' || (item.salaryTransfer === 'yes') === (c.salaryBankId === b.id)) &&
    totalIncome >= num(item.minIncome) &&
    (num(item.maxIncome) === 0 || totalIncome <= num(item.maxIncome)));
  if (rule) return { rate: rule.annualRate, label: rule.label || 'قاعدة مخصصة' };
  const gov = c.sector === 'gov' || c.sector === 'military';
  return { rate: gov ? b.aprGov : b.aprPrivate, label: gov ? 'النسبة الأساسية للقطاع الحكومي/العسكري' : 'النسبة الأساسية للقطاع الخاص' };
}

export function calcOffers(c: Client, banks: Bank[], cap: Capacity): Offer[] {
  return banks.flatMap((bank): Offer[] => {
    if (evaluateBank(c, bank, cap).length) return [];
    const { rate: apr, label: pricingLabel } = matchBankRate(c, bank, cap.totalIncome);
    if (!validNum(apr) || apr < 0 || apr > 100) return [];
    const ageLimitYears = num(bank.maxAgeAtMaturity) ? num(bank.maxAgeAtMaturity) - c.age : Infinity;
    const tenureYears = Math.min(cap.effectiveTenureYears, bank.maxTenure, ageLimitYears);
    const n = Math.round(tenureYears * 12);
    if (n <= 0) return [];
    const flexible = c.useFlexible2in1 && c.hasExistingObligations && num(c.personalLoanPayment) > 0 && num(c.personalLoanMonthsLeft) > 0 && bank.allowFlexible === true;
    const firstPeriodMonths = flexible ? clamp(Math.round(num(c.personalLoanMonthsLeft)), 0, n) : n;
    const pmt1 = bankAvailablePayment(cap, bank);
    const pmt2 = flexible ? pmt1 + num(c.personalLoanPayment) : pmt1;
    const r = apr / 100 / 12;
    const pv = presentValue(pmt1, r, firstPeriodMonths) +
      presentValue(pmt2, r, n - firstPeriodMonths) / Math.pow(1 + r, firstPeriodMonths);
    const model: CalculationModel = bank.calculationModel === 'flat' ? 'flat' : 'reducing';
    // المعدل الثابت هنا نموذج تدريبي مختلف عن رصيد متناقص، وليس وصفاً مؤكداً لأي بنك.
    const totalBudget = pmt1 * firstPeriodMonths + pmt2 * (n - firstPeriodMonths);
    const byCapacity = model === 'flat' ? totalBudget / (1 + apr / 100 * tenureYears) : pv;
    if (!Number.isFinite(byCapacity) || byCapacity <= 0) return [];
    const property = num(c.propertyValue);
    const byProperty = property > 0 ? property * (1 - bank.minDownPayment / 100) : Infinity;
    const loan = Math.min(byCapacity, byProperty);
    if (!Number.isFinite(loan) || loan <= 0) return [];
    const ratio = loan / byCapacity;
    const firstPayment = (firstPeriodMonths === 0 ? pmt2 : pmt1) * ratio;
    const laterPayment = (firstPeriodMonths === n ? pmt1 : pmt2) * ratio;
    const totalRepayment = firstPayment * firstPeriodMonths + laterPayment * (n - firstPeriodMonths);
    return [{
      bank, apr, pricingLabel, calculationModel: model, tenureYears,
      maxLoanAmount: Math.round(loan), monthlyPMT: Math.round(firstPayment),
      laterMonthlyPMT: Math.round(laterPayment), firstPeriodMonths,
      totalProfit: Math.round(Math.max(0, totalRepayment - loan)),
      totalRepayment: Math.round(totalRepayment),
      requiredDownPayment: Math.round(property > 0 ? property - loan : 0),
      cappedByPropertyValue: loan < byCapacity - 0.01,
    }];
  });
}
export const pickBestOffer = (offers: Offer[]) => offers.reduce<Offer | null>((best, o) => !best || o.maxLoanAmount > best.maxLoanAmount ? o : best, null);

export type CheckStatus = 'ok' | 'warn' | 'fail';
export const OVERALL: Record<CheckStatus, string> = { ok: 'تقدير أولي إيجابي', warn: 'تقدير يحتاج مراجعة', fail: 'لا يمكن تقدير التمويل' };
export function eligibilityChecks(c: Client, cap: Capacity, best: Offer | null) {
  const list: { label: string; status: CheckStatus; note: string }[] = [];
  const add = (label: string, status: CheckStatus, note: string) => list.push({ label, status, note });
  const yrs = cap.yearsToRetirement;
  add('السن والتقاعد', yrs >= 5 ? 'ok' : yrs > 0 ? 'warn' : 'fail', yrs > 0 ? `متبقي ${yrs} سنة للتقاعد، والمدة المحسوبة ${cap.effectiveTenureYears} سنة` : 'يرجى التحقق من العمر وسن التقاعد');
  add('القدرة الشهرية', cap.netAvailablePMT > 0 && cap.totalIncome > 0 ? 'ok' : 'fail', `القسط النظري ${formatSAR(cap.netAvailablePMT)} بنسبة استقطاع افتراضية ${Math.round(cap.maxDBR * 100)}%`);
  add('الالتزامات القائمة', cap.totalObligations / Math.max(1, cap.totalIncome) > 0.3 ? 'warn' : 'ok', `إجمالي الالتزامات ${formatSAR(cap.totalObligations)} شهرياً`);
  add('القطاع الوظيفي', c.sector === 'private_unacc' ? 'warn' : 'ok', 'يختلف قبول القطاع من بنك لآخر، راجع سياسة البنك الحالية');
  if (!best) add('عروض البنوك', 'fail', 'لا توجد عروض وفق الإعدادات والمدخلات الحالية');
  else if (num(c.propertyValue) > 0) add('قيمة العقار', best.cappedByPropertyValue ? 'ok' : 'warn', best.cappedByPropertyValue ? 'التمويل مقيد بحد الدفعة الأولى الافتراضي' : `القيمة التمويلية ${formatSAR(best.maxLoanAmount)}، ويحتاج الفرق إلى تغطية`);
  const overall: CheckStatus = list.some((i) => i.status === 'fail') ? 'fail' : list.some((i) => i.status === 'warn') ? 'warn' : 'ok';
  return { list, overall };
}
