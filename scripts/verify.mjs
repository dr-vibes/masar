import { createRequire } from 'node:module';
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const files=[];const scan=d=>{for(const n of fs.readdirSync(d)){const p=path.join(d,n);fs.statSync(p).isDirectory()?scan(p):(/\.tsx?$/.test(n)&&files.push(p));}};
scan('src');
let errors=0;
for(const f of files){const source=fs.readFileSync(f,'utf8');const parse=ts.createSourceFile(f,source,ts.ScriptTarget.ES2022,true,f.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 for(const d of parse.parseDiagnostics){console.log(f,d.messageText);errors++}}
console.log('Parsed files:',files.length,'syntax errors:',errors);assert.equal(errors,0);
function load(file){let src=fs.readFileSync(file,'utf8'); const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(js,{exports,require,console,Intl,Date,Math,Number,Object}, {filename:file});return exports;}
const f=load('src/lib/finance.ts');const samples=load('src/lib/sample.ts');const rent=load('src/lib/rentals.ts');
let c={...samples.DEFAULT_CLIENT,basicSalary:12000,housingAllowance:3000,age:32,retirementAge:60,desiredTenureYears:25,propertyValue:1500000};
let cap=f.calcCapacity(c);assert.equal(cap.totalIncome,15000);assert.equal(cap.maxDBR,0.55);
let offers=f.calcOffers(c,samples.DEFAULT_BANKS,cap);assert.equal(offers.length,5);
for(const o of offers){assert.ok(o.maxLoanAmount>0);assert.ok(o.totalProfit>=0);assert.ok(o.totalRepayment>=o.maxLoanAmount);
 const n=Math.round(o.tenureYears*12);assert.ok(Math.abs(o.totalRepayment-(o.monthlyPMT*o.firstPeriodMonths+o.laterMonthlyPMT*(n-o.firstPeriodMonths))) <= n*0.51);
 assert.ok(o.requiredDownPayment>=0);
}
assert.equal(f.calcOffers({...c,basicSalary:0,housingAllowance:0},samples.DEFAULT_BANKS,f.calcCapacity({...c,basicSalary:0,housingAllowance:0})).length,0);
const bank={...samples.DEFAULT_BANKS[0],pricingRules:[{id:'test',label:'شريحة دخل مرتفع مدعومة',sector:'private_acc',support:'yes',minIncome:20000,maxIncome:30000,annualRate:2.6,enabled:true}]};
const qualified={...c,sector:'private_acc',basicSalary:23000,isSakaniSupported:true};
assert.equal(f.matchBankRate(qualified,bank,23000).rate,2.6);
assert.notEqual(f.matchBankRate({...qualified,isSakaniSupported:false},bank,23000).rate,2.6);
assert.notEqual(f.matchBankRate({...qualified,basicSalary:12000},bank,12000).rate,2.6);
const transferBank={...bank,pricingRules:[{...bank.pricingRules[0],salaryTransfer:'yes'}]};
assert.notEqual(f.matchBankRate({...qualified,salaryBankId:''},transferBank,23000).rate,2.6);
assert.equal(f.matchBankRate({...qualified,salaryBankId:'rajhi'},transferBank,23000).rate,2.6);
const exact15={...c,basicSalary:15000,housingAllowance:0};assert.equal(f.calcCapacity(exact15).maxDBR,.55);
const above15={...c,basicSalary:15001,housingAllowance:0};assert.equal(f.calcCapacity(above15).maxDBR,.65);
const noSupport={...qualified,propertyValue:0,hasExistingObligations:true,personalLoanPayment:900,personalLoanMonthsLeft:20,useFlexible2in1:true};
const reducing=f.calcOffers(noSupport,[{...bank,allowFlexible:true,calculationModel:'reducing',pricingRules:[]}],f.calcCapacity(noSupport))[0];
assert.ok(reducing.laterMonthlyPMT>reducing.monthlyPMT);
const flat=f.calcOffers(noSupport,[{...bank,allowFlexible:true,calculationModel:'flat',pricingRules:[]}],f.calcCapacity(noSupport))[0];
assert.ok(flat.maxLoanAmount<reducing.maxLoanAmount);assert.ok(flat.laterMonthlyPMT>flat.monthlyPMT);
const minIncomeBanks=[{...bank,minIncome:999999}];assert.equal(f.calcOffers(qualified,minIncomeBanks,f.calcCapacity(qualified)).length,0);
const openValue={...qualified,propertyValue:0};const maxRatioBanks=[{...bank,maxDebtRatioPct:30}];const reduced=f.calcOffers(openValue,maxRatioBanks,f.calcCapacity(openValue))[0];
const normal=f.calcOffers(openValue,[bank],f.calcCapacity(openValue))[0];assert.ok(reduced.maxLoanAmount<normal.maxLoanAmount);
const unit={id:'u',projectId:'p',number:'A-1',tenantName:'X',tenantPhone:'',monthlyRent:2500,dueDay:5,leaseStart:'2026-01-01',leaseEnd:'2026-12-31'};
const arrears=rent.overdueRentRows([unit],[], '2026-11-17');assert.equal(arrears.length,11);assert.equal(arrears.reduce((sum,r)=>sum+r.remaining,0),27500);
let row=rent.rentRow(unit,[],'2026-11','2026-11-17');assert.equal(row.status,'overdue');assert.equal(row.remaining,2500);
row=rent.rentRow(unit,[{id:'p1',unitId:'u',period:'2026-11',amount:1500,date:'2026-11-07',method:'cash',reference:''}], '2026-11','2026-11-17');
assert.equal(row.remaining,1000);assert.equal(row.status,'overdue');
row=rent.rentRow(unit,[{id:'p1',unitId:'u',period:'2026-11',amount:2500,date:'2026-11-07',method:'cash',reference:''}], '2026-11','2026-11-17');assert.equal(row.status,'paid');
assert.equal(rent.isActiveInMonth(unit,'2027-01'),false);
console.log('Finance and rent checks passed: valid scenarios, per-bank rules, zero income, flexible/flat, dues, partial payments.');


// MASAR SNB Excel reference tests
const snb = load('src/lib/snb.ts');

const snbBase = {
  product: 'supported',
  monthlySalary: 10000,
  monthlyPension: 0,
  personalLoanPayment: 1000,
  otherPayments: 500,
  firstMonths: 12,
  secondMonths: 168,
  thirdMonths: 0,
  annualFlatMarginPct: 4,
};

const military26 = 10000 * 26 / 35;
const military22 = 10000 * 22 / 35;

// name, changes, first, second, third, repayment, financing, warning
const snbCases = [
  ['supported', {}, 5000, 6000, 0, 1068000, 667500, false],
  ['standard', {product:'standard'}, 4000, 5000, 0, 888000, 555000, false],
  ['civilian35', {monthlyPension:8750}, 5000, 6000, 5687.5, 1068000, 667500, false],
  ['civilian26', {monthlyPension:6500}, 5000, 6000, 4225, 1068000, 667500, false],
  ['civilianPost', {monthlyPension:6500,secondMonths:108,thirdMonths:60}, 5000, 6000, 4225, 961500, 600937.5, false],
  ['military26', {monthlyPension:military26,secondMonths:108,thirdMonths:60}, 5000, 6000, 4828.571429, 997714.285714, 623571.428571, false],
  ['military22', {monthlyPension:military22,secondMonths:60,thirdMonths:108}, 5000, 6000, 4085.714286, 861257.142857, 538285.714286, false],
  ['obligations', {monthlyPension:military22,secondMonths:60,thirdMonths:108,otherPayments:1500}, 4000, 5000, 4085.714286, 789257.142857, 493285.714286, false],
  ['negative', {monthlyPension:military22,secondMonths:60,thirdMonths:108,otherPayments:7000}, -1500, -500, 4085.714286, 393257.142857, 245785.714286, true],
  ['zero', {monthlyPension:military22,secondMonths:60,thirdMonths:108,otherPayments:5500}, 0, 1000, 4085.714286, 501257.142857, 313285.714286, true],
];

for (const [name, changes, first, second, third, total, net, warning] of snbCases) {
  const result = snb.calculateSNB({...snbBase, ...changes});
  const near = (actual, expected) =>
    assert.ok(Math.abs(actual - expected) < 0.02, `${name}: ${actual} != ${expected}`);

  near(result.firstPayment, first);
  near(result.secondPayment, second);
  near(result.thirdPayment, third);
  near(result.totalRepayment, total);
  near(result.netFinancing, net);
  assert.equal(result.hasNonPositiveActivePayment, warning, name);
}

console.log('SNB reference tests passed: 10 Excel scenarios.');


// MASAR SNB pension reference tests
const pensionCases = [
  ['civilian35', 10000, 35, 'civilian', 8750],
  ['civilian26', 10000, 26, 'civilian', 6500],
  ['military26', 10000, 26, 'military', 7428.571428571429],
  ['military22', 10000, 22, 'military', 6285.714285714285],
];

for (const [name, salary, years, type, expected] of pensionCases) {
  const actual = snb.calculateSNBReferencePension(salary, years, type);
  assert.ok(
    Math.abs(actual - expected) < 0.01,
    `${name}: ${actual} != ${expected}`
  );
}

assert.throws(
  () => snb.calculateSNBReferencePension(-100, 35, 'civilian'),
  { name: 'RangeError' }
);

assert.throws(
  () => snb.calculateSNBReferencePension(10000, -1, 'military'),
  { name: 'RangeError' }
);

assert.throws(
  () => snb.calculateSNBReferencePension(10000, 26, 'unknown'),
  { name: 'RangeError' }
);

console.log('SNB pension reference tests passed: 4 scenarios + 3 validation checks.');


// MASAR SNB service-year tests
const serviceCases = [
  {
    name: 'civilian35',
    dates: {
      appointmentYear: 2010, appointmentMonth: 1,
      birthYear: 1985, birthMonth: 1,
      referenceYear: 2026, referenceMonth: 1,
      retirementAge: 60
    },
    employmentType: 'civilian',
    expectedService: 35,
    expectedPension: 8750
  },
  {
    name: 'military22',
    dates: {
      appointmentYear: 2010, appointmentMonth: 1,
      birthYear: 1976, birthMonth: 1,
      referenceYear: 2026, referenceMonth: 1,
      retirementAge: 56
    },
    employmentType: 'military',
    expectedService: 22,
    expectedPension: 10000 * 22 / 35
  }
];

for (const item of serviceCases) {
  const service = snb.calculateSNBReferenceServiceYears(item.dates);

  assert.ok(
    Math.abs(service.serviceYearsAtRetirement - item.expectedService) < 0.001,
    item.name + ': service years mismatch'
  );

  const pension = snb.calculateSNBReferencePension(
    10000,
    service.serviceYearsAtRetirement,
    item.employmentType
  );

  assert.ok(
    Math.abs(pension - item.expectedPension) < 0.01,
    item.name + ': pension mismatch'
  );
}

console.log('SNB service-year tests passed: 2 scenarios.');


// SNB monthly precision reference test
const monthPrecision = snb.calculateSNBReferenceServiceYears({
  appointmentYear: 2010,
  appointmentMonth: 10,
  birthYear: 1985,
  birthMonth: 3,
  referenceYear: 2026,
  referenceMonth: 11,
  retirementAge: 60
});

assert.ok(
  Math.abs(monthPrecision.serviceYearsAtRetirement - 413 / 12) < 1e-6
);

const monthPension = snb.calculateSNBReferencePension(
  10000,
  monthPrecision.serviceYearsAtRetirement,
  'civilian'
);

assert.ok(Math.abs(monthPension - 8604.166667) < 0.01);
assert.ok(Math.abs(monthPension * 0.65 - 5592.708333) < 0.01);

console.log('SNB monthly precision reference test: PASS');


// SNB chronological validation tests
const snbDateBase = {
  appointmentYear: 2010, appointmentMonth: 1,
  birthYear: 1985, birthMonth: 1,
  referenceYear: 2026, referenceMonth: 1,
  retirementAge: 60
};

for (const changes of [
  { appointmentYear: 2030 },
  { appointmentYear: 1970 },
  { birthYear: 2030 }
]) {
  assert.throws(
    () => snb.calculateSNBReferenceServiceYears({
      ...snbDateBase, ...changes
    }),
    { name: 'RangeError' }
  );
}

console.log('SNB chronology validation tests: PASS');


// SNB appointment-after-retirement validation
assert.throws(
  () => snb.calculateSNBReferenceServiceYears({
    appointmentYear: 2022,
    appointmentMonth: 1,
    birthYear: 1960,
    birthMonth: 1,
    referenceYear: 2026,
    referenceMonth: 1,
    retirementAge: 60
  }),
  { name: 'RangeError' }
);

console.log('SNB retirement-date validation: PASS');

// SNB adapter permanent tests
import { execFileSync as runSNBOfferTests } from 'node:child_process';
runSNBOfferTests(
  process.execPath,
  ['scripts/verify-snb-offer.mjs'],
  { stdio: 'inherit' }
);
