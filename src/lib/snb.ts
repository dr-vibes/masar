// SNB Excel reference calculation.
// Estimates only; not a credit approval or verified bank policy.

export type SNBProduct = 'supported' | 'standard';

export interface SNBInput {
  product: SNBProduct;
  monthlySalary: number;
  monthlyPension: number;
  personalLoanPayment: number;
  otherPayments: number;
  firstMonths: number;
  secondMonths: number;
  thirdMonths: number;
  annualFlatMarginPct: number;
}

export interface SNBResult {
  deductionRatio: number;
  firstPayment: number;
  secondPayment: number;
  thirdPayment: number;
  totalMonths: number;
  totalRepayment: number;
  netFinancing: number;
  totalProfit: number;
  hasNonPositiveActivePayment: boolean;
}

export function calculateSNB(input: SNBInput): SNBResult {
  if (input.product !== 'supported' && input.product !== 'standard') {
    throw new RangeError('Invalid SNB product');
  }

  const amounts = [
    input.monthlySalary,
    input.monthlyPension,
    input.personalLoanPayment,
    input.otherPayments,
    input.annualFlatMarginPct,
  ];

  if (amounts.some(v => !Number.isFinite(v) || v < 0)) {
    throw new RangeError('Invalid financial input');
  }

  const months = [
    input.firstMonths,
    input.secondMonths,
    input.thirdMonths,
  ];

  if (months.some(v => !Number.isSafeInteger(v) || v < 0)) {
    throw new RangeError('Invalid period length');
  }

  const totalMonths = months.reduce((a, b) => a + b, 0);

  if (totalMonths <= 0) {
    throw new RangeError('Financing period must be positive');
  }

  const deductionRatio = input.product === 'supported'
    ? 0.65
    : 0.55;

  const firstPayment =
    input.monthlySalary * deductionRatio
    - input.personalLoanPayment
    - input.otherPayments;

  const secondPayment =
    input.monthlySalary * deductionRatio
    - input.otherPayments;

  const thirdPayment =
    input.monthlyPension * deductionRatio;

  const totalRepayment =
    firstPayment * input.firstMonths
    + secondPayment * input.secondMonths
    + thirdPayment * input.thirdMonths;

  const years = totalMonths / 12;

  const netFinancing =
    totalRepayment /
    (1 + input.annualFlatMarginPct / 100 * years);

  const totalProfit = totalRepayment - netFinancing;

  const hasNonPositiveActivePayment =
    (input.firstMonths > 0 && firstPayment <= 0) ||
    (input.secondMonths > 0 && secondPayment <= 0) ||
    (input.thirdMonths > 0 && thirdPayment <= 0);

  return {
    deductionRatio,
    firstPayment,
    secondPayment,
    thirdPayment,
    totalMonths,
    totalRepayment,
    netFinancing,
    totalProfit,
    hasNonPositiveActivePayment,
  };
}


// Pension formula reproduced from tested SNB Excel scenarios.
// Service years are supplied explicitly; retirement dates are not inferred.
export type SNBEmploymentType = 'civilian' | 'military';

export function calculateSNBReferencePension(
  basicSalary: number,
  serviceYears: number,
  employmentType: SNBEmploymentType
): number {
  if (
    !Number.isFinite(basicSalary) ||
    basicSalary < 0 ||
    !Number.isFinite(serviceYears) ||
    serviceYears < 0
  ) {
    throw new RangeError('Invalid pension inputs');
  }

  if (employmentType !== 'civilian' && employmentType !== 'military') {
    throw new RangeError('Invalid employment type');
  }

  const divisor = employmentType === 'civilian' ? 40 : 35;
  return basicSalary * serviceYears / divisor;
}


// Service-year calculations based on SNB Excel Sheet2 C8 and C10.
// The reference date is supplied explicitly, not taken from the system clock.
export interface SNBServiceDates {
  appointmentYear: number;
  appointmentMonth: number;
  birthYear: number;
  birthMonth: number;
  referenceYear: number;
  referenceMonth: number;
  retirementAge: number;
}

export function calculateSNBReferenceServiceYears(input: SNBServiceDates) {
  const years = [
    input.appointmentYear, input.birthYear, input.referenceYear
  ];

  const months = [
    input.appointmentMonth, input.birthMonth, input.referenceMonth
  ];

  if (
    years.some(v => !Number.isSafeInteger(v) || v <= 0) ||
    months.some(v => !Number.isSafeInteger(v) || v < 1 || v > 12) ||
    !Number.isFinite(input.retirementAge) ||
    input.retirementAge <= 0
  ) {
    throw new RangeError('Invalid SNB service dates');
  }

  const birthIndex = input.birthYear * 12 + input.birthMonth;
  const appointmentIndex = input.appointmentYear * 12 + input.appointmentMonth;
  const referenceIndex = input.referenceYear * 12 + input.referenceMonth;

  if (
    birthIndex > referenceIndex ||
    appointmentIndex < birthIndex ||
    appointmentIndex > referenceIndex ||
    appointmentIndex > birthIndex + input.retirementAge * 12
  ) {
    throw new RangeError('Invalid chronological order in SNB service dates');
  }

  const appointment = input.appointmentYear + input.appointmentMonth / 12;
  const birth = input.birthYear + input.birthMonth / 12;
  const reference = input.referenceYear + input.referenceMonth / 12;

  const serviceYears = reference - appointment;
  const yearsToRetirement = input.retirementAge - (reference - birth);

  return {
    serviceYears,
    yearsToRetirement,
    serviceYearsAtRetirement: serviceYears + yearsToRetirement,
  };
}
