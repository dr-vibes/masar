import assert from 'node:assert/strict';
import { build } from 'esbuild';

const output = await build({
  entryPoints: ['src/lib/snbOffer.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  logLevel: 'silent'
});

const encoded = Buffer.from(output.outputFiles[0].text).toString('base64');
const { buildSNBReferenceOffer } = await import(
  'data:text/javascript;base64,' + encoded
);

const bank = {
  id: 'snb',
  name: 'البنك الأهلي السعودي',
  short: 'SNB',
  color: '#006b57',
  aprGov: 4.15,
  aprPrivate: 4.55,
  maxTenure: 30,
  minDownPayment: 10,
  active: true
};

const input = {
  product: 'supported',
  monthlySalary: 10000,
  monthlyPension: 6500,
  personalLoanPayment: 1000,
  otherPayments: 500,
  firstMonths: 12,
  secondMonths: 108,
  thirdMonths: 60,
  annualFlatMarginPct: 4
};

const supported = buildSNBReferenceOffer(bank, input, 0);
assert.ok(supported);
assert.equal(supported.calculationSource, 'snb-reference');
assert.equal(supported.maxLoanAmount, 600938);
assert.equal(supported.totalRepayment, 961500);
assert.deepEqual(
  supported.paymentStages.map(s => [s.months, s.monthlyPayment]),
  [[12, 5000], [108, 6000], [60, 4225]]
);
console.log('SNB_SUPPORTED_OFFER=PASS');

const standard = buildSNBReferenceOffer(
  bank, { ...input, product: 'standard' }, 0
);
assert.ok(standard);
assert.equal(standard.maxLoanAmount, 501563);
const expectedStandardPayments = [4000, 5000, 3575];

assert.equal(
  standard.paymentStages.length,
  expectedStandardPayments.length
);

standard.paymentStages.forEach((stage, index) => {
  assert.ok(
    Math.abs(stage.monthlyPayment - expectedStandardPayments[index]) < 0.000001,
    `Standard payment mismatch at stage ${index + 1}`
  );
});
console.log('SNB_STANDARD_OFFER=PASS');

const capped = buildSNBReferenceOffer(bank, input, 500000);
assert.ok(capped);
assert.equal(capped.maxLoanAmount, 450000);
assert.equal(capped.requiredDownPayment, 50000);
assert.equal(capped.cappedByPropertyValue, true);
assert.ok(Math.abs(
  capped.paymentStages.reduce(
    (sum, stage) => sum + stage.months * stage.monthlyPayment, 0
  ) - capped.totalRepayment
) < 1);
console.log('SNB_PROPERTY_CAP=PASS');

assert.equal(
  buildSNBReferenceOffer(bank, { ...input, otherPayments: 5500 }, 0),
  null
);
console.log('SNB_INVALID_PAYMENT_EXCLUDED=PASS');

assert.equal(
  buildSNBReferenceOffer({ ...bank, active: false }, input, 0),
  null
);
console.log('SNB_INACTIVE_BANK_EXCLUDED=PASS');

console.log('SNB_OFFER_ADAPTER_TEST=PASS');
