const defaultInputs = {
  age: 30,
  householdType: "single",
  householdMembers: 1,
  dependents: 0,
  incomeStability: "stable",
  monthlyIncome: 48000,
  annualBonus: 96000,
  otherAnnualIncome: 0,
  mortgage: 0,
  mortgageRemainingMonths: 0,
  personalLoan: 0,
  personalLoanRemainingMonths: 0,
  insurance: 4000,
  livingExpense: 22000,
  utilities: 2500,
  transportation: 2500,
  familySupport: 0,
  otherFixedExpense: 2000,
  currentCash: 180000,
  cashGoal: 180000,
  currentInvestmentAsset: 300000,
  homeValue: 0,
  mortgageBalance: 0,
  personalLoanBalance: 0,
  otherDebt: 0,
  annualTravelBudget: 60000,
  currentTravelFund: 15000,
  minInvestment: 6000,
  maxInvestment: 12000,
  annualReturnRate: 6,
  retirementMonthlyCashflow: 50000,
  retirementAge: 60,
};

const clamp = (value, min = 0, max = 100) => Math.min(Math.max(Number(value) || 0, min), max);
const toNumber = (value) => Number(value) || 0;
export function normalizeInputs(raw = {}) {
  const result = { ...defaultInputs };
  for (const key of Object.keys(defaultInputs)) {
    if (typeof defaultInputs[key] !== 'number') continue;
    const value = Number(raw?.[key] ?? defaultInputs[key]);
    result[key] = Number.isFinite(value) ? Math.max(0, Math.min(value, 1e12)) : defaultInputs[key];
  }
  for (const key of ['age', 'retirementAge']) result[key] = Math.min(result[key], 120);
  for (const key of ['dependents', 'householdMembers', 'mortgageRemainingMonths', 'personalLoanRemainingMonths']) result[key] = Math.floor(result[key]);
  result.annualReturnRate = Number.isFinite(Number(raw?.annualReturnRate)) ? Math.min(50, Math.max(-50, Number(raw.annualReturnRate))) : defaultInputs.annualReturnRate;
  result.maxInvestment = Math.max(result.minInvestment, result.maxInvestment);
  for (const key of ['householdType', 'incomeStability']) {
    const allowed = key === 'householdType' ? ['single','couple','familyWithKids','withParents','other'] : ['stable','variableBonus','freelance','unstable'];
    if (allowed.includes(raw?.[key])) result[key] = raw[key];
  }
  return result;
}
export function validateInputs(raw) {
  const errors = [];
  for (const key of Object.keys(defaultInputs)) {
    if (typeof defaultInputs[key] !== 'number') continue;
    const value = Number(raw[key]);
    if (!Number.isFinite(value) || value > 1e12 || (key !== 'annualReturnRate' && value < 0)) errors.push('請確認金額與人數為有效的非負數。');
  }
  if (Number(raw.minInvestment) > Number(raw.maxInvestment)) errors.push('每月最高投資不得低於最低投資。');
  if (Number(raw.annualReturnRate) < -50 || Number(raw.annualReturnRate) > 50) errors.push('本工具的年化報酬情境範圍為 -50% 至 50%。');
  if (Number(raw.age) > 120 || Number(raw.retirementAge) > 120) errors.push('年齡請填入 0 至 120 歲。');
  if (Number(raw.householdMembers) < 1) errors.push('家庭總人數至少為 1 人。');
  return [...new Set(errors)];
}
const getWealthTier = (investableNetWorth) => {
  const tiers = [
    { tier: "A-9", name: "負資產階段", threshold: -Infinity, nextThreshold: 0, nextTier: "A1", description: "可投資淨資產小於 0，代表負債大於可動用資產，優先目標是償還債務、降低固定支出並補足基本生活現金。" },
    { tier: "A1", name: "初始資產階段", threshold: 0, nextThreshold: 100000, nextTier: "A2", description: "資產仍在起步階段，能滿足基本生活需求，但財務自由度較低，重點是建立第一筆緊急預備金。" },
    { tier: "A2", name: "小額資產累積階段", threshold: 100000, nextThreshold: 500000, nextTier: "A3", description: "已有小額資產累積，開始具備部分自由度，可偶爾安排旅遊或改善生活，但仍需優先擴大現金安全水位。" },
    { tier: "A3", name: "小資族儲蓄階段", threshold: 500000, nextThreshold: 1000000, nextTier: "A4", description: "已具備一定儲蓄能力，可支撐短期國內旅遊與生活彈性，接下來要把儲蓄轉化為長期投資資產。" },
    { tier: "A4", name: "資產累積期", threshold: 1000000, nextThreshold: 3000000, nextTier: "A5", description: "進入資產累積期，生活相對自由，可安排短期國外旅遊，重點是維持投資紀律與避免負債膨脹。" },
    { tier: "A5", name: "穩定中產階級", threshold: 3000000, nextThreshold: 5000000, nextTier: "A6", description: "具備穩定生活品質與基本自由度，應開始優化資產配置、保險與長期退休現金流。" },
    { tier: "A6", name: "具備經濟實力", threshold: 5000000, nextThreshold: 10000000, nextTier: "A7", description: "生活自由度提高，可較頻繁安排國外旅遊，需重視資產配置效率與風險分散。" },
    { tier: "A7", name: "千萬資產累積階段", threshold: 10000000, nextThreshold: 30000000, nextTier: "A8", description: "已具備財務自由雛形，可選擇較高端生活方式，重點從累積轉向現金流與資產保護。" },
    { tier: "A8", name: "高資產累積階段", threshold: 30000000, nextThreshold: 100000000, nextTier: "A9", description: "高度自由，可依照理想生活規劃居住、工作與旅行方式，需建立完整資產配置與稅務觀念。" },
    { tier: "A9", name: "超高淨值人士", threshold: 100000000, nextThreshold: 300000000, nextTier: "A10", description: "生活與事業具備高度掌控力，重點轉向財富傳承、風險隔離與跨資產配置。" },
    { tier: "A10", name: "富豪級別", threshold: 300000000, nextThreshold: 1000000000, nextTier: "A11", description: "已達超級自由階段，金錢限制大幅降低，需以治理思維管理資產、稅務與家族風險。" },
    { tier: "A11", name: "頂級富豪", threshold: 1000000000, nextThreshold: 5000000000, nextTier: "A12", description: "可追求任何夢想與大型目標，資產管理重點在家族辦公室、傳承與社會影響力。" },
    { tier: "A12", name: "頂尖資本階層", threshold: 5000000000, nextThreshold: null, nextTier: null, description: "具備無限制自由與超越個人層面的影響力，重點是資本治理、傳承設計與長期影響力。" },
  ];
  return [...tiers].reverse().find((item) => investableNetWorth >= item.threshold) || tiers[0];
};


