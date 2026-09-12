import { calculatePlan, defaultInputs, normalizeInputs } from './finance.js';

export const CONTENT_VERSION = 'grounded-draft-v1';
export const SOURCE_VERSION = 'diagnosis-defaults-2026-09-12';
export const CALCULATION_VERSION = 'finance-static-v1';
export const INTRODUCTIONS = Object.freeze({
  cash: '先把每月現金流看清楚。',
  budget: '把收入與固定支出放在一起看，預算就有了起點。',
  scenario: '用一個試算情境，看看收入扣除支出後剩下多少。',
});
export function selectIntro(value) {
  const key = typeof value === 'string' ? value.trim() : '';
  const accepted = Object.hasOwn(INTRODUCTIONS, key);
  return { key: accepted ? key : 'cash', accepted };
}
const money = value => Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 });

export function buildPublicFacts() {
  const inputs = { ...defaultInputs };
  const result = calculatePlan(inputs);
  return {
    source: 'https://finops-planner.vercel.app/diagnosis',
    sourceVersion: SOURCE_VERSION,
    calculationVersion: CALCULATION_VERSION,
    contentVersion: CONTENT_VERSION,
    inputs,
    results: { monthlyIncome: result.monthlyTotalIncome, fixedExpense: result.fixedExpense, available: result.available },
  };
}
function factBody(inputs, results) {
  return `月收入 NT$ ${money(results.monthlyIncome)}，固定支出 NT$ ${money(results.fixedExpense)}，差額 NT$ ${money(results.available)}。\n假設：年獎金 NT$ ${money(inputs.annualBonus)}、其他年收入 NT$ ${money(inputs.otherAnnualIncome)}；獎金不攤入本月收入。差額尚未分配至旅遊、現金補足與投資。本段僅計算當月收支，未使用報酬率，不代表退休預測或投資建議。`;
}
export function renderPublicDraft(facts = buildPublicFacts(), introKey = 'cash', trackingUrl = '') {
  const { key } = selectIntro(introKey);
  const link = trackingUrl ? `\n試算：${trackingUrl}` : '';
  return `${INTRODUCTIONS[key]}\n\n公開預設合成範例（非真實個人資料）：\n${factBody(facts.inputs, facts.results)}\n來源：${facts.source}（選擇「恢復 30 歲預設範例」可重現）${link}`;
}
// Browser-only caller supplies its local inputs. This function performs no I/O.
export function buildFactDraft(rawInputs) {
  const inputs = normalizeInputs(rawInputs);
  const result = calculatePlan(inputs);
  return `本機輸入的靜態收支試算：\n${factBody(inputs, { monthlyIncome: result.monthlyTotalIncome, fixedExpense: result.fixedExpense, available: result.available })}\n來源：本機財務輸入／calculatePlan；計算版本 ${CALCULATION_VERSION}。內容僅在本機產生，請自行確認後複製。`;
}
