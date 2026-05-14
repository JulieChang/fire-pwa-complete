import React, { useMemo, useState } from "react";
import GrowthAgent from "./GrowthAgent";
import { articles } from "./articles";
import "./App.css";

const isDev = window.location.search.includes("dev");
const STORAGE_KEY = "finopsPlannerInputsV3";

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

const householdOptions = {
  single: "單身 / 自己負擔自己",
  couple: "夫妻 / 伴侶",
  familyWithKids: "家庭含子女",
  withParents: "與父母同住",
  other: "其他",
};

const incomeStabilityOptions = {
  stable: "穩定受薪",
  variableBonus: "業績獎金波動較大",
  freelance: "接案 / 自營收入",
  unstable: "目前收入不穩定",
};

const formatNTD = (value) => {
  const number = Number(value) || 0;
  const sign = number < 0 ? "-" : "";
  return `${sign}NT$ ${Math.abs(Math.round(number)).toLocaleString("zh-TW")}`;
};

const formatPercent = (value, digits = 1) => `${(Number(value) || 0).toFixed(digits)}%`;
const clamp = (value, min = 0, max = 100) => Math.min(Math.max(Number(value) || 0, min), max);
const toNumber = (value) => Number(value) || 0;

const getInitialInputs = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultInputs, ...JSON.parse(saved) } : defaultInputs;
  } catch {
    return defaultInputs;
  }
};

const getWealthTier = (investableNetWorth) => {
  const tiers = [
    { tier: "A-9", name: "負資產階段", threshold: -Infinity, nextThreshold: 0, nextTier: "A1", description: "可投資淨資產小於 0，代表負債大於可動用資產，優先目標是償還債務、降低固定支出並補足基本生活現金。" },
    { tier: "A1", name: "初始資產階段", threshold: 0, nextThreshold: 100000, nextTier: "A2", description: "資產仍在起步階段，能滿足基本生活需求，但財務自由度較低，重點是建立第一筆緊急預備金。" },
    { tier: "A2", name: "小額資產累積階段", threshold: 100000, nextThreshold: 500000, nextTier: "A3", description: "已有小額資產累積，開始具備部分自由度，可偶爾安排旅遊或改善生活，但仍需優先擴大現金安全水位。" },
    { tier: "A3", name: "小資族儲蓄階段", threshold: 500000, nextThreshold: 1000000, nextTier: "A4", description: "已具備一定儲蓄能力，可支撐短期國內旅遊與生活彈性，接下來要把儲蓄轉化為長期投資資產。" },
    { tier: "A4", name: "資產累積期", threshold: 1000000, nextThreshold: 3000000, nextTier: "A5", description: "進入資產累積期，生活相對自由，可安排短期國外旅遊，重點是維持投資紀律與避免負債膨脹。" },
    { tier: "A5", name: "穩定中產階級", threshold: 3000000, nextThreshold: 5000000, nextTier: "A6", description: "具備穩定生活品質與基本自由度，應開始優化資產配置、保險與長期退休現金流。" },
    { tier: "A6", name: "具備經濟實力", threshold: 5000000, nextThreshold: 10000000, nextTier: "A7", description: "生活自由度提高，可較頻繁安排國外旅遊，需重視資產配置效率與風險分散。" },
    { tier: "A7", name: "百萬資產族", threshold: 10000000, nextThreshold: 30000000, nextTier: "A8", description: "已具備財務自由雛形，可選擇較高端生活方式，重點從累積轉向現金流與資產保護。" },
    { tier: "A8", name: "千萬資產族", threshold: 30000000, nextThreshold: 100000000, nextTier: "A9", description: "高度自由，可依照理想生活規劃居住、工作與旅行方式，需建立完整資產配置與稅務觀念。" },
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
const TAIWAN_OFFICIAL_SOURCE_NOTE = "資料來源：行政院主計總處國富統計，110 年家庭財富分配統計，113 年發布。114 年家庭財富分配統計預計於 117 年 4 月下旬發布。";

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

function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="/">Personal FinOps Planner</a>
      <nav className="site-nav">
        <a href="/">財務診斷</a>
        <a href="/monthly-saving-rate">存錢比例</a>
        <a href="/blog/cash-runway">現金水位</a>
        <a href="/blog/same-age-savings">同齡比較</a>
        <a href="/blog/wealth-tier">財務階層</a>
        <a href="/blog">文章</a>
        <a href="/about">關於本站</a>
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Personal FinOps Planner</strong>
        <p>用 FinOps 思維管理個人現金流、投資配置、旅遊基金與財務自由進度。</p>
      </div>
      <div className="footer-links">
        <a href="/">首頁</a>
        <a href="/monthly-saving-rate">每月存錢比例</a>
        <a href="/blog/cash-runway">現金安全水位</a>
        <a href="/blog/travel-budget">旅遊基金</a>
        <a href="/blog/investment-allocation">投資分配</a>
        <a href="/blog/financial-freedom">財務自由</a>
        <a href="/blog/same-age-savings">同齡存款比較</a>
        <a href="/blog/wealth-tier">財務階層</a>
        <a href="/blog/fixed-expense-ratio">固定支出比</a>
        <a href="/about">關於本站</a>
        <a href="/privacy-policy">隱私權政策</a>
        <a href="/disclaimer">免責聲明</a>
        <a href="/contact">聯絡我們</a>
      </div>
    </footer>
  );
}

function PageShell({ children, className = "app" }) {
  return <><SiteHeader /><main className={className}>{children}</main><SiteFooter /></>;
}

function HomeButton() {
  return <a className="home-button" href="/">← 回到首頁使用財務診斷工具</a>;
}