const taiwanHouseholdWealthDeciles = [
  { label: "D1", threshold: 1430000, percentile: "約高於 10% 家庭", description: "低於或接近第 1 十分位門檻" },
  { label: "D2", threshold: 3190000, percentile: "約高於 20% 家庭", description: "接近第 2 十分位門檻" },
  { label: "D3", threshold: 4900000, percentile: "約高於 30% 家庭", description: "接近第 3 十分位門檻" },
  { label: "D4", threshold: 6770000, percentile: "約高於 40% 家庭", description: "接近第 4 十分位門檻" },
  { label: "D5", threshold: 8940000, percentile: "約高於 50% 家庭", description: "接近台灣家庭財富中位數" },
  { label: "D6", threshold: 11710000, percentile: "約高於 60% 家庭", description: "高於家庭財富中位數、接近第 6 十分位" },
  { label: "D7", threshold: 15470000, percentile: "約高於 70% 家庭", description: "接近第 7 十分位門檻" },
  { label: "D8", threshold: 21340000, percentile: "約高於 80% 家庭", description: "接近第 8 十分位門檻" },
  { label: "D9", threshold: 33910000, percentile: "約高於 90% 家庭", description: "接近第 9 十分位門檻" },
];

const TAIWAN_HOUSEHOLD_WEALTH_MEDIAN = 8940000;
const TAIWAN_OFFICIAL_SOURCE_NOTE = "資料來源：行政院主計總處國富統計，110 年家庭財富分配統計，113 年發布。統計基準為 2021 年底，非即時市場排名；家庭口徑不等於個人或同齡排名。";

