import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePlan, defaultInputs, normalizeInputs, validateInputs } from '../src/finance.js';

test('calculatePlan keeps monthly cashflow separate from annual-average income', () => {
  const result = calculatePlan(defaultInputs);

  assert.equal(result.monthlyTotalIncome, 48000);
  assert.equal(result.annualAverageMonthlyIncome, 56000);
  assert.equal(result.annualIncome, 672000);
  assert.equal(result.fixedExpense, 33000);
  assert.equal(result.available, 15000);
});

test('allocation conserves the current-month available cashflow', () => {
  const result = calculatePlan({
    ...defaultInputs,
    monthlyIncome: 80000,
    annualBonus: 240000,
    currentCash: 600000,
    cashGoal: 300000,
    minInvestment: 10000,
    maxInvestment: 30000,
  });

  assert.equal(
    result.suggestedCashTopUp + result.suggestedTravelTopUp + result.suggestedInvestment,
    Math.max(0, Math.floor(result.available)),
  );
  assert.ok(result.suggestedInvestment >= 0);
  assert.ok(result.suggestedInvestment <= 30000);
});

test('normalizeInputs clamps unsafe numeric values and preserves valid enums', () => {
  const normalized = normalizeInputs({
    ...defaultInputs,
    age: 999,
    annualReturnRate: -75,
    monthlyIncome: -100,
    householdType: 'couple',
    incomeStability: 'freelance',
  });

  assert.equal(normalized.age, 120);
  assert.equal(normalized.annualReturnRate, -50);
  assert.equal(normalized.monthlyIncome, 0);
  assert.equal(normalized.householdType, 'couple');
  assert.equal(normalized.incomeStability, 'freelance');
});

test('validateInputs rejects inverted investment bounds', () => {
  const errors = validateInputs({
    ...defaultInputs,
    minInvestment: 20000,
    maxInvestment: 10000,
  });

  assert.ok(errors.includes('每月最高投資不得低於最低投資。'));
});

test('zero monthly balance is distinguished from a deficit', () => {
  const result = calculatePlan({...defaultInputs, monthlyIncome: 33000});
  assert.equal(result.available, 0);
  assert.match(result.allocationStrategyNote, /為零/);
  assert.doesNotMatch(result.allocationStrategyNote, /為負/);
});