function NumberInput({ label, value, onChange, suffix = "NTD", hint, tooltip }) {
  return (
    <label className="input-card">
      <span className="field-label">
        {label}
        {tooltip && (
          <button className="help-tip" type="button" aria-label={tooltip} title={tooltip}>?</button>
        )}
      </span>
      <div className="input-wrap">
        <input type="number" value={value} onChange={(e) => onChange(toNumber(e.target.value))} />
        <em>{suffix}</em>
      </div>
      {hint && <small>{hint}</small>}
    </label>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="input-card">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.entries(options).map(([key, text]) => <option value={key} key={key}>{text}</option>)}
      </select>
    </label>
  );
}

function MetricCard({ title, value, note, tone = "default" }) {
  return <section className={`metric-card ${tone}`}><p>{title}</p><h3>{value}</h3>{note && <span>{note}</span>}</section>;
}

function ProgressBar({ value }) {
  return <div className="progress"><div style={{ width: `${clamp(value)}%` }} /></div>;
}

function ArticleLinks() {
  return (
    <section className="section">
      <div className="section-heading">
        <p className="eyebrow">延伸閱讀</p>
        <h2>算完後，建議接著看這些主題</h2>
      </div>
      <div className="article-grid">
        {articles.slice(0, 8).map((article) => (
          <a className="article-card" href={`/blog/${article.slug}`} key={article.slug}>
            <span>{article.category}</span>
            <h3>{article.title}</h3>
            <p>{article.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function SharePanel({ result }) {
  const pageUrl = window.location.origin;
  const shareText = `我的 Personal FinOps 診斷：流動財務階層 ${result.wealthTier.tier}｜${result.wealthTier.name}，總資產階層 ${result.totalWealthTier.tier}｜${result.totalWealthTier.name}，現金安全月數 ${result.cashRunwayMonths.toFixed(1)} 個月，收入倍數檢查點 ${result.incomeMultiple.toFixed(1)} 倍，財務自由進度 ${result.financialFreedomProgress.toFixed(1)}%。一起試算：${pageUrl}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(pageUrl);
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      alert("已複製分享文案。");
    } catch {
      alert("複製失敗，請手動選取文字。");
    }
  };
  return (
    <section className="share-section section">
      <h2>分享我的財務診斷結果</h2>
      <p className="muted">分享內容不會包含你的完整輸入資料，只會帶出階層、現金水位與財務自由進度摘要。</p>
      <div className="share-buttons">
        <button onClick={copyText}>複製分享文案</button>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer">Facebook</a>
        <a href={`https://www.threads.net/intent/post?text=${encodedText}`} target="_blank" rel="noreferrer">Threads</a>
        <a href={`https://twitter.com/intent/tweet?text=${encodedText}`} target="_blank" rel="noreferrer">X</a>
        <a href={`https://social-plugins.line.me/lineit/share?url=${encodedUrl}`} target="_blank" rel="noreferrer">LINE</a>
        <button onClick={() => window.print()}>存成 PDF</button>
      </div>
    </section>
  );
}

function HomePage() {
  const [inputs, setInputs] = useState(() => getInitialInputs());
  const [calculatedInputs, setCalculatedInputs] = useState(() => getInitialInputs());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const update = (key, value) => {
    const next = { ...inputs, [key]: value };
    setInputs(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const handleCalculate = () => {
    setCalculatedInputs(inputs);
    setHasCalculated(true);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); } catch { /* ignore */ }
    setTimeout(() => document.getElementById("diagnosis-report")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const resetToDefault = () => {
    setInputs(defaultInputs);
    setCalculatedInputs(defaultInputs);
    setHasCalculated(false);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultInputs)); } catch { /* ignore */ }
  };

  const result = useMemo(() => {
    const data = calculatedInputs;
    const monthlyIncome = toNumber(data.monthlyIncome);
    const annualBonus = toNumber(data.annualBonus);
    const otherAnnualIncome = toNumber(data.otherAnnualIncome);
    const monthlyTotalIncome = monthlyIncome + annualBonus / 12 + otherAnnualIncome / 12;
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
    const totalNetWorth = currentCash + currentInvestmentAsset + toNumber(data.homeValue) - estimatedMortgageBalance - estimatedPersonalLoanBalance - toNumber(data.otherDebt);
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
    const recommendedCashTarget = fixedExpense * recommendedRunwayMonths;
    const cashGap = recommendedCashTarget - currentCash;
    const savingRate = monthlyTotalIncome > 0 ? (available / monthlyTotalIncome) * 100 : 0;
    const fixedExpenseRatio = monthlyTotalIncome > 0 ? (fixedExpense / monthlyTotalIncome) * 100 : 0;
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
    const financialFreedomProgress = financialFreedomTarget > 0 ? (investableNetWorth / financialFreedomTarget) * 100 : 0;
    const financialFreedomGap = financialFreedomTarget - investableNetWorth;
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
      if (cashRunwayMonths < recommendedRunwayMonths) {
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
          suggestedInvestment = Math.min(maxInvestment, Math.max(cappedMinimumInvestment, available * 0.5));
          suggestedCashTopUp = Math.max(available - suggestedTravelTopUp - suggestedInvestment, 0);
          allocationStrategyNote = "現金水位與退休節奏相對穩定，可維持投資紀律，並保留旅遊與生活彈性。";
        }
      }
    } else {
      allocationStrategyNote = "本月可分配金額為負，應優先檢查固定支出與貸款壓力。";
    }
    suggestedCashTopUp = Math.round(suggestedCashTopUp);
    suggestedTravelTopUp = Math.round(suggestedTravelTopUp);
    suggestedInvestment = Math.round(suggestedInvestment);
    const investmentRate = monthlyTotalIncome > 0 ? (suggestedInvestment / monthlyTotalIncome) * 100 : 0;
    const projectedInvestmentAtRetirement = monthsToRetirement === 0
      ? currentInvestmentAsset
      : currentInvestmentAsset * growthFactor + suggestedInvestment * annuityFactor;
    const projectedFinancialFreedomRate = financialFreedomTarget > 0 ? (projectedInvestmentAtRetirement / financialFreedomTarget) * 100 : 0;
    const projectedFinancialFreedomGap = financialFreedomTarget - projectedInvestmentAtRetirement;
    const monthsToNextTier = suggestedInvestment > 0 && wealthTier.nextThreshold
      ? Math.ceil(Math.log((wealthTier.nextThreshold * monthlyRate + suggestedInvestment) / (Math.max(investableNetWorth, 0) * monthlyRate + suggestedInvestment)) / Math.log(1 + monthlyRate))
      : null;
    const scoreBreakdown = {
      cashRunway: 25 * clamp(cashRunwayMonths / recommendedRunwayMonths, 0, 1),
      fixedExpense: getFixedExpenseScore(fixedExpenseRatio),
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
      monthlyTotalIncome, annualIncome, fixedExpense, available, currentCash, currentInvestmentAsset,
      investableNetWorth, totalNetWorth, estimatedMortgageBalance, estimatedPersonalLoanBalance, cashRunwayMonths, recommendedRunwayMonths, recommendedCashTarget, cashGap, recommendedRunwayReason,
      savingRate, fixedExpenseRatio, investmentRate, ageBenchmark, stableBenchmarkAsset, conservativeBenchmarkAsset,
      aggressiveBenchmarkAsset, incomeMultiple, gapToStableBenchmark, gapToStableBenchmarkPercent, wealthTier, totalWealthTier, taiwanHouseholdWealthPosition, gapToTaiwanMedianWealth, gapToNextTaiwanWealthDecile, gapToNextTier, gapToNextTotalTier, travelProgress,
      monthlyTravelSaving, suggestedCashTopUp, suggestedTravelTopUp, suggestedInvestment, financialFreedomTarget,
      financialFreedomProgress, financialFreedomGap, projectedInvestmentAtRetirement, projectedFinancialFreedomRate, projectedFinancialFreedomGap, requiredMonthlyInvestmentForTarget, allocationStrategyNote, monthsToNextTier, score, scoreBreakdown,
    };
  }, [calculatedInputs]);

  const isDirty = JSON.stringify(inputs) !== JSON.stringify(calculatedInputs);

  const cashTone = result.cashRunwayMonths >= result.recommendedRunwayMonths ? "good" : result.cashRunwayMonths >= 3 ? "warning" : "danger";
  const expenseTone = result.fixedExpenseRatio <= 50 ? "good" : result.fixedExpenseRatio <= 65 ? "warning" : "danger";
  const benchmarkTone = result.gapToStableBenchmark >= 0 ? "good" : "warning";

  return (
    <PageShell>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Personal FinOps 財務診斷工具</p>
          <h1>看懂你的現金流、財務階層與同齡落差</h1>
          <p>
            輸入收入、家庭責任、支出、資產與負債，快速產出財務健康分數、
            現金安全水位、A-9至A12 財務階層、台灣家庭財富分位、收入倍數檢查點與下一步改善建議。
          </p>

          <div className="hero-actions">
            <a href="#calculator" className="primary-button">開始財務診斷</a>
            <a href="/blog/same-age-savings" className="secondary-button">查看同齡比較</a>
          </div>

          <div className="hero-pills">
            <span>財務健康分數</span>
            <span>A-9–A12 財務階層</span>
            <span>官方家庭財富分位</span>
          </div>
        </div>

        <div className="hero-panel" aria-label="財務診斷摘要">
          <div className="hero-panel-header">
            <span>診斷報告預覽</span>
            <strong>Personal FinOps</strong>
          </div>

          <div className="hero-score">
            <span>財務健康分數</span>
            <strong>{Math.round(result.score)}</strong>
            <em>/ 100</em>
          </div>

          <div className="hero-mini-grid">
            <div>
              <span>財務階層</span>
              <strong>{result.wealthTier.tier}</strong>
              <small>{result.wealthTier.name}</small>
            </div>
            <div>
              <span>現金水位</span>
              <strong>{result.cashRunwayMonths.toFixed(1)}</strong>
              <small>個月</small>
            </div>
            <div>
              <span>家庭分位</span>
              <strong>{result.taiwanHouseholdWealthPosition.label}</strong>
              <small>{result.taiwanHouseholdWealthPosition.percentile}</small>
            </div>
            <div>
              <span>自由進度</span>
              <strong>{formatPercent(result.financialFreedomProgress, 0)}</strong>
              <small>目標完成率</small>
            </div>
          </div>
        </div>
      </section>

      <section className="section intro-content">
        <h2>這不是投資明牌工具，而是個人財務作戰儀表板</h2>
        <p>很多人每個月都有收入，也有投資，但真正困難的是：不知道現金水位是否安全、旅遊預算會不會超支、每月到底該投資多少，以及距離理想生活還有多遠。Personal FinOps Planner 用企業 FinOps 的邏輯，把收入、固定支出、資產、負債與人生目標拆成可管理的資金桶，協助你建立長期可執行的財務秩序。</p>
        <p>診斷結果會區分「官方統計參考」與「退休規劃模型」。官方統計參考採台灣家庭財富分位口徑；收入倍數檢查點則是退休規劃常見模型，不是官方個人排名。</p>
      </section>

      <section className="section" id="calculator">
        <div className="section-heading">
          <p className="eyebrow">Step 1</p>
          <h2>輸入資料，產出你的財務診斷報告</h2>
          <p>
            預設值已改為 30 歲單身上班族的常見試算情境。瀏覽器會自動保留你前一次輸入的資料；
            修改欄位後請按「計算我的財務診斷」更新下方報告。
          </p>
          {isDirty && <p className="pending-note">你已修改輸入資料，但下方報告尚未更新。請按「計算我的財務診斷」。</p>}
        </div>

        <div className="input-groups">
          <section className="input-group">
            <div className="input-group-heading">
              <span>01</span>
              <div>
                <h3>基本資料</h3>
                <p>用來判斷同齡比較區間、家庭責任與現金安全水位。</p>
              </div>
            </div>
            <div className="form-grid compact">
              <NumberInput label="年齡" value={inputs.age} onChange={(v) => update("age", v)} suffix="歲" />
              <SelectInput label="家庭型態" value={inputs.householdType} onChange={(v) => update("householdType", v)} options={householdOptions} />
              <NumberInput label="家庭總人數" value={inputs.householdMembers} onChange={(v) => update("householdMembers", v)} suffix="人" />
              <NumberInput label="需由你負擔的家人人數" value={inputs.dependents} onChange={(v) => update("dependents", v)} suffix="人" hint="只負責自己請填 0；此欄不含本人。若主要負擔 1 位父母、伴侶或小孩就填 1。" />
            </div>
          </section>

          <section className="input-group">
            <div className="input-group-heading">
              <span>02</span>
              <div>
                <h3>收入</h3>
                <p>用來計算年收入、儲蓄率與收入倍數檢查點。</p>
              </div>
            </div>
            <div className="form-grid compact">
              <NumberInput label="每月固定收入" value={inputs.monthlyIncome} onChange={(v) => update("monthlyIncome", v)} />
              <NumberInput label="年度獎金 / 業績獎金" value={inputs.annualBonus} onChange={(v) => update("annualBonus", v)} />
              <NumberInput label="其他年度收入" value={inputs.otherAnnualIncome} onChange={(v) => update("otherAnnualIncome", v)} />
              <SelectInput label="收入穩定性" value={inputs.incomeStability} onChange={(v) => update("incomeStability", v)} options={incomeStabilityOptions} />
            </div>
          </section>

          <section className="input-group">
            <div className="input-group-heading">
              <span>03</span>
              <div>
                <h3>支出與貸款現金流</h3>
                <p>用來計算固定支出比、每月可分配金額與現金安全月數。</p>
              </div>
            </div>
            <div className="form-grid compact">
              <NumberInput label="房貸每月還款" value={inputs.mortgage} onChange={(v) => update("mortgage", v)} />
              <NumberInput label="房貸剩餘期數" value={inputs.mortgageRemainingMonths} onChange={(v) => update("mortgageRemainingMonths", v)} suffix="期" />
              <NumberInput label="信貸每月還款" value={inputs.personalLoan} onChange={(v) => update("personalLoan", v)} />
              <NumberInput label="信貸剩餘期數" value={inputs.personalLoanRemainingMonths} onChange={(v) => update("personalLoanRemainingMonths", v)} suffix="期" />
              <NumberInput label="保險費" value={inputs.insurance} onChange={(v) => update("insurance", v)} />
              <NumberInput label="生活費" value={inputs.livingExpense} onChange={(v) => update("livingExpense", v)} />
              <NumberInput label="水電瓦斯網路" value={inputs.utilities} onChange={(v) => update("utilities", v)} />
              <NumberInput label="交通費" value={inputs.transportation} onChange={(v) => update("transportation", v)} />
              <NumberInput label="孝親費 / 家庭支援" value={inputs.familySupport} onChange={(v) => update("familySupport", v)} />
              <NumberInput label="其他固定支出" value={inputs.otherFixedExpense} onChange={(v) => update("otherFixedExpense", v)} />
            </div>
          </section>

          <section className="input-group">
            <div className="input-group-heading">
              <span>04</span>
              <div>
                <h3>現金水位</h3>
                <p>用來判斷緊急預備金是否足夠，以及本月是否應優先補現金。</p>
              </div>
            </div>
            <div className="form-grid compact">
              <NumberInput label="現金存款" value={inputs.currentCash} onChange={(v) => update("currentCash", v)} />
              <NumberInput label="現金目標" value={inputs.cashGoal} onChange={(v) => update("cashGoal", v)} hint="可填自己的目標；診斷也會依支出自動估算建議安全水位。" />
            </div>
          </section>

          <section className="input-group">
            <div className="input-group-heading">
              <span>05</span>
              <div>
                <h3>投資</h3>
                <p>用來計算可投資淨資產、投資率、財務階層與下一階層差距。</p>
              </div>
            </div>
            <div className="form-grid compact">
              <NumberInput label="目前投資資產" value={inputs.currentInvestmentAsset} onChange={(v) => update("currentInvestmentAsset", v)} />
              <NumberInput label="每月最低投資" value={inputs.minInvestment} onChange={(v) => update("minInvestment", v)} />
              <NumberInput label="每月最高投資" value={inputs.maxInvestment} onChange={(v) => update("maxInvestment", v)} />
              <NumberInput label="預期年化報酬率" value={inputs.annualReturnRate} onChange={(v) => update("annualReturnRate", v)} suffix="%" />
            </div>
          </section>

          <section className="input-group">
            <div className="input-group-heading">
              <span>06</span>
              <div>
                <h3>旅遊規劃</h3>
                <p>用來計算年度旅遊基金完成率與每月沉澱金額。</p>
              </div>
            </div>
            <div className="form-grid compact">
              <NumberInput label="年度旅遊預算" value={inputs.annualTravelBudget} onChange={(v) => update("annualTravelBudget", v)} />
              <NumberInput label="目前旅遊基金" value={inputs.currentTravelFund} onChange={(v) => update("currentTravelFund", v)} />
            </div>
          </section>

          <section className="input-group">
            <div className="input-group-heading">
              <span>07</span>
              <div>
                <h3>退休目標</h3>
                <p>用 25 倍年支出估算財務自由目標，並推估退休時投資資產。</p>
              </div>
            </div>
            <div className="form-grid compact">
              <NumberInput label="退休後目標月支出" value={inputs.retirementMonthlyCashflow} onChange={(v) => update("retirementMonthlyCashflow", v)} />
              <NumberInput label="目標退休年齡" value={inputs.retirementAge} onChange={(v) => update("retirementAge", v)} suffix="歲" />
            </div>
          </section>
        </div>

        <button className="toggle-button" onClick={() => setShowAdvanced(!showAdvanced)}>
          {showAdvanced ? "收合精準淨資產欄位" : "展開精準淨資產欄位（可選填）"}
        </button>
        {showAdvanced && (
          <div className="input-group advanced-box">
            <div className="input-group-heading">
              <span>進階</span>
              <div>
                <h3>精準淨資產資料</h3>
                <p>
                  基本版已可用「月繳 × 剩餘期數」估算貸款剩餘現金流，因此不用一定要填剩餘本金。
                  若你想讓總淨資產更精準，可在這裡填入實際房貸與信貸剩餘本金。
                </p>
              </div>
            </div>
            <div className="form-grid compact advanced-grid">
              <NumberInput label="自住房市值（可選填）" value={inputs.homeValue} onChange={(v) => update("homeValue", v)} />
              <NumberInput label="房貸剩餘本金（可選填）" value={inputs.mortgageBalance} onChange={(v) => update("mortgageBalance", v)} hint="不填則用房貸月繳 × 剩餘期數做簡化估算。" />
              <NumberInput label="信貸剩餘本金（可選填）" value={inputs.personalLoanBalance} onChange={(v) => update("personalLoanBalance", v)} hint="不填則用信貸月繳 × 剩餘期數做簡化估算。" />
              <NumberInput label="其他負債" value={inputs.otherDebt} onChange={(v) => update("otherDebt", v)} />
            </div>
          </div>
        )}

        <div className="calculator-actions">
          <button className="calculate-button" onClick={handleCalculate}>計算我的財務診斷</button>
          <button className="reset-button" onClick={resetToDefault}>恢復 30 歲預設範例</button>
          <p>{isDirty ? "資料已修改但尚未重新計算；請按上方藍色按鈕更新診斷報告。" : hasCalculated ? "已依目前輸入資料更新下方診斷報告。" : "下方先顯示預設範例；修改欄位後請按計算更新報告。"}</p>
        </div>
      </section>

      <section className="dashboard section" id="diagnosis-report">
        <div className="section-heading">
          <p className="eyebrow">Step 2</p>
          <h2>你的個人 FinOps 診斷報告</h2>
          <p>以下結果依「已計算」資料估算，目前報告使用年齡為 {calculatedInputs.age} 歲。若你剛修改欄位，請先按「計算我的財務診斷」更新報告。</p>
        </div>
        <div className="score-card">
          <div>
            <p className="eyebrow">財務健康分數</p>
            <h2>{Math.round(result.score)} / 100</h2>
            <ProgressBar value={result.score} />
          </div>
          <div className="dual-tier-card">
            <div className="tier-badge compact-tier">
              <p className="tier-label">流動財務階層</p>
              <span>{result.wealthTier.tier}</span>
              <strong>{result.wealthTier.name}</strong>
              <p>依可投資淨資產 {formatNTD(result.investableNetWorth)} 判斷，不含自住房；用來觀察現金流、投資與財務自由能力。</p>
            </div>
            <div className="tier-badge compact-tier muted-tier">
              <p className="tier-label">總資產階層</p>
              <span>{result.totalWealthTier.tier}</span>
              <strong>{result.totalWealthTier.name}</strong>
              <p>依總淨資產 {formatNTD(result.totalNetWorth)} 判斷，含自住房與貸款；用來觀察完整資產位置。</p>
            </div>
          </div>
        </div>
        <div className="benchmark-explanation score-explanation">
          <h3>財務健康分數如何計算？</h3>
          <p>
            財務健康總分是本工具用來檢查「短期現金流是否安全、可動用資產是否足夠、完整家庭財富位置是否偏低，以及長期財務自由進度是否跟得上」的綜合分數。
            公式為：<strong>財務健康總分 100 = 現金流安全 35 + 流動資產階層 25 + 官方家庭財富分位 20 + 長期自由進度 20</strong>。
            這不是官方排名，也不是同齡 PR 值，而是把不同口徑分開呈現，避免把家庭財富統計誤解為個人同齡排名。
          </p>
          <div className="score-breakdown-grid four-pillars">
            <div><span>現金流安全</span><strong>{result.scoreBreakdown.cashFlowSafety.toFixed(1)} / 35</strong><small>現金安全月數、固定支出比、每月可分配金額</small></div>
            <div><span>流動資產階層</span><strong>{result.scoreBreakdown.liquidWealthTier.toFixed(1)} / 25</strong><small>依可投資淨資產對應 A-9 至 A12 階層</small></div>
            <div><span>官方家庭財富分位</span><strong>{result.scoreBreakdown.officialHouseholdWealth.toFixed(1)} / 20</strong><small>依總淨資產對照主計總處家庭財富十分位</small></div>
            <div><span>長期自由進度</span><strong>{result.scoreBreakdown.longTermFreedom.toFixed(1)} / 20</strong><small>財務自由目前進度與退休時達成率</small></div>
          </div>
          <div className="formula-box">
            <p><strong>現金流安全 35 分</strong> = 現金安全月數達標度 {result.scoreBreakdown.cashRunway.toFixed(1)} / 25 + 固定支出壓力 {result.scoreBreakdown.fixedExpense.toFixed(1)} / 7 + 可分配現金流 {result.scoreBreakdown.availableCashflow.toFixed(1)} / 3。</p>
            <p><strong>流動資產階層 25 分</strong> = 可投資淨資產 {formatNTD(result.investableNetWorth)} 對應 {result.wealthTier.tier}，換算 {result.scoreBreakdown.liquidWealthTier.toFixed(1)} 分。</p>
            <p><strong>官方家庭財富分位 20 分</strong> = 總淨資產 {formatNTD(result.totalNetWorth)} 對照 {result.taiwanHouseholdWealthPosition.label}，換算 {result.scoreBreakdown.officialHouseholdWealth.toFixed(1)} 分。</p>
            <p><strong>長期自由進度 20 分</strong> = 目前財務自由進度 {result.scoreBreakdown.financialFreedomCurrent.toFixed(1)} / 10 + 退休時達成率 {result.scoreBreakdown.financialFreedomProjected.toFixed(1)} / 10。</p>
          </div>
          <p>
            首頁「診斷報告預覽」會保留財務健康總分、現金流安全、流動資產階層與官方家庭財富分位；同齡收入倍數比較則放在完整報告中，作為退休規劃模型參考，而非官方排名。
          </p>
        </div>
        <div className="metrics-grid">
          <MetricCard title="可投資淨資產" value={formatNTD(result.investableNetWorth)} note="現金＋投資資產－信貸與其他負債，不含自住房。" />
          <MetricCard title="貸款剩餘估算" value={formatNTD(result.estimatedMortgageBalance + result.estimatedPersonalLoanBalance)} note="基本版以月繳 × 剩餘期數估算；進階欄位可填實際本金。" />
          <MetricCard title="總淨資產" value={formatNTD(result.totalNetWorth)} note="含自住房與貸款。若未填實際本金，系統以月繳 × 剩餘期數估算。" />
          <MetricCard title="流動階層差距" value={result.wealthTier.nextTier ? formatNTD(result.gapToNextTier) : "已達 A12"} note={result.wealthTier.nextTier ? `距離 ${result.wealthTier.nextTier}，依可投資淨資產計算。` : "重點轉向資產保護與現金流管理。"} />
          <MetricCard title="總資產階層差距" value={result.totalWealthTier.nextTier ? formatNTD(result.gapToNextTotalTier) : "已達 A12"} note={result.totalWealthTier.nextTier ? `距離 ${result.totalWealthTier.nextTier}，依總淨資產計算。` : "已達資產金字塔最高區間。"} />
          <MetricCard title="台灣家庭財富分位" value={result.taiwanHouseholdWealthPosition.label} note={`${result.taiwanHouseholdWealthPosition.percentile}；依總淨資產與主計總處家庭財富分位估算。`} />
          <MetricCard title="與家庭財富中位數差距" value={formatNTD(result.gapToTaiwanMedianWealth)} note={result.gapToTaiwanMedianWealth >= 0 ? "高於 110 年底家庭財富中位數 894 萬。" : "低於 110 年底家庭財富中位數 894 萬。"} tone={result.gapToTaiwanMedianWealth >= 0 ? "good" : "warning"} />
          <MetricCard title="收入倍數檢查點" value={`${result.incomeMultiple.toFixed(1)} 倍`} note={`${result.ageBenchmark.label} 退休規劃模型約 ${result.ageBenchmark.stable} 倍年收入，非官方排名。`} tone={benchmarkTone} />
          <MetricCard title="收入倍數差距" value={formatNTD(result.gapToStableBenchmark)} note={result.gapToStableBenchmark >= 0 ? "高於模型檢查點。" : "低於模型檢查點，建議提高儲蓄與投資紀律。"} tone={benchmarkTone} />
          <MetricCard title="現金安全月數" value={`${result.cashRunwayMonths.toFixed(1)} 個月`} note={`${result.recommendedRunwayReason}。建議 ${result.recommendedRunwayMonths} 個月。`} tone={cashTone} />
          <MetricCard title="固定支出比" value={formatPercent(result.fixedExpenseRatio)} note="超過 60% 代表現金流壓力偏高。" tone={expenseTone} />
          <MetricCard title="每月可分配金額" value={formatNTD(result.available)} note="月收入＋獎金月平均－固定支出。" tone={result.available >= 0 ? "good" : "danger"} />
          <MetricCard title="財務自由目前進度" value={formatPercent(result.financialFreedomProgress)} note={`目前可投資淨資產 ÷ 目標資產 ${formatNTD(result.financialFreedomTarget)}`} />
          <MetricCard title="退休時財務自由達成率" value={formatPercent(result.projectedFinancialFreedomRate)} note={`退休時預估缺口：${formatNTD(Math.max(result.projectedFinancialFreedomGap, 0))}`} tone={result.projectedFinancialFreedomRate >= 100 ? "good" : result.projectedFinancialFreedomRate >= 80 ? "warning" : "danger"} />
        </div>

        <div className="benchmark-explanation">
          <h3>官方統計參考與收入倍數模型有什麼不同？</h3>
          <p>
            <strong>台灣家庭財富分位</strong>採用主計總處國富統計的家庭財富分配口徑，
            以你的總淨資產 {formatNTD(result.totalNetWorth)} 對照家庭淨資產十分位門檻。
            目前約落在 <strong>{result.taiwanHouseholdWealthPosition.label}</strong>，{result.taiwanHouseholdWealthPosition.percentile}。
            若要到下一個官方分位 {result.taiwanHouseholdWealthPosition.nextLabel || "最高區間以上"}，約還差 {result.taiwanHouseholdWealthPosition.nextThreshold ? formatNTD(result.gapToNextTaiwanWealthDecile) : "無需再追下一分位"}。
          </p>
          <p>
            <strong>收入倍數檢查點</strong>不是官方同齡資產排名，而是退休規劃常見模型。計算方式為：
            <strong> 收入倍數基準 = 年收入 × 年齡區間倍數</strong>。
            目前報告使用 {result.ageBenchmark.label} 的模型倍數 {result.ageBenchmark.stable} 倍，年收入為 {formatNTD(result.annualIncome)}，
            因此模型基準約為 {formatNTD(result.stableBenchmarkAsset)}；可投資淨資產 {formatNTD(result.investableNetWorth)} 減去模型基準後，差距為 {formatNTD(result.gapToStableBenchmark)}。
          </p>
          <p className="source-note">{TAIWAN_OFFICIAL_SOURCE_NOTE}</p>
        </div>
      </section>

      <section className="section allocation-section">
        <div className="section-heading">
          <p className="eyebrow">Step 3</p>
          <h2>本月資金分配建議</h2>
        </div>
        <div className="allocation-grid">
          <MetricCard title="建議補現金" value={formatNTD(result.suggestedCashTopUp)} note={`建議現金目標：${formatNTD(result.recommendedCashTarget)}，缺口：${formatNTD(result.cashGap)}`} tone={cashTone} />
          <MetricCard title="建議旅遊基金" value={formatNTD(result.suggestedTravelTopUp)} note={`年度旅遊基金完成率：${formatPercent(result.travelProgress)}`} />
          <MetricCard title="建議投資金額" value={formatNTD(result.suggestedInvestment)} note={`投資率約 ${formatPercent(result.investmentRate)}，可依風險承受度調整。`} />
          <MetricCard title="退休時預估投資資產" value={formatNTD(result.projectedInvestmentAtRetirement)} note={`依目前建議投資金額、退休年齡與年化報酬率估算。`} />
          <MetricCard title="退休時財務自由達成率" value={formatPercent(result.projectedFinancialFreedomRate)} note={result.projectedFinancialFreedomGap > 0 ? `預估退休時距離目標仍差：${formatNTD(result.projectedFinancialFreedomGap)}` : "依目前節奏，退休時預估可達成財務自由目標。"} tone={result.projectedFinancialFreedomRate >= 100 ? "good" : result.projectedFinancialFreedomRate >= 80 ? "warning" : "danger"} />
        </div>
        <div className="advice-box">
          <h3>下一步建議</h3>
          <p>{result.allocationStrategyNote}</p>
          <ul>
            <li>先確認現金水位是否達到 {result.recommendedRunwayMonths} 個月；這個數字由扶養責任與收入穩定性決定，不是單純由年齡決定。</li>
            <li>固定支出比若超過 60%，避免再增加長期貸款或高額固定承諾。</li>
            <li>投資金額建議採上下限制度，並參考退休時財務自由達成率；若現金水位不足，投資先維持最低額。</li>
            <li>每半年重新試算一次，追蹤財務階層、官方家庭財富分位與收入倍數檢查點是否持續改善。</li>
          </ul>
        </div>
      </section>

      <SharePanel result={result} />
      <ArticleLinks />
      {isDev && <GrowthAgent />}
    </PageShell>
  );
}

function BlogIndexPage() {
  return (
    <PageShell className="app article-page">
      <p className="eyebrow">Personal FinOps Blog</p>
      <h1>個人 FinOps 文章專區</h1>
      <p>這裡整理現金流管理、每月存錢比例、投資配置、旅遊基金、負債管理、財務階層與財務自由推估等主題。文章不提供個別投資標的建議，而是協助你建立一套可長期執行的個人財務管理邏輯。</p>
      <HomeButton />
      <div className="article-grid full">
        {articles.map((article) => (
          <a className="article-card" href={`/blog/${article.slug}`} key={article.slug}>
            <span>{article.category}</span>
            <h2>{article.title}</h2>
            <p>{article.description}</p>
          </a>
        ))}
      </div>
    </PageShell>
  );
}

function ArticlePage({ slug }) {
  const article = articles.find((item) => item.slug === slug);
  if (!article) {
    return <PageShell className="app article-page"><h1>找不到文章</h1><p>這篇文章可能已經移除，請回到文章列表查看其他內容。</p><HomeButton /></PageShell>;
  }
  return (
    <PageShell className="app article-page">
      <p className="eyebrow">{article.category}</p>
      <h1>{article.title}</h1>
      <p className="article-desc">{article.description}</p>
      <p className="muted">最後更新：{article.updatedAt}</p>
      <HomeButton />
      {article.sections.map((section) => (
        <section key={section.heading} className="article-section">
          <h2>{section.heading}</h2>
          {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.table && (
            <div className="article-table-wrap">
              <table className="article-table">
                <thead>
                  <tr>{section.table.headers.map((header) => <th key={header}>{header}</th>)}</tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row) => (
                    <tr key={row.join("-")}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
      <section className="faq-block">
        <h2>常見問題 FAQ</h2>
        {article.faq.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
      <div className="cta-box">
        <h2>用 Personal FinOps Planner 試算你的財務位置</h2>
        <p>回到首頁輸入自己的收入、家庭責任、支出、資產與負債，產出你的現金安全水位、同齡比較、財務階層與財務自由進度。</p>
        <a href="/" className="primary-button">免費開始財務診斷</a>
      </div>
    </PageShell>
  );
}

function AboutPage() {
  return (
    <PageShell className="app article-page">
      <h1>關於個人 FinOps 財務管理工具</h1>
      <HomeButton />
      <p>個人 FinOps 財務管理工具是一個以企業 FinOps、TBM 與現金流管理概念為基礎所設計的個人理財輔助工具，目標是協助使用者更清楚地掌握每月收入、固定支出、生活費、投資配置、旅遊基金與財務自由進度之間的關係。</p>
      <p>許多人在管理個人財務時，常常只關注「這個月還剩多少錢」，卻忽略現金水位是否安全、投資比例是否合理、大型支出是否提前準備，以及固定支出是否已經超過收入可承受範圍。本工具希望用更直覺的方式，幫助使用者建立自己的財務儀表板。</p>
      <p>本網站提供的所有計算結果僅供個人財務規劃與教育參考，不構成任何投資、稅務、法律或保險建議。使用者仍應依自身實際財務狀況、風險承受度與人生規劃，審慎做出決策。</p>
    </PageShell>
  );
}

function PrivacyPolicyPage() {
  return (
    <PageShell className="app article-page">
      <h1>隱私權政策</h1>
      <HomeButton />
      <p>歡迎使用個人 FinOps 財務管理工具。本隱私權政策說明本網站如何處理使用者資料、Cookie、第三方服務與廣告相關資訊。</p>
      <h2>一、我們收集的資訊</h2>
      <p>本網站主要提供財務試算與規劃工具。使用者在頁面中輸入的收入、支出、投資金額、旅遊預算等資料，主要用於即時計算與畫面呈現。本網站不會要求你提供身分證字號、銀行帳號、信用卡號等高度敏感個人資料。</p>
      <h2>二、瀏覽器本機儲存</h2>
      <p>為了讓使用者下次開啟網站時可以保留前一次輸入的試算資料，本網站會將輸入內容儲存在使用者自己的瀏覽器 localStorage 中。這些資料主要保存在使用者裝置端。</p>
      <h2>三、Cookie 與第三方服務</h2>
      <p>本網站可能使用 Cookie 或類似技術，以改善網站體驗、分析流量來源，或提供更合適的內容與廣告。本網站可能使用 Google Analytics、Google AdSense 等第三方服務。</p>
      <h2>四、第三方連結與政策更新</h2>
      <p>本網站可能包含連往第三方網站的連結。第三方網站的資料處理方式依其政策為準。本政策可能因服務調整或法規變更而更新。</p>
      <h2>五、使用者權利</h2>
      <p>使用者可自行清除瀏覽器中的 Cookie、localStorage 或網站資料，以刪除本網站保存在裝置端的試算紀錄。本網站不會主動要求使用者提供身分證字號、銀行帳號、信用卡號或其他高度敏感個人資料。</p>
      <h2>六、聯絡我們</h2>
      <p>若你對本隱私權政策、資料使用方式或網站內容有任何疑問，可透過聯絡頁面與我們聯繫：<a href="/contact">https://finops-planner.vercel.app/contact</a>。最後更新日期：2026 年 5 月 14 日。</p>
    </PageShell>
  );
}

function DisclaimerPage() {
  return (
    <PageShell className="app article-page">
      <h1>財務免責聲明</h1>
      <HomeButton />
      <p>本網站提供之內容與計算工具僅供一般財務規劃、現金流管理與個人理財教育參考，不構成投資建議、理財建議、保險建議、稅務建議、法律建議或任何形式的專業顧問服務。</p>
      <p>Personal FinOps Planner 所產生的現金水位、同齡比較、財務階層、每月分配建議、投資推估與財務自由目標，均依使用者自行輸入的資料與簡化假設計算。實際結果可能受到收入變化、市場波動、利率變動、通膨、稅務、家庭責任與風險承受度等因素影響。</p>
      <p>本網站不保證任何投資報酬，也不推薦特定股票、ETF、基金、保險、貸款或金融商品。使用者應依自身財務狀況與人生目標審慎評估，必要時應諮詢合格專業人士。</p>
    </PageShell>
  );
}

function ContactPage() {
  return (
    <PageShell className="app article-page">
      <h1>聯絡我們</h1>
      <HomeButton />
      <p>如果你對個人 FinOps 財務管理工具有任何問題、建議、合作邀約，或發現網站內容需要修正，歡迎透過以下方式與我們聯繫。</p>
      <h2>聯絡方式</h2>
      <p>Facebook 粉絲專頁：<a href="https://www.facebook.com/finopsplanner" target="_blank" rel="noreferrer">個人 FinOps 財務管理</a></p>
      <h2>網站用途</h2>
      <p>本網站主要提供個人財務管理、現金流試算、投資分配、同齡資產比較與旅遊基金規劃相關工具。網站內容僅供一般資訊與個人規劃參考，不提供個別化投資建議。</p>
    </PageShell>
  );
}

export default function App() {
  const path = window.location.pathname.replace(/^\//, "").replace(/\/$/, "");
  if (path === "" || path === "index.html") return <HomePage />;
  if (path === "articles" || path === "blog") return <BlogIndexPage />;
  if (path === "about") return <AboutPage />;
  if (path === "privacy-policy") return <PrivacyPolicyPage />;
  if (path === "disclaimer") return <DisclaimerPage />;
  if (path === "contact") return <ContactPage />;
  if (path === "monthly-saving-rate") return <ArticlePage slug="monthly-saving-rate" />;
  if (path.startsWith("blog/")) {
    const blogSlug = path.replace(/^blog\//, "");
    const blogMatch = articles.find((article) => article.slug === blogSlug);
    if (blogMatch) return <ArticlePage slug={blogSlug} />;
  }
  const match = articles.find((article) => article.slug === path);
  if (match) return <ArticlePage slug={path} />;
  return <ArticlePage slug="monthly-saving-rate" />;
}