const getTaiwanHouseholdWealthPosition = (totalNetWorth) => {
  const value = Number(totalNetWorth) || 0;
  if (value < taiwanHouseholdWealthDeciles[0].threshold) {
    return {
      label: "低於 D1",
      percentile: "低於第 1 十分位門檻",
      description: "總淨資產低於家庭財富第 1 十分位門檻",
      nextLabel: "D1",
      nextThreshold: taiwanHouseholdWealthDeciles[0].threshold,
    };
  }

  let current = taiwanHouseholdWealthDeciles[0];
  let next = null;
  for (let i = 0; i < taiwanHouseholdWealthDeciles.length; i += 1) {
    const item = taiwanHouseholdWealthDeciles[i];
    const following = taiwanHouseholdWealthDeciles[i + 1] || null;
    if (value >= item.threshold) {
      current = item;
      next = following;
    }
  }

  return {
    ...current,
    nextLabel: next?.label || null,
    nextThreshold: next?.threshold || null,
  };
};

const getWealthTierScore = (tier) => {
  const scores = {
    "A-9": 0,
    A1: 3,
    A2: 6,
    A3: 9,
    A4: 12,
    A5: 15,
    A6: 17,
    A7: 19,
    A8: 20,
    A9: 20,
    A10: 20,
    A11: 20,
    A12: 20,
  };
  return scores[tier] ?? 0;
};

const getTaiwanWealthDecileScore = (label) => {
  if (label === "低於 D1") return 0;
  const match = String(label).match(/D(\d+)/);
  if (!match) return 0;
  return clamp(Number(match[1]), 0, 9);
};

const getFixedExpenseScore = (fixedExpenseRatio) => {
  if (fixedExpenseRatio <= 40) return 7;
  if (fixedExpenseRatio <= 50) return 5.5;
  if (fixedExpenseRatio <= 60) return 4;
  if (fixedExpenseRatio <= 70) return 2.5;
  return 1;
};

const getAvailableCashflowScore = (available, monthlyTotalIncome) => {
  if (available <= 0 || monthlyTotalIncome <= 0) return 0;
  const availableRate = available / monthlyTotalIncome;
  if (availableRate >= 0.25) return 3;
  if (availableRate >= 0.15) return 2;
  if (availableRate >= 0.05) return 1;
  return 0.5;
};

const getAgeIncomeBenchmark = (age) => {
  if (age < 30) return { label: "30 歲以下", conservative: 0.5, stable: 1, aggressive: 1.5 };
  if (age < 35) return { label: "30–34 歲", conservative: 1, stable: 1.5, aggressive: 2 };
  if (age < 40) return { label: "35–39 歲", conservative: 1.5, stable: 2, aggressive: 3 };
  if (age < 45) return { label: "40–44 歲", conservative: 2, stable: 3, aggressive: 5 };
  if (age < 50) return { label: "45–49 歲", conservative: 3, stable: 5, aggressive: 7 };
  if (age < 55) return { label: "50–54 歲", conservative: 5, stable: 7, aggressive: 10 };
  return { label: "55 歲以上", conservative: 7, stable: 10, aggressive: 12 };
};

