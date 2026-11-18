import type { Bank, Client } from './finance';
// الأرقام الأصلية في المشروع بيانات تجريبية غير موثّقة؛ يجب استبدالها قبل الاستخدام المهني.
export const DEFAULT_BANKS: Bank[] = [
  { id: 'rajhi', name: 'مصرف الراجحي', short: 'ر', color: '#2f6b5a', aprGov: 4.25, aprPrivate: 4.65, maxTenure: 30, minDownPayment: 10, active: true },
  { id: 'snb', name: 'البنك الأهلي السعودي', short: 'أ', color: '#3f6f86', aprGov: 4.15, aprPrivate: 4.55, maxTenure: 30, minDownPayment: 10, active: true },
  { id: 'riyad', name: 'بنك الرياض', short: 'ر', color: '#5b5f8f', aprGov: 4.3, aprPrivate: 4.7, maxTenure: 30, minDownPayment: 10, active: true },
  { id: 'inma', name: 'مصرف الإنماء', short: 'إ', color: '#8a6a3b', aprGov: 4.2, aprPrivate: 4.6, maxTenure: 30, minDownPayment: 10, active: true },
  { id: 'albilad', name: 'بنك البلاد', short: 'ب', color: '#9a5b45', aprGov: 4.35, aprPrivate: 4.75, maxTenure: 25, minDownPayment: 10, active: true },
].map(b => ({ ...b, calculationModel: 'reducing', minIncome: 0, maxDebtRatioPct: 0, maxAgeAtMaturity: 0,
  acceptedSectors: [], allowFlexible: false, pricingRules: [], rateSource: 'بيانات توضيحية موروثة من النموذج الأولي', rateUpdatedAt: '' }));
export const DEFAULT_CLIENT: Client = {
  clientName: '', clientPhone: '', sector: 'gov', salaryBankId: '', age: 30, retirementAge: 60,
  basicSalary: 0, housingAllowance: 0, isSakaniSupported: false,
  hasExistingObligations: false, personalLoanPayment: 0, personalLoanMonthsLeft: 0,
  carLoanPayment: 0, creditCardLimit: 0, desiredTenureYears: 25,
  propertyValue: 0, useFlexible2in1: false,
};
export const DEFAULT_AGENCY = { agencyName: 'مكتبي للوساطة العقارية', agentName: '', agentPhone: '' };
export type Stage = 'new' | 'evaluated' | 'docs' | 'submitted' | 'review' | 'approved' | 'rejected' | 'completed';
export const STAGES: Record<Stage, { label: string; tone: string }> = {
  new: { label: 'استقبال العميل', tone: 'bg-sand-100 text-ink-700' },
  evaluated: { label: 'تم حساب الاستحقاق', tone: 'bg-sky-100 text-sky-800' },
  docs: { label: 'استكمال المستندات', tone: 'bg-amber-100 text-amber-800' },
  submitted: { label: 'تم رفع الطلب', tone: 'bg-teal-100 text-teal-800' },
  review: { label: 'تحت دراسة البنك', tone: 'bg-violet-100 text-violet-800' },
  approved: { label: 'موافقة مبدئية', tone: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'مرفوض / تعذّر', tone: 'bg-red-100 text-red-700' },
  completed: { label: 'مكتمل', tone: 'bg-green-100 text-green-800' },
};
export interface ClientRecord {
  id: string; name: string; phone: string; sector: Client['sector']; income: number;
  bestBank: string; bestAmount: number; stage: Stage; updated: string;
  clientSnapshot?: Client;
  selectedBankId?: string;
  reference?: string;
  submittedAt?: string;
  followUpAt?: string;
  notes?: string;
}
// لا نزرع بيانات عملاء اصطناعية قد تختلط بالعمل الحقيقي.
export const SAMPLE_RECORDS: ClientRecord[] = [];
