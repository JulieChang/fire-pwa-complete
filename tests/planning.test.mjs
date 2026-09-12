import test from "node:test";
import assert from "node:assert/strict";
import * as planning from "../src/planning.js";
import { defaultInputs } from "../src/finance.js";
const input = {
  ...defaultInputs,
  age: 40,
  retirementAge: 41,
  monthlyIncome: 10000,
  insurance: 0,
  livingExpense: 2000,
  utilities: 0,
  transportation: 0,
  otherFixedExpense: 0,
  currentCash: 10000,
  cashGoal: 0,
  currentTravelFund: 0,
  annualTravelBudget: 0,
  currentInvestmentAsset: 100000,
  annualBonus: 12000,
  annualReturnRate: 0,
};
const opts = {
  startMonth: "2026-09",
  retirementAge: 41,
  horizonAge: 42,
  annualReturnRate: 0,
  inflationRate: 0,
  withdrawalRate: 4,
  monthlyContribution: 1000,
  bonusMonth: 12,
  bonusInvestmentPercent: 100,
  travelMonth: 6,
  changeMonth: "",
  newMonthlyIncome: 10000,
  breakMonths: 0,
  shockMonth: "",
  shockPercent: 0,
  retirementMonthlyExpense: 2000,
};
test("monthly engine is available", () =>
  assert.equal(typeof planning.simulateScenario, "function"));
test("bonus enters only in chosen month and cash conserves every month", () => {
  const r = planning.simulateScenario(input, opts);
  assert.equal(r.months[0].bonus, 0);
  assert.equal(r.months[3].bonus, 12000);
  for (const row of r.months) {
    assert.ok(
      Math.abs(
        row.cash -
          (row.openingCash +
            row.income -
            row.expense -
            row.contribution +
            row.withdrawal +
            row.shortfall),
      ) < 1e-6,
    );
    assert.ok(row.cash >= 0);
    assert.ok(row.investments >= 0);
  }
});
test("loan expires after specified months, released payment may be invested", () => {
  const r = planning.simulateScenario(
    {
      ...input,
      personalLoan: 2000,
      personalLoanRemainingMonths: 2,
      annualBonus: 0,
    },
    { ...opts },
  );
  assert.equal(r.months[1].loanPayment, 2000);
  assert.equal(r.months[2].loanPayment, 0);
  assert.equal(r.months[2].contribution, 3000);
});
test("career break stops salary then uses new income; retirement stops salary and bonus", () => {
  const r = planning.simulateScenario(input, {
    ...opts,
    changeMonth: "2026-10",
    breakMonths: 2,
    newMonthlyIncome: 5000,
  });
  assert.equal(r.months[0].salary, 10000);
  assert.equal(r.months[1].salary, 0);
  assert.equal(r.months[2].salary, 0);
  assert.equal(r.months[3].salary, 5000);
  assert.equal(r.months[12].salary, 0);
  assert.equal(r.months[15].bonus, 0);
});
test("retirement withdrawals and exhaustion remain visible, never negative hidden balances", () => {
  const r = planning.simulateScenario(
    { ...input, age: 41, currentCash: 0, currentInvestmentAsset: 3000 },
    {
      ...opts,
      retirementAge: 41,
      horizonAge: 42,
      retirementMonthlyExpense: 2000,
    },
  );
  assert.equal(r.months[0].withdrawal, 2000);
  assert.equal(r.months[1].shortfall, 1000);
  assert.equal(r.totalShortfall, 21000);
  assert.equal(r.months[1].investments, 0);
});
test("stock shock is applied once and retired investment snapshot is before first withdrawal", () => {
  const r = planning.simulateScenario(
    { ...input, age: 41, currentCash: 0 },
    {
      ...opts,
      retirementAge: 41,
      horizonAge: 42,
      retirementMonthlyExpense: 0,
      shockMonth: "2026-09",
      shockPercent: 30,
    },
  );
  assert.equal(r.retirementInvestments, 100000);
  assert.equal(r.months[0].investments, 70000);
  assert.equal(r.months[1].investments, 70000);
});
test("rejects missing loan term and impossible assumptions", () => {
  assert.throws(
    () =>
      planning.simulateScenario(
        { ...input, mortgage: 1000, mortgageRemainingMonths: 0 },
        opts,
      ),
    /期數/,
  );
  assert.throws(
    () => planning.simulateScenario(input, { ...opts, withdrawalRate: 0 }),
    /提領/,
  );
  assert.throws(
    () => planning.simulateScenario(input, { ...opts, startMonth: "2026-99" }),
    /月份/,
  );
});
test("rounded horizon must include at least one retirement month", () => {
  assert.throws(
    () =>
      planning.simulateScenario(input, {
        ...opts,
        retirementAge: 41,
        horizonAge: 41.01,
      }),
    /退休月份/,
  );
});