export function calculatePlan(rawInputs) {
    const data = normalizeInputs(rawInputs);
    const monthlyIncome = toNumber(data.monthlyIncome);
    const annualBonus = toNumber(data.annualBonus);
    const otherAnnualIncome = toNumber(data.otherAnnualIncome);
    const monthlyTotalIncome = monthlyIncome;
    const annualAverageMonthlyIncome = monthlyIncome + annualBonus / 12 + otherAnnualIncome / 12;
    const annualIncome = monthlyIncome * 12 + annualBonus + otherAnnualIncome;
    const fixedExpense = toNumber(data.mortgage) + toNumber(data.personalLoan) + toNumber(data.insurance) + toNumber(data.livingExpense) + toNumber(data.utilities) + toNumber(data.transportation) + toNumber(data.familySupport) + toNumber(data.otherFixedExpense);
    const available = monthlyTotalIncome - fixedExpense;
    const currentCash = toNumber(data.currentCash);
    const currentInvestmentAsset = toNumber(data.currentInvestmentAsset);
    const estimatedMortgageBalance = toNumber(data.mortgageBalance) > 0
      ? toNumber(data.mortgageBalance)
      : toNumber(data.mortgage) * toNumber(data.mortgageRemainingMonths);
    const estimatedPersonalLoanBalance = toNumber(data.personalLoanBalance) > 0
      ? toNumber(data.personalLoanBalance)
      : toNumber(data.personalLoan) * toNumber(data.personalLoanRemainingMonths);
    const investableNetWorth = currentCash + currentInvestmentAsset - estimatedPersonalLoanBalance - toNumber(data.otherDebt);
    const totalNetWorth = currentCash + toNumber(data.currentTravelFund) + currentInvestmentAsset + toNumber(data.homeValue) - estimatedMortgageBalance - estimatedPersonalLoanBalance - toNumber(data.otherDebt);
    const cashRunwayMonths = fixedExpense > 0 ? currentCash / fixedExpense : 0;
    const dependents = toNumber(data.dependents);
    let recommendedRunwayMonths = 6;
    const runwayReasons = [];
    if (dependents >= 2) {
      recommendedRunwayMonths = 12;
      runwayReasons.push(`需負擔 ${dependents} 人，現金安全水位建議提高到 12 個月`);
    } else if (dependents >= 1) {
      recommendedRunwayMonths = 9;
      runwayReasons.push(`需負擔 ${dependents} 人，現金安全水位建議提高到 9 個月`);
    } else {
      runwayReasons.push("無額外扶養責任，現金安全水位基準為 6 個月");
    }
    if (data.incomeStability !== "stable") {
      recommendedRunwayMonths += 3;
      runwayReasons.push("收入穩定性不是穩定受薪，因此額外增加 3 個月緩衝");
    }
    const recommendedRunwayReason = runwayReasons.join("；");
    const recommendedCashTarget = Math.max(fixedExpense * recommendedRunwayMonths, toNumber(data.cashGoal));
    const cashGap = recommendedCashTarget - currentCash;
    const savingRate = monthlyTotalIncome > 0 ? (available / monthlyTotalIncome) * 100 : 0;
    const fixedExpenseRatio = monthlyTotalIncome > 0 ? (fixedExpense / monthlyTotalIncome) * 100 : (fixedExpense > 0 ? 100 : 0);
    const ageBenchmark = getAgeIncomeBenchmark(toNumber(data.age));
    const stableBenchmarkAsset = annualIncome * ageBenchmark.stable;
    const conservativeBenchmarkAsset = annualIncome * ageBenchmark.conservative;
    const aggressiveBenchmarkAsset = annualIncome * ageBenchmark.aggressive;
    const incomeMultiple = annualIncome > 0 ? investableNetWorth / annualIncome : 0;
    const gapToStableBenchmark = investableNetWorth - stableBenchmarkAsset;
    const gapToStableBenchmarkPercent = stableBenchmarkAsset > 0 ? (gapToStableBenchmark / stableBenchmarkAsset) * 100 : 0;
    const wealthTier = getWealthTier(investableNetWorth);
    const totalWealthTier = getWealthTier(totalNetWorth);
    const taiwanHouseholdWealthPosition = getTaiwanHouseholdWealthPosition(totalNetWorth);
    const gapToTaiwanMedianWealth = totalNetWorth - TAIWAN_HOUSEHOLD_WEALTH_MEDIAN;
    const gapToNextTaiwanWealthDecile = taiwanHouseholdWealthPosition.nextThreshold ? Math.max(taiwanHouseholdWealthPosition.nextThreshold - totalNetWorth, 0) : 0;
    const gapToNextTier = wealthTier.nextThreshold ? Math.max(wealthTier.nextThreshold - investableNetWorth, 0) : 0;
    const gapToNextTotalTier = totalWealthTier.nextThreshold ? Math.max(totalWealthTier.nextThreshold - totalNetWorth, 0) : 0;
    const annualTravelBudget = toNumber(data.annualTravelBudget);
    const currentTravelFund = toNumber(data.currentTravelFund);
    const travelProgress = annualTravelBudget > 0 ? (currentTravelFund / annualTravelBudget) * 100 : 100;
    const monthlyTravelSaving = Math.max((annualTravelBudget - currentTravelFund) / 12, 0);
    const minInvestment = toNumber(data.minInvestment);
    const maxInvestment = toNumber(data.maxInvestment);
    const financialFreedomTarget = toNumber(data.retirementMonthlyCashflow) * 12 * 25;
    const financialFreedomProgress = financialFreedomTarget > 0 ? (currentInvestmentAsset / financialFreedomTarget) * 100 : 0;
    const financialFreedomGap = financialFreedomTarget - currentInvestmentAsset;
    const monthsToRetirement = Math.max((toNumber(data.retirementAge) - toNumber(data.age)) * 12, 0);
    const monthlyRate = Math.pow(1 + toNumber(data.annualReturnRate) / 100, 1 / 12) - 1;
    const growthFactor = Math.pow(1 + monthlyRate, monthsToRetirement);
    const annuityFactor = monthlyRate === 0
      ? monthsToRetirement
      : (growthFactor - 1) / monthlyRate;
    const requiredMonthlyInvestmentForTarget = monthsToRetirement > 0 && annuityFactor > 0
      ? Math.max((financialFreedomTarget - currentInvestmentAsset * growthFactor) / annuityFactor, 0)
      : Math.max(financialFreedomTarget - currentInvestmentAsset, 0);
    let suggestedCashTopUp = 0;
    let suggestedTravelTopUp = 0;
    let suggestedInvestment = 0;
    let allocationStrategyNote = "";
    if (available > 0) {
      const cappedMinimumInvestment = Math.min(minInvestment, available);
      if (cashGap > 0) {
        suggestedInvestment = Math.min(maxInvestment, cappedMinimumInvestment);
        suggestedTravelTopUp = 0;
        suggestedCashTopUp = Math.max(available - suggestedInvestment, 0);
        allocationStrategyNote = "現金水位低於建議值，因此本月優先補現金，旅遊基金暫緩，投資先維持最低定期定額。";
      } else {
        const baselineProjection = currentInvestmentAsset * growthFactor + cappedMinimumInvestment * annuityFactor;
        const baselineRetirementRate = financialFreedomTarget > 0 ? (baselineProjection / financialFreedomTarget) * 100 : 0;
        if (baselineRetirementRate < 80) {
          suggestedTravelTopUp = Math.min(monthlyTravelSaving, Math.max(available * 0.1, 0));
          const targetInvestment = Math.max(cappedMinimumInvestment, Math.min(requiredMonthlyInvestmentForTarget, maxInvestment));
          suggestedInvestment = Math.min(targetInvestment, Math.max(available - suggestedTravelTopUp, 0));
          suggestedCashTopUp = Math.max(available - suggestedTravelTopUp - suggestedInvestment, 0);
          allocationStrategyNote = "現金水位已達標但退休時達成率偏低，因此提高投資比重，旅遊基金維持低檔。";
        } else {
          suggestedTravelTopUp = Math.min(monthlyTravelSaving, Math.max(available * 0.2, 0));
          suggestedInvestment = Math.min(maxInvestment, available - suggestedTravelTopUp, Math.max(cappedMinimumInvestment, available * 0.5));
          suggestedCashTopUp = Math.max(available - suggestedTravelTopUp - suggestedInvestment, 0);
          allocationStrategyNote = "現金水位與退休節奏相對穩定，可維持投資紀律，並保留旅遊與生活彈性。";
        }
      }
    } else {
      allocationStrategyNote = "本月可分配金額為負，應優先檢查固定支出與貸款壓力。";
    }
    suggestedTravelTopUp = Math.floor(suggestedTravelTopUp);
    suggestedInvestment = Math.floor(suggestedInvestment);
    suggestedCashTopUp = Math.max(0, Math.floor(available) - suggestedTravelTopUp - suggestedInvestment);
    const investmentRate = monthlyTotalIncome > 0 ? (suggestedInvestment / monthlyTotalIncome) * 100 : 0;
    const projectedInvestmentAtRetirement = monthsToRetirement === 0
      ? currentInvestmentAsset
      : currentInvestmentAsset * growthFactor + suggestedInvestment * annuityFactor;
    const projectedFinancialFreedomRate = financialFreedomTarget > 0 ? (projectedInvestmentAtRetirement / financialFreedomTarget) * 100 : 0;
    const projectedFinancialFreedomGap = financialFreedomTarget - projectedInvestmentAtRetirement;
    let monthsToNextTier = null;
    if (wealthTier.nextThreshold !== null && suggestedInvestment > 0) {
      if (monthlyRate === 0) monthsToNextTier = Math.ceil(gapToNextTier / suggestedInvestment);
      else {
        const ratio = (wealthTier.nextThreshold * monthlyRate + suggestedInvestment) / (investableNetWorth * monthlyRate + suggestedInvestment);
        const months = Math.log(ratio) / Math.log(1 + monthlyRate);
        if (Number.isFinite(months) && months >= 0) monthsToNextTier = Math.ceil(months);
      }
    }
    const scoreBreakdown = {
      cashRunway: 25 * clamp(cashRunwayMonths / recommendedRunwayMonths, 0, 1),
      fixedExpense: monthlyTotalIncome > 0 ? getFixedExpenseScore(fixedExpenseRatio) : 0,
      availableCashflow: getAvailableCashflowScore(available, monthlyTotalIncome),
      liquidWealthTierRaw: getWealthTierScore(wealthTier.tier),
      taiwanWealthDecileRaw: getTaiwanWealthDecileScore(taiwanHouseholdWealthPosition.label),
      financialFreedomCurrent: 10 * clamp(financialFreedomProgress / 100, 0, 1),
      financialFreedomProjected: 10 * clamp(projectedFinancialFreedomRate / 100, 0, 1),
    };
    scoreBreakdown.cashFlowSafety = clamp(scoreBreakdown.cashRunway + scoreBreakdown.fixedExpense + scoreBreakdown.availableCashflow, 0, 35);
    scoreBreakdown.liquidWealthTier = clamp((scoreBreakdown.liquidWealthTierRaw / 20) * 25, 0, 25);
    scoreBreakdown.officialHouseholdWealth = clamp((scoreBreakdown.taiwanWealthDecileRaw / 9) * 20, 0, 20);
    scoreBreakdown.longTermFreedom = clamp(scoreBreakdown.financialFreedomCurrent + scoreBreakdown.financialFreedomProjected, 0, 20);
    const score = clamp(
      scoreBreakdown.cashFlowSafety +
      scoreBreakdown.liquidWealthTier +
      scoreBreakdown.officialHouseholdWealth +
      scoreBreakdown.longTermFreedom,
      0,
      100
    );
    return {
      monthlyTotalIncome, annualAverageMonthlyIncome, annualIncome, fixedExpense, available, currentCash, currentInvestmentAsset,
      investableNetWorth, totalNetWorth, estimatedMortgageBalance, estimatedPersonalLoanBalance, cashRunwayMonths, recommendedRunwayMonths, recommendedCashTarget, cashGap, recommendedRunwayReason,
      savingRate, fixedExpenseRatio, investmentRate, ageBenchmark, stableBenchmarkAsset, conservativeBenchmarkAsset,
      aggressiveBenchmarkAsset, incomeMultiple, gapToStableBenchmark, gapToStableBenchmarkPercent, wealthTier, totalWealthTier, taiwanHouseholdWealthPosition, gapToTaiwanMedianWealth, gapToNextTaiwanWealthDecile, gapToNextTier, gapToNextTotalTier, travelProgress,
      monthlyTravelSaving, suggestedCashTopUp, suggestedTravelTopUp, suggestedInvestment, financialFreedomTarget,
      financialFreedomProgress, financialFreedomGap, projectedInvestmentAtRetirement, projectedFinancialFreedomRate, projectedFinancialFreedomGap, requiredMonthlyInvestmentForTarget, allocationStrategyNote, monthsToNextTier, score, scoreBreakdown,
    };

}
export { defaultInputs, TAIWAN_OFFICIAL_SOURCE_NOTE };
