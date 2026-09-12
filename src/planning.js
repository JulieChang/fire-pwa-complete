import { calculatePlan, normalizeInputs, validateInputs } from "./finance.js";
export const CALCULATION_VERSION = "monthly-1.0.0";
export const SCHEMA_VERSION = 1;
export function monthIndex(month) {
  if (typeof month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw Error("請填有效月份 YYYY-MM。");
  const [y, m] = month.split("-").map(Number);
  if (y < 1900 || y > 2200) throw Error("月份年份須介於 1900 至 2200。");
  return y * 12 + m - 1;
}
export function monthLabel(index) {
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}
export function defaultAssumptions(inputs, startMonth = "2026-09") {
  return {
    startMonth,
    retirementAge: inputs.retirementAge,
    horizonAge: Math.min(120, Math.max(95, inputs.retirementAge + 10)),
    annualReturnRate: inputs.annualReturnRate,
    inflationRate: 2,
    withdrawalRate: 4,
    monthlyContribution: calculatePlan(inputs).suggestedInvestment,
    bonusMonth: 12,
    bonusInvestmentPercent: 70,
    travelMonth: 6,
    changeMonth: "",
    newMonthlyIncome: inputs.monthlyIncome,
    breakMonths: 0,
    shockMonth: "",
    shockPercent: 30,
    retirementMonthlyExpense: inputs.retirementMonthlyCashflow,
  };
}
export function simulateScenario(rawInputs, raw) {
  const issues = validateInputs(rawInputs);
  if (issues.length) throw Error(issues.join(" "));
  const inputs = normalizeInputs(rawInputs);
  const a = { ...defaultAssumptions(inputs), ...raw };
  const start = monthIndex(a.startMonth);
  for (const [key, min, max, label] of [
    ["retirementAge", inputs.age, 120, "退休年齡"],
    ["horizonAge", inputs.age + 1, 120, "推估終點"],
    ["annualReturnRate", -50, 50, "報酬率"],
    ["inflationRate", 0, 15, "通膨率"],
    ["withdrawalRate", 0.5, 15, "提領率"],
    ["monthlyContribution", 0, 1e12, "月投入"],
    ["bonusMonth", 1, 12, "獎金月份"],
    ["travelMonth", 1, 12, "旅遊月份"],
    ["bonusInvestmentPercent", 0, 100, "獎金投入比例"],
    ["newMonthlyIncome", 0, 1e12, "轉職收入"],
    ["breakMonths", 0, 120, "空窗月數"],
    ["shockPercent", 0, 100, "壓力跌幅"],
    ["retirementMonthlyExpense", 0, 1e12, "退休支出"],
  ]) {
    if (
      a[key] === "" ||
      !Number.isFinite(Number(a[key])) ||
      Number(a[key]) < min ||
      Number(a[key]) > max
    )
      throw Error(`${label}超出有效範圍（${min}–${max}）。`);
    a[key] = Number(a[key]);
  }
  if (a.horizonAge <= a.retirementAge || a.horizonAge - inputs.age > 80)
    throw Error("推估終點須晚於退休年齡，總期間不得超過 80 年。");
  for (const key of ["bonusMonth", "travelMonth", "breakMonths"])
    if (!Number.isInteger(a[key])) throw Error("月份與月數須為整數。");
  for (const [payment, term] of [
    ["mortgage", "mortgageRemainingMonths"],
    ["personalLoan", "personalLoanRemainingMonths"],
  ]) {
    if (inputs[payment] > 0 && !(inputs[term] > 0))
      throw Error("有貸款月付額時，請填剩餘期數。");
  }
  const change = a.changeMonth ? monthIndex(a.changeMonth) - start : null;
  const shock = a.shockMonth ? monthIndex(a.shockMonth) - start : null;
  if ((change !== null && change < 0) || (shock !== null && shock < 0))
    throw Error("事件月份不得早於起算月份。");
  const retirementOffset = Math.round((a.retirementAge - inputs.age) * 12);
  const count = Math.round((a.horizonAge - inputs.age) * 12);
  if (count <= retirementOffset)
    throw Error("推估終點須至少包含一個退休月份。");
  if (change !== null && change >= retirementOffset)
    throw Error("轉職月份須早於退休月份。");
  if (shock !== null && shock >= count) throw Error("壓力事件須在推估期間內。");
  const base = calculatePlan(inputs);
  const living = base.fixedExpense - inputs.mortgage - inputs.personalLoan;
  const rate = Math.pow(1 + a.annualReturnRate / 100, 1 / 12) - 1;
  let cash = inputs.currentCash + inputs.currentTravelFund;
  let investments = inputs.currentInvestmentAsset;
  let retirementInvestments = retirementOffset === 0 ? investments : null;
  let totalShortfall = 0,
    minCash = cash,
    firstShortfall = null;
  const months = [];
  for (let offset = 0; offset < count; offset++) {
    if (offset === retirementOffset) retirementInvestments = investments;
    const retired = offset >= retirementOffset;
    const month = monthLabel(start + offset);
    const calendarMonth = ((start + offset) % 12) + 1;
    const inflation = Math.pow(1 + a.inflationRate / 100, offset / 12);
    const loanPayment =
      (offset < inputs.mortgageRemainingMonths ? inputs.mortgage : 0) +
      (offset < inputs.personalLoanRemainingMonths ? inputs.personalLoan : 0);
    let salary = retired ? 0 : inputs.monthlyIncome;
    if (!retired && change !== null && offset >= change)
      salary = offset < change + a.breakMonths ? 0 : a.newMonthlyIncome;
    const onBreak =
      change !== null && offset >= change && offset < change + a.breakMonths;
    const bonus =
      !retired && !onBreak && calendarMonth === a.bonusMonth
        ? inputs.annualBonus + inputs.otherAnnualIncome
        : 0;
    const income = salary + bonus;
    const travel =
      !retired && calendarMonth === a.travelMonth
        ? inputs.annualTravelBudget * inflation
        : 0;
    const expense =
      (retired ? a.retirementMonthlyExpense : living) * inflation +
      loanPayment +
      travel;
    const openingCash = cash,
      openingInvestments = investments;
    const marketReturn = investments * rate;
    investments += marketReturn;
    const shockLoss =
      offset === shock ? (investments * a.shockPercent) / 100 : 0;
    investments -= shockLoss;
    cash += income - expense;
    const withdrawal = Math.min(Math.max(-cash, 0), investments);
    investments -= withdrawal;
    cash += withdrawal;
    const shortfall = Math.max(-cash, 0);
    cash = Math.max(cash, 0);
    totalShortfall += shortfall;
    if (shortfall > 0 && !firstShortfall) firstShortfall = month;
    // Protect emergency cash and the next travel budget before investing available cash.
    const reserve =
      Math.max(
        inputs.cashGoal,
        ((retired ? a.retirementMonthlyExpense : living) * inflation +
          loanPayment) *
          base.recommendedRunwayMonths,
      ) + (retired ? 0 : inputs.annualTravelBudget * inflation);
    const released = inputs.mortgage + inputs.personalLoan - loanPayment;
    const desired = retired
      ? 0
      : a.monthlyContribution +
        released +
        (bonus * a.bonusInvestmentPercent) / 100;
    const contribution = Math.max(
      0,
      Math.min(
        desired,
        Math.max(income - expense, 0),
        Math.max(cash - reserve, 0),
      ),
    );
    cash -= contribution;
    investments += contribution;
    minCash = Math.min(minCash, cash);
    months.push({
      month,
      retired,
      salary,
      bonus,
      income,
      expense,
      loanPayment,
      travel,
      openingCash,
      openingInvestments,
      marketReturn,
      shockLoss,
      contribution,
      withdrawal,
      shortfall,
      cumulativeShortfall: totalShortfall,
      cash,
      investments,
      financialAssets: cash + investments,
    });
  }
  const target =
    (a.retirementMonthlyExpense *
      Math.pow(1 + a.inflationRate / 100, retirementOffset / 12) *
      12) /
    (a.withdrawalRate / 100);
  return {
    calculationVersion: CALCULATION_VERSION,
    inputs,
    assumptions: a,
    months,
    retirementInvestments,
    target,
    retirementGap: retirementInvestments - target,
    achievementPercent:
      target > 0 ? (retirementInvestments / target) * 100 : null,
    minCash,
    totalShortfall,
    firstShortfall,
    endingFinancialAssets: cash + investments,
  };
}
export function sensitivity(inputs, assumptions) {
  return [-2, 0, 2].map((delta) => {
    const annualReturnRate = Math.max(
      -50,
      Math.min(50, Number(assumptions.annualReturnRate) + delta),
    );
    const r = simulateScenario(inputs, { ...assumptions, annualReturnRate });
    return {
      label: delta === 0 ? "基準" : delta < 0 ? "較低報酬" : "較高報酬",
      annualReturnRate,
      target: r.target,
      retirementInvestments: r.retirementInvestments,
      totalShortfall: r.totalShortfall,
    };
  });
}
