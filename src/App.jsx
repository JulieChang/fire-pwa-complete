import React, { useMemo, useState } from "react";
import GrowthAgent from "./GrowthAgent";
import { articles } from "./articles";
import "./App.css";

const isDev = window.location.search.includes("dev");
const STORAGE_KEY = "finopsPlannerInputsV2";

const defaultInputs = {
  age: 40,
  householdType: "single",
  householdMembers: 1,
  dependents: 0,
  incomeStability: "stable",
  monthlyIncome: 100000,
  annualBonus: 0,
  otherAnnualIncome: 0,
  mortgage: 27154,
  mortgageRemainingMonths: 294,
  personalLoan: 33025,
  personalLoanRemainingMonths: 12,
  insurance: 24587,
  livingExpense: 35000,
  utilities: 3000,
  transportation: 4000,
  familySupport: 0,
  otherFixedExpense: 2500,
  currentCash: 300000,
  cashGoal: 300000,
  currentInvestmentAsset: 3000000,
  homeValue: 0,
  mortgageBalance: 6180009,
  personalLoanBalance: 484720,
  otherDebt: 0,
  annualTravelBudget: 70000,
  currentTravelFund: 0,
  minInvestment: 15000,
  maxInvestment: 30000,
  annualReturnRate: 7,
  retirementMonthlyCashflow: 60000,
  retirementAge: 50,
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
    { tier: "A0", name: "現金流警戒", threshold: -Infinity, nextThreshold: 0, nextTier: "A1", description: "可投資淨資產為負，優先處理負債、現金缺口與固定支出壓力。" },
    { tier: "A1", name: "生存穩定", threshold: 0, nextThreshold: 300000, nextTier: "A2", description: "已有初步存款，但抗風險能力仍偏弱，應先建立緊急預備金。" },
    { tier: "A2", name: "安全水位", threshold: 300000, nextThreshold: 1000000, nextTier: "A3", description: "具備基本現金安全水位，可以開始穩定累積投資資產。" },
    { tier: "A3", name: "積累起點", threshold: 1000000, nextThreshold: 3000000, nextTier: "A4", description: "進入資產累積期，重點是維持儲蓄率、投資紀律與支出控管。" },
    { tier: "A4", name: "穩健中產", threshold: 3000000, nextThreshold: 8000000, nextTier: "A5", description: "資產與現金流已有基礎，應開始優化配置效率與長期目標。" },
    { tier: "A5", name: "高資產上班族", threshold: 8000000, nextThreshold: 15000000, nextTier: "A6", description: "接近半財務自由，工作選擇權提高，需重視風險分散與稅務效率。" },
    { tier: "A6", name: "準財務自由", threshold: 15000000, nextThreshold: 30000000, nextTier: "A7", description: "已具備支撐較低支出型退休生活的資產基礎，需建立提款與現金流策略。" },
    { tier: "A7", name: "財務自由", threshold: 30000000, nextThreshold: null, nextTier: null, description: "具備高度生活選擇權，重點轉為資產保護、現金流穩定與人生配置。" },
  ];
  return [...tiers].reverse().find((item) => investableNetWorth >= item.threshold) || tiers[0];
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
        <a href="/cash-runway">現金水位</a>
        <a href="/same-age-savings">同齡比較</a>
        <a href="/wealth-tier">財務階層</a>
        <a href="/articles">文章</a>
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
        <a href="/cash-runway">現金安全水位</a>
        <a href="/travel-budget">旅遊基金</a>
        <a href="/investment-allocation">投資分配</a>
        <a href="/financial-freedom">財務自由</a>
        <a href="/same-age-savings">同齡存款比較</a>
        <a href="/wealth-tier">財務階層</a>
        <a href="/fixed-expense-ratio">固定支出比</a>
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

function NumberInput({ label, value, onChange, suffix = "NTD", hint }) {
  return (
    <label className="input-card">
      <span>{label}</span>
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
          <a className="article-card" href={`/${article.slug}`} key={article.slug}>
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
  const shareText = `我的 Personal FinOps 診斷：財務階層 ${result.wealthTier.tier}｜${result.wealthTier.name}，現金安全月數 ${result.cashRunwayMonths.toFixed(1)} 個月，收入倍數 ${result.incomeMultiple.toFixed(1)} 倍，財務自由進度 ${result.financialFreedomProgress.toFixed(1)}%。一起試算：${pageUrl}`;
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
  const [inputs, setInputs] = useState(getInitialInputs);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (key, value) => {
    const next = { ...inputs, [key]: value };
    setInputs(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const result = useMemo(() => {
    const monthlyIncome = toNumber(inputs.monthlyIncome);
    const annualBonus = toNumber(inputs.annualBonus);
    const otherAnnualIncome = toNumber(inputs.otherAnnualIncome);
    const monthlyTotalIncome = monthlyIncome + annualBonus / 12 + otherAnnualIncome / 12;
    const annualIncome = monthlyIncome * 12 + annualBonus + otherAnnualIncome;
    const fixedExpense = toNumber(inputs.mortgage) + toNumber(inputs.personalLoan) + toNumber(inputs.insurance) + toNumber(inputs.livingExpense) + toNumber(inputs.utilities) + toNumber(inputs.transportation) + toNumber(inputs.familySupport) + toNumber(inputs.otherFixedExpense);
    const available = monthlyTotalIncome - fixedExpense;
    const currentCash = toNumber(inputs.currentCash);
    const currentInvestmentAsset = toNumber(inputs.currentInvestmentAsset);
    const investableNetWorth = currentCash + currentInvestmentAsset - toNumber(inputs.personalLoanBalance) - toNumber(inputs.otherDebt);
    const totalNetWorth = currentCash + currentInvestmentAsset + toNumber(inputs.homeValue) - toNumber(inputs.mortgageBalance) - toNumber(inputs.personalLoanBalance) - toNumber(inputs.otherDebt);
    const cashRunwayMonths = fixedExpense > 0 ? currentCash / fixedExpense : 0;
    let recommendedRunwayMonths = 6;
    if (toNumber(inputs.dependents) >= 1) recommendedRunwayMonths = 9;
    if (toNumber(inputs.dependents) >= 2) recommendedRunwayMonths = 12;
    if (inputs.incomeStability !== "stable") recommendedRunwayMonths += 3;
    const recommendedCashTarget = fixedExpense * recommendedRunwayMonths;
    const cashGap = recommendedCashTarget - currentCash;
    const savingRate = monthlyTotalIncome > 0 ? (available / monthlyTotalIncome) * 100 : 0;
    const fixedExpenseRatio = monthlyTotalIncome > 0 ? (fixedExpense / monthlyTotalIncome) * 100 : 0;
    const ageBenchmark = getAgeIncomeBenchmark(toNumber(inputs.age));
    const stableBenchmarkAsset = annualIncome * ageBenchmark.stable;
    const conservativeBenchmarkAsset = annualIncome * ageBenchmark.conservative;
    const aggressiveBenchmarkAsset = annualIncome * ageBenchmark.aggressive;
    const incomeMultiple = annualIncome > 0 ? investableNetWorth / annualIncome : 0;
    const gapToStableBenchmark = investableNetWorth - stableBenchmarkAsset;
    const wealthTier = getWealthTier(investableNetWorth);
    const gapToNextTier = wealthTier.nextThreshold ? Math.max(wealthTier.nextThreshold - investableNetWorth, 0) : 0;
    const annualTravelBudget = toNumber(inputs.annualTravelBudget);
    const currentTravelFund = toNumber(inputs.currentTravelFund);
    const travelProgress = annualTravelBudget > 0 ? (currentTravelFund / annualTravelBudget) * 100 : 100;
    const monthlyTravelSaving = Math.max((annualTravelBudget - currentTravelFund) / 12, 0);
    const minInvestment = toNumber(inputs.minInvestment);
    const maxInvestment = toNumber(inputs.maxInvestment);
    let suggestedCashTopUp = 0;
    let suggestedTravelTopUp = 0;
    let suggestedInvestment = 0;
    if (available > 0) {
      if (cashRunwayMonths < 3) {
        suggestedCashTopUp = Math.round(available * 0.75);
        suggestedInvestment = Math.min(minInvestment, Math.max(available - suggestedCashTopUp, 0));
      } else if (cashRunwayMonths < recommendedRunwayMonths) {
        suggestedCashTopUp = Math.round(available * 0.45);
        suggestedTravelTopUp = Math.min(monthlyTravelSaving, Math.max(available * 0.15, 0));
        suggestedInvestment = Math.min(maxInvestment, Math.max(available - suggestedCashTopUp - suggestedTravelTopUp, minInvestment));
      } else {
        suggestedTravelTopUp = Math.min(monthlyTravelSaving, Math.max(available * 0.15, 0));
        suggestedInvestment = Math.min(maxInvestment, Math.max(available - suggestedTravelTopUp, minInvestment));
        suggestedCashTopUp = Math.max(available - suggestedTravelTopUp - suggestedInvestment, 0);
      }
    }
    const investmentRate = monthlyTotalIncome > 0 ? (suggestedInvestment / monthlyTotalIncome) * 100 : 0;
    const financialFreedomTarget = toNumber(inputs.retirementMonthlyCashflow) * 12 * 25;
    const financialFreedomProgress = financialFreedomTarget > 0 ? (investableNetWorth / financialFreedomTarget) * 100 : 0;
    const financialFreedomGap = financialFreedomTarget - investableNetWorth;
    const monthsToRetirement = Math.max((toNumber(inputs.retirementAge) - toNumber(inputs.age)) * 12, 0);
    const monthlyRate = Math.pow(1 + toNumber(inputs.annualReturnRate) / 100, 1 / 12) - 1;
    const projectedInvestmentAtRetirement = monthsToRetirement === 0
      ? currentInvestmentAsset
      : currentInvestmentAsset * Math.pow(1 + monthlyRate, monthsToRetirement) + suggestedInvestment * ((Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / (monthlyRate || 1));
    const monthsToNextTier = suggestedInvestment > 0 && wealthTier.nextThreshold
      ? Math.ceil(Math.log((wealthTier.nextThreshold * monthlyRate + suggestedInvestment) / (Math.max(investableNetWorth, 0) * monthlyRate + suggestedInvestment)) / Math.log(1 + monthlyRate))
      : null;
    const score = clamp(
      25 * clamp(cashRunwayMonths / recommendedRunwayMonths, 0, 1) +
      20 * clamp(savingRate / 30, 0, 1) +
      20 * clamp(1 - Math.max(fixedExpenseRatio - 50, 0) / 50, 0, 1) +
      20 * clamp(incomeMultiple / ageBenchmark.stable, 0, 1) +
      15 * clamp(financialFreedomProgress / 50, 0, 1),
      0,
      100
    );
    return {
      monthlyTotalIncome, annualIncome, fixedExpense, available, currentCash, currentInvestmentAsset,
      investableNetWorth, totalNetWorth, cashRunwayMonths, recommendedRunwayMonths, recommendedCashTarget, cashGap,
      savingRate, fixedExpenseRatio, investmentRate, ageBenchmark, stableBenchmarkAsset, conservativeBenchmarkAsset,
      aggressiveBenchmarkAsset, incomeMultiple, gapToStableBenchmark, wealthTier, gapToNextTier, travelProgress,
      monthlyTravelSaving, suggestedCashTopUp, suggestedTravelTopUp, suggestedInvestment, financialFreedomTarget,
      financialFreedomProgress, financialFreedomGap, projectedInvestmentAtRetirement, monthsToNextTier, score,
    };
  }, [inputs]);

  const cashTone = result.cashRunwayMonths >= result.recommendedRunwayMonths ? "good" : result.cashRunwayMonths >= 3 ? "warning" : "danger";
  const expenseTone = result.fixedExpenseRatio <= 50 ? "good" : result.fixedExpenseRatio <= 65 ? "warning" : "danger";
  const benchmarkTone = result.gapToStableBenchmark >= 0 ? "good" : "warning";

  return (
    <PageShell>
      <section className="hero">
        <p className="eyebrow">Personal FinOps 財務診斷工具</p>
        <h1>現金流、同齡比較、財務階層與財務自由進度，一次看懂。</h1>
        <p>輸入收入、家庭責任、支出、資產與負債，快速產出你的財務健康分數、現金安全水位、A0–A7 財務階層、同齡收入倍數落差與下一步改善建議。</p>
        <div className="hero-actions">
          <a href="#calculator" className="primary-button">開始財務診斷</a>
          <a href="/same-age-savings" className="secondary-button">了解同齡比較</a>
        </div>
      </section>

      <section className="section intro-content">
        <h2>這不是投資明牌工具，而是個人財務作戰儀表板</h2>
        <p>很多人每個月都有收入，也有投資，但真正困難的是：不知道現金水位是否安全、旅遊預算會不會超支、每月到底該投資多少，以及距離理想生活還有多遠。Personal FinOps Planner 用企業 FinOps 的邏輯，把收入、固定支出、資產、負債與人生目標拆成可管理的資金桶，協助你建立長期可執行的財務秩序。</p>
        <p>診斷結果中的同齡比較採用「收入倍數法」作為估算基準，財務階層則以可投資淨資產分級。這些結果不是官方個人排名，也不是為了製造焦慮，而是協助你看懂自己目前的位置、風險與下一步。</p>
      </section>

      <section className="section" id="calculator">
        <div className="section-heading">
          <p className="eyebrow">Step 1</p>
          <h2>輸入基本資料與現金流</h2>
          <p>欄位已分成基本與進階。想快速試算可先填基本欄位；若要更準確的家庭責任與淨資產分析，再展開進階欄位。</p>
        </div>
        <div className="form-grid">
          <NumberInput label="年齡" value={inputs.age} onChange={(v) => update("age", v)} suffix="歲" />
          <SelectInput label="家庭型態" value={inputs.householdType} onChange={(v) => update("householdType", v)} options={householdOptions} />
          <NumberInput label="家庭總人數" value={inputs.householdMembers} onChange={(v) => update("householdMembers", v)} suffix="人" />
          <NumberInput label="需由你負擔的人數" value={inputs.dependents} onChange={(v) => update("dependents", v)} suffix="人" hint="重點是有幾人依賴你的收入。" />
          <NumberInput label="每月固定收入" value={inputs.monthlyIncome} onChange={(v) => update("monthlyIncome", v)} />
          <NumberInput label="年度獎金 / 業績獎金" value={inputs.annualBonus} onChange={(v) => update("annualBonus", v)} />
          <SelectInput label="收入穩定性" value={inputs.incomeStability} onChange={(v) => update("incomeStability", v)} options={incomeStabilityOptions} />
          <NumberInput label="其他年度收入" value={inputs.otherAnnualIncome} onChange={(v) => update("otherAnnualIncome", v)} />
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
          <NumberInput label="現金存款" value={inputs.currentCash} onChange={(v) => update("currentCash", v)} />
          <NumberInput label="現金目標" value={inputs.cashGoal} onChange={(v) => update("cashGoal", v)} />
          <NumberInput label="目前投資資產" value={inputs.currentInvestmentAsset} onChange={(v) => update("currentInvestmentAsset", v)} />
          <NumberInput label="年度旅遊預算" value={inputs.annualTravelBudget} onChange={(v) => update("annualTravelBudget", v)} />
          <NumberInput label="目前旅遊基金" value={inputs.currentTravelFund} onChange={(v) => update("currentTravelFund", v)} />
          <NumberInput label="每月最低投資" value={inputs.minInvestment} onChange={(v) => update("minInvestment", v)} />
        </div>
        <button className="toggle-button" onClick={() => setShowAdvanced(!showAdvanced)}>{showAdvanced ? "收合進階欄位" : "展開進階資產與退休欄位"}</button>
        {showAdvanced && (
          <div className="form-grid advanced-grid">
            <NumberInput label="每月最高投資" value={inputs.maxInvestment} onChange={(v) => update("maxInvestment", v)} />
            <NumberInput label="自住房市值（可選填）" value={inputs.homeValue} onChange={(v) => update("homeValue", v)} />
            <NumberInput label="房貸剩餘本金" value={inputs.mortgageBalance} onChange={(v) => update("mortgageBalance", v)} />
            <NumberInput label="信貸剩餘本金" value={inputs.personalLoanBalance} onChange={(v) => update("personalLoanBalance", v)} />
            <NumberInput label="其他負債" value={inputs.otherDebt} onChange={(v) => update("otherDebt", v)} />
            <NumberInput label="退休後目標月支出" value={inputs.retirementMonthlyCashflow} onChange={(v) => update("retirementMonthlyCashflow", v)} />
            <NumberInput label="目標退休年齡" value={inputs.retirementAge} onChange={(v) => update("retirementAge", v)} suffix="歲" />
            <NumberInput label="預期年化報酬率" value={inputs.annualReturnRate} onChange={(v) => update("annualReturnRate", v)} suffix="%" />
          </div>
        )}
      </section>

      <section className="dashboard section">
        <div className="section-heading">
          <p className="eyebrow">Step 2</p>
          <h2>你的個人 FinOps 診斷報告</h2>
          <p>以下結果依你輸入的數字與簡化假設估算，適合用來檢視方向，不代表投資建議或官方財富排名。</p>
        </div>
        <div className="score-card">
          <div>
            <p className="eyebrow">財務健康分數</p>
            <h2>{Math.round(result.score)} / 100</h2>
            <ProgressBar value={result.score} />
          </div>
          <div className="tier-badge">
            <span>{result.wealthTier.tier}</span>
            <strong>{result.wealthTier.name}</strong>
            <p>{result.wealthTier.description}</p>
          </div>
        </div>
        <div className="metrics-grid">
          <MetricCard title="可投資淨資產" value={formatNTD(result.investableNetWorth)} note="現金＋投資資產－信貸與其他負債，不含自住房。" />
          <MetricCard title="總淨資產" value={formatNTD(result.totalNetWorth)} note="含自住房市值與房貸剩餘本金，供整體參考。" />
          <MetricCard title="距離下一階層" value={result.wealthTier.nextTier ? formatNTD(result.gapToNextTier) : "已達 A7"} note={result.monthsToNextTier ? `依建議投資金額估算約 ${Math.max(result.monthsToNextTier, 0)} 個月。` : "重點轉向資產保護與現金流管理。"} />
          <MetricCard title="同齡收入倍數" value={`${result.incomeMultiple.toFixed(1)} 倍`} note={`${result.ageBenchmark.label} 穩健基準約 ${result.ageBenchmark.stable} 倍年收入。`} tone={benchmarkTone} />
          <MetricCard title="同齡穩健基準落差" value={formatNTD(result.gapToStableBenchmark)} note={result.gapToStableBenchmark >= 0 ? "目前高於穩健基準。" : "目前低於穩健基準，建議提高儲蓄與投資紀律。"} tone={benchmarkTone} />
          <MetricCard title="現金安全月數" value={`${result.cashRunwayMonths.toFixed(1)} 個月`} note={`依家庭責任與收入穩定性，建議 ${result.recommendedRunwayMonths} 個月。`} tone={cashTone} />
          <MetricCard title="固定支出比" value={formatPercent(result.fixedExpenseRatio)} note="超過 60% 代表現金流壓力偏高。" tone={expenseTone} />
          <MetricCard title="每月可分配金額" value={formatNTD(result.available)} note="月收入＋獎金月平均－固定支出。" tone={result.available >= 0 ? "good" : "danger"} />
          <MetricCard title="財務自由進度" value={formatPercent(result.financialFreedomProgress)} note={`目標資產：${formatNTD(result.financialFreedomTarget)}`} />
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
          <MetricCard title="退休時預估投資資產" value={formatNTD(result.projectedInvestmentAtRetirement)} note={`距離財務自由目標仍差：${formatNTD(result.financialFreedomGap)}`} />
        </div>
        <div className="advice-box">
          <h3>下一步建議</h3>
          <ul>
            <li>先確認現金水位是否達到 {result.recommendedRunwayMonths} 個月；若不足，優先補現金。</li>
            <li>固定支出比若超過 60%，避免再增加長期貸款或高額固定承諾。</li>
            <li>投資金額建議採上下限制度，避免市場情緒影響現金流安全。</li>
            <li>每半年重新試算一次，追蹤財務階層與同齡收入倍數是否持續改善。</li>
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
          <a className="article-card" href={`/${article.slug}`} key={article.slug}>
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
      <p>本網站可能包含連往第三方網站的連結。第三方網站的資料處理方式依其政策為準。本政策可能因服務調整或法規變更而更新。最後更新日期：2026 年 5 月 14 日。</p>
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
  const match = articles.find((article) => article.slug === path);
  if (match) return <ArticlePage slug={path} />;
  return <ArticlePage slug="monthly-saving-rate" />;
}
