import MoneyInput, { largeMoneyFields } from "./MoneyInput.jsx";
import React, { useEffect, useMemo, useState } from "react";
import GrowthAgent from "./GrowthAgent";
import { articles } from "./articles";
import "./App.css";
import { defaultInputs, calculatePlan, normalizeInputs, validateInputs, TAIWAN_OFFICIAL_SOURCE_NOTE } from "./finance.js";
import { SITE_URL } from "./seo.js";
import MethodologyContent from "./MethodologyContent.jsx";
import {DailyDashboard,PlanningWorkspace} from "./Workspace.jsx";

const isDev = typeof window !== "undefined" && window.location.search.includes("dev");
const STORAGE_KEY = "finopsPlannerInputsV3";

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
    return saved ? normalizeInputs(JSON.parse(saved)) : defaultInputs;
  } catch {
    return defaultInputs;
  }
};

function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="/">Personal FinOps Planner</a>
      <nav className="site-nav">
        <a href="/">今日 Dashboard</a>
        <a href="/planning">情境與 FIRE</a>
        <a href="/diagnosis">完整診斷</a>
        <a href="/blog/monthly-saving-rate">存錢比例</a>
        <a href="/blog/cash-runway">現金水位</a>
        <a href="/blog/same-age-savings">同齡比較</a>
        <a href="/blog/wealth-tier">財務階層</a>
        <a href="/blog">文章</a>
        <a href="/about">關於本站</a>
        <a href="/methodology">計算方法</a>
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
        <a href="/blog/monthly-saving-rate">每月存錢比例</a>
        <a href="/blog/cash-runway">現金安全水位</a>
        <a href="/blog/travel-budget">旅遊基金</a>
        <a href="/blog/investment-allocation">投資分配</a>
        <a href="/blog/financial-freedom">財務自由</a>
        <a href="/blog/same-age-savings">同齡存款比較</a>
        <a href="/blog/wealth-tier">財務階層</a>
        <a href="/blog/fixed-expense-ratio">固定支出比</a>
        <a href="/about">關於本站</a>
        <a href="/methodology">計算方法</a>
        <a href="/privacy-policy">隱私權政策</a>
        <a href="/disclaimer">免責聲明</a>
        <a href="/contact">聯絡我們</a>
      </div>
    </footer>
  );
}

function PageShell({ children, className = "app" }) {
  return <><a className="skip-link" href="#main-content">跳至主要內容</a><SiteHeader /><main id="main-content" className={className}>{children}</main><SiteFooter /></>;
}

function HomeButton() {
  return <a className="home-button" href="/diagnosis#calculator">← 回到完整財務診斷工具</a>;
}

function NumberInput({ moneyKey, label, value, onChange, suffix = "NTD", hint, tooltip, min = 0, max }) {
  if (suffix === "NTD") return <MoneyInput label={label} value={value} onChange={onChange} hint={hint} className="input-card" defaultUnit={largeMoneyFields.has(moneyKey) ? 10000 : 1} />;
  return (
    <label className="input-card">
      <span className="field-label">
        {label}
        {tooltip && (
          <button className="help-tip" type="button" aria-label={tooltip} title={tooltip}>?</button>
        )}
      </span>
      <div className="input-wrap">
        <input type="number" min={min} max={max} step="any" value={value} onChange={(e) => onChange(toNumber(e.target.value))} />
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
  const pageUrl = SITE_URL;
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
  const [inputs, setInputs] = useState(defaultInputs);
  const [calculatedInputs, setCalculatedInputs] = useState(defaultInputs);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [errors, setErrors] = useState([]);
  useEffect(() => {
    const saved = getInitialInputs();
    setInputs(saved);
    setCalculatedInputs(saved);
  }, []);


  const update = (key, value) => {
    const next = { ...inputs, [key]: value };
    setInputs(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const handleCalculate = () => {
    const issues = validateInputs(inputs);
    setErrors(issues);
    if (issues.length) return;
    setCalculatedInputs(normalizeInputs(inputs));
    try { window.localStorage.setItem("finopsCalculatedInputsV1", JSON.stringify(normalizeInputs(inputs))); } catch { /* browser storage may be unavailable */ }
    setHasCalculated(true);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); } catch { /* ignore */ }
    setTimeout(() => document.getElementById("diagnosis-report")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const resetToDefault = () => {
    setErrors([]);
    setInputs(defaultInputs);
    setCalculatedInputs(defaultInputs);
    setHasCalculated(false);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultInputs)); window.localStorage.setItem("finopsCalculatedInputsV1",JSON.stringify(defaultInputs)); } catch { /* ignore */ }
  };

  const result = useMemo(() => calculatePlan(calculatedInputs), [calculatedInputs]);

  const isDirty = JSON.stringify(inputs) !== JSON.stringify(calculatedInputs);

  const cashTone = result.cashGap <= 0 ? "good" : result.cashRunwayMonths >= 3 ? "warning" : "danger";
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
            現金安全水位、財務階層、台灣家庭財富分位、收入倍數檢查點與下一步改善建議。
          </p>

          <div className="hero-actions">
            <a href="#calculator" className="primary-button">開始財務診斷</a>
            <a href="/blog/same-age-savings" className="secondary-button">查看同齡比較</a>
          </div>

          <div className="hero-pills">
            <span>財務健康分數</span>
            <span>A-9 至 A12 財務階層</span>
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
        <p>診斷結果會區分「官方統計參考」與「退休規劃模型」。官方統計參考採台灣家庭財富分位口徑；收入倍數檢查點則是本站示意模型，不是官方個人排名。</p>
      </section>

      <section className="section" id="calculator">
        <div className="section-heading">
          <p className="eyebrow">Step 1</p>
          <h2>輸入資料，產出你的財務診斷報告</h2>
          <p>
            預設值為 30 歲單身上班族的常見試算情境。瀏覽器會自動保留你前一次輸入的資料；
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
              <NumberInput moneyKey="age" label="年齡" value={inputs.age} onChange={(v) => update("age", v)} suffix="歲" />
              <SelectInput label="家庭型態" value={inputs.householdType} onChange={(v) => update("householdType", v)} options={householdOptions} />
              <NumberInput moneyKey="householdMembers" label="家庭總人數" value={inputs.householdMembers} onChange={(v) => update("householdMembers", v)} suffix="人" />
              <NumberInput moneyKey="dependents" label="需由你負擔的家人人數" value={inputs.dependents} onChange={(v) => update("dependents", v)} suffix="人" hint="只負責自己請填 0；此欄不含本人。若主要負擔 1 位父母、伴侶或小孩就填 1。" />
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
              <NumberInput moneyKey="monthlyIncome" label="每月固定收入（實領）" hint="填入扣除薪資扣款後的實領金額；尚未入帳的獎金不算本月現金。" value={inputs.monthlyIncome} onChange={(v) => update("monthlyIncome", v)} />
              <NumberInput moneyKey="annualBonus" label="年度獎金 / 業績獎金" hint="只用於全年收入與收入倍數，不自動攤入本月分配。" value={inputs.annualBonus} onChange={(v) => update("annualBonus", v)} />
              <NumberInput moneyKey="otherAnnualIncome" label="其他年度收入" value={inputs.otherAnnualIncome} onChange={(v) => update("otherAnnualIncome", v)} />
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
              <NumberInput moneyKey="mortgage" label="房貸每月還款" value={inputs.mortgage} onChange={(v) => update("mortgage", v)} />
              <NumberInput moneyKey="mortgageRemainingMonths" label="房貸剩餘期數" value={inputs.mortgageRemainingMonths} onChange={(v) => update("mortgageRemainingMonths", v)} suffix="期" />
              <NumberInput moneyKey="personalLoan" label="信貸每月還款" value={inputs.personalLoan} onChange={(v) => update("personalLoan", v)} />
              <NumberInput moneyKey="personalLoanRemainingMonths" label="信貸剩餘期數" value={inputs.personalLoanRemainingMonths} onChange={(v) => update("personalLoanRemainingMonths", v)} suffix="期" />
              <NumberInput moneyKey="insurance" label="保險費" value={inputs.insurance} onChange={(v) => update("insurance", v)} />
              <NumberInput moneyKey="livingExpense" label="生活費" value={inputs.livingExpense} onChange={(v) => update("livingExpense", v)} />
              <NumberInput moneyKey="utilities" label="水電瓦斯網路" value={inputs.utilities} onChange={(v) => update("utilities", v)} />
              <NumberInput moneyKey="transportation" label="交通費" value={inputs.transportation} onChange={(v) => update("transportation", v)} />
              <NumberInput moneyKey="familySupport" label="孝親費 / 家庭支援" value={inputs.familySupport} onChange={(v) => update("familySupport", v)} />
              <NumberInput moneyKey="otherFixedExpense" label="其他固定支出" value={inputs.otherFixedExpense} onChange={(v) => update("otherFixedExpense", v)} />
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
              <NumberInput moneyKey="currentCash" label="現金存款" hint="填可作為緊急預備金的現金；已指定旅遊用途的基金請另外填寫，不重複計入。" value={inputs.currentCash} onChange={(v) => update("currentCash", v)} />
              <NumberInput moneyKey="cashGoal" label="現金目標" value={inputs.cashGoal} onChange={(v) => update("cashGoal", v)} hint="可填自己的目標；診斷也會依支出自動估算建議安全水位。" />
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
              <NumberInput moneyKey="currentInvestmentAsset" label="目前投資資產" value={inputs.currentInvestmentAsset} onChange={(v) => update("currentInvestmentAsset", v)} />
              <NumberInput moneyKey="minInvestment" label="每月最低投資" value={inputs.minInvestment} onChange={(v) => update("minInvestment", v)} />
              <NumberInput moneyKey="maxInvestment" label="每月最高投資" value={inputs.maxInvestment} onChange={(v) => update("maxInvestment", v)} />
              <NumberInput moneyKey="annualReturnRate" label="預期年化報酬率" min={-50} max={50} value={inputs.annualReturnRate} onChange={(v) => update("annualReturnRate", v)} suffix="%" />
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
              <NumberInput moneyKey="annualTravelBudget" label="年度旅遊預算" value={inputs.annualTravelBudget} onChange={(v) => update("annualTravelBudget", v)} />
              <NumberInput moneyKey="currentTravelFund" label="目前旅遊基金" value={inputs.currentTravelFund} onChange={(v) => update("currentTravelFund", v)} />
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
              <NumberInput moneyKey="retirementMonthlyCashflow" label="退休後目標月支出" value={inputs.retirementMonthlyCashflow} onChange={(v) => update("retirementMonthlyCashflow", v)} />
              <NumberInput moneyKey="retirementAge" label="目標退休年齡" value={inputs.retirementAge} onChange={(v) => update("retirementAge", v)} suffix="歲" />
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
                  未填本金時，「月繳 × 剩餘期數」包含未來利息，只是剩餘還款總額代理值，會低估淨資產。
                  若你想讓總淨資產更精準，可在這裡填入實際房貸與信貸剩餘本金。
                </p>
              </div>
            </div>
            <div className="form-grid compact advanced-grid">
              <NumberInput moneyKey="homeValue" label="自住房市值（可選填）" value={inputs.homeValue} onChange={(v) => update("homeValue", v)} />
              <NumberInput moneyKey="mortgageBalance" label="房貸剩餘本金（可選填）" value={inputs.mortgageBalance} onChange={(v) => update("mortgageBalance", v)} hint="不填則用房貸月繳 × 剩餘期數做簡化估算。" />
              <NumberInput moneyKey="personalLoanBalance" label="信貸剩餘本金（可選填）" value={inputs.personalLoanBalance} onChange={(v) => update("personalLoanBalance", v)} hint="不填則用信貸月繳 × 剩餘期數做簡化估算。" />
              <NumberInput moneyKey="otherDebt" label="其他負債" value={inputs.otherDebt} onChange={(v) => update("otherDebt", v)} />
            </div>
          </div>
        )}

        <div className="calculator-actions">
          {errors.length > 0 && <div role="alert" className="validation-errors">{errors.map(error => <p key={error}>{error}</p>)}</div>}
          <button className="calculate-button" onClick={handleCalculate}>計算我的財務診斷</button>
          <button className="reset-button" onClick={resetToDefault}>恢復 30 歲預設範例</button>
          <p>{isDirty ? "資料已修改但尚未重新計算；請按上方藍色按鈕更新診斷報告。" : hasCalculated ? "已依目前輸入資料更新下方診斷報告。" : "下方顯示目前載入的試算；修改欄位後請按計算更新報告。"}</p>
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
            本頁「診斷報告預覽」會保留財務健康總分、現金流安全、流動資產階層與官方家庭財富分位；同齡收入倍數比較則放在完整報告中，作為退休規劃模型參考，而非官方排名。
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
          <MetricCard title="現金安全月數" value={result.fixedExpense > 0 ? `${result.cashRunwayMonths.toFixed(1)} 個月` : "未能估算"} note={`${result.recommendedRunwayReason}。建議 ${result.recommendedRunwayMonths} 個月。`} tone={cashTone} />
          <MetricCard title="固定支出比" value={result.monthlyTotalIncome > 0 ? formatPercent(result.fixedExpenseRatio) : "無固定收入"} note="超過 60% 代表現金流壓力偏高。" tone={expenseTone} />
          <MetricCard title="每月可分配金額" value={formatNTD(result.available)} note="每月固定實領收入－固定支出，不含未入帳獎金。" tone={result.available >= 0 ? "good" : "danger"} />
          <MetricCard title="財務自由目前進度" value={formatPercent(result.financialFreedomProgress)} note={`目前投資資產 ÷ 目標資產 ${formatNTD(result.financialFreedomTarget)}`} />
          <MetricCard title="退休時財務自由達成率" value={formatPercent(result.projectedFinancialFreedomRate)} note={`退休時預估缺口：${formatNTD(Math.max(result.projectedFinancialFreedomGap, 0))}`} tone={result.projectedFinancialFreedomRate >= 100 ? "good" : result.projectedFinancialFreedomRate >= 80 ? "warning" : "danger"} />
        </div>

        <div className="benchmark-explanation">
          <h3>官方統計參考與收入倍數模型有什麼不同？</h3>
          <p>若只填個人資產，對照家庭統計只能作量級參考。未包含全戶成員資產與負債時，不能視為你或你家庭的真實排名；綜合分數是本站自訂指標。</p>
          <p>
            <strong>台灣家庭財富分位</strong>採用主計總處國富統計的家庭財富分配口徑，
            以你的總淨資產 {formatNTD(result.totalNetWorth)} 對照家庭淨資產十分位門檻。
            目前約落在 <strong>{result.taiwanHouseholdWealthPosition.label}</strong>，{result.taiwanHouseholdWealthPosition.percentile}。
            若要到下一個官方分位 {result.taiwanHouseholdWealthPosition.nextLabel || "最高區間以上"}，約還差 {result.taiwanHouseholdWealthPosition.nextThreshold ? formatNTD(result.gapToNextTaiwanWealthDecile) : "無需再追下一分位"}。
          </p>
          <p>
            <strong>收入倍數檢查點</strong>不是官方同齡資產排名，而是本站示意模型。計算方式為：
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
          <p>固定實領收入 {formatNTD(result.monthlyTotalIncome)} − 固定支出 {formatNTD(result.fixedExpense)} = 可分配 {formatNTD(result.available)}。獎金與其他年度收入待實際入帳後另行安排。</p>
          <p className="muted">全年收入攤月為 {formatNTD(result.annualAverageMonthlyIncome)}，只作全年規劃參考。{result.available > 0 ? "以下三個資金桶合計不超過本月可分配金額。" : `本月無新增分配資金，現金流缺口 ${formatNTD(Math.max(0,-result.available))}。`}</p>
        </div>
        <div className="allocation-grid">
          <MetricCard title="建議補現金" value={formatNTD(result.suggestedCashTopUp)} note={`建議現金目標：${formatNTD(result.recommendedCashTarget)}，待補足：${formatNTD(Math.max(result.cashGap, 0))}`} tone={cashTone} />
          <MetricCard title="建議旅遊基金" value={formatNTD(result.suggestedTravelTopUp)} note={`年度旅遊基金完成率：${formatPercent(result.travelProgress)}`} />
          <MetricCard title="建議投資金額" value={formatNTD(result.suggestedInvestment)} note={`投資率約 ${formatPercent(result.investmentRate)}，可依風險承受度調整。`} />
          <MetricCard title="退休時預估投資資產" value={formatNTD(result.projectedInvestmentAtRetirement)} note={`假設每月底投入相同金額；未含未來獎金投入、貸款到期釋出資金、通膨與稅費。`} />
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
      <p className="source-note"><a href="/methodology">查看計算方法、資料來源與使用限制</a></p>
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
      <p className="muted">內容提供：Personal FinOps Planner · 最後更新：{article.updatedAt}</p>
      <p className="source-note">文中案例均為假設情境。<a href="/methodology">查看本站計算口徑與限制</a></p>
      <HomeButton />
      <nav className="article-toc" aria-label="文章目錄"><strong>本文內容</strong><ol>{article.sections.map((section, index) => <li key={section.heading}><a href={`#section-${index + 1}`}>{section.heading}</a></li>)}</ol></nav>
      {article.sections.map((section, index) => (
        <section id={`section-${index + 1}`} key={section.heading} className="article-section">
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
      {article.sources?.length > 0 && <section className="article-section"><h2>參考資料與計算依據</h2><ul>{article.sources.map(source => <li key={source.url}><a href={source.url}>{source.title}</a></li>)}</ul></section>}
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
        <a href="/diagnosis#calculator" className="primary-button">免費開始財務診斷</a>
      </div>
    </PageShell>
  );
}

function AboutPage() {
  return (
    <PageShell className="app article-page">
      <h1>關於個人 FinOps 財務管理工具</h1>
      <p>Personal FinOps Planner 是獨立的個人財務教育與試算專案，以收入、支出與目標資金桶協助使用者看懂可執行的每月計畫。</p>
      <HomeButton />
      <p>個人 FinOps 財務管理工具是一個以企業 FinOps、TBM 與現金流管理概念為基礎所設計的個人理財輔助工具，目標是協助使用者更清楚地掌握每月收入、固定支出、生活費、投資配置、旅遊基金與財務自由進度之間的關係。</p>
      <p>許多人在管理個人財務時，常常只關注「這個月還剩多少錢」，卻忽略現金水位是否安全、投資比例是否合理、大型支出是否提前準備，以及固定支出是否已經超過收入可承受範圍。本工具希望用更直覺的方式，幫助使用者建立自己的財務儀表板。</p>
      <h2>內容與維護方式</h2>
      <p>本站以可重算的假設案例說明規劃方法，並使用 AI 協助整理內容與實作程式。官方資料會標註來源與年份；自訂分級、權重及試算假設會在<a href="/methodology">計算方法頁</a>說明。若發現錯誤，歡迎透過<a href="/contact">聯絡頁</a>提供可重現的範例。</p>
      <h2>適合的使用方式</h2>
      <p>先用預設數字理解計算，再填入自己的實領收入與支出，調整投資上限及現金目標比較結果。目前試算資料保存在使用者的瀏覽器，尚未提供帳號、跨裝置同步或付費訂閱。</p>
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
      <p>為了讓使用者下次開啟網站時可以保留前一次輸入的試算資料，本網站會將輸入內容儲存在使用者自己的瀏覽器 localStorage 中。試算由瀏覽器內的程式計算，這些欄位不會傳送到本站伺服器或 OpenAI。情境規劃另保存使用者確認的方案、版本與月底實績；可在規劃頁匯出 JSON 備份，匯入需再次確認。使用分享功能時，Threads 與 X 會收到文案中顯示的財務摘要；請確認內容後再分享。</p>
      <h2>三、Cookie 與第三方服務</h2>
      <p>本網站使用 Google Analytics 分析造訪頁面、流量來源與裝置等資訊，Google 可能透過 Cookie 與線上識別碼處理使用資料。本站不將試算欄位、診斷分數或財務金額作為 Analytics 事件傳送。網站主機亦可能處理提供服務所需的連線紀錄。</p>
      <p>本版本只提供 Google AdSense 網站所有權驗證資訊，尚未載入廣告腳本或展示廣告。若後續啟用廣告，Google 與其他第三方供應商可能依據使用者造訪本站或其他網站的紀錄，透過 Cookie 提供廣告；啟用前將更新此政策並完成適用的同意管理設定。</p>
      <p>你可以查閱 <a href="https://policies.google.com/technologies/partner-sites">Google 如何使用合作夥伴網站的資訊</a>、<a href="https://policies.google.com/technologies/ads">Google 廣告技術政策</a>，並透過 <a href="https://myadcenter.google.com/">My Ad Center</a>管理個人化廣告，或使用 <a href="https://tools.google.com/dlpage/gaoptout">Google Analytics 停用外掛</a>。</p>
      <h2>四、第三方連結與政策更新</h2>
      <p>本網站可能包含連往第三方網站的連結。第三方網站的資料處理方式依其政策為準。本政策可能因服務調整或法規變更而更新。</p>
      <h2>五、使用者權利</h2>
      <p>使用者可自行清除瀏覽器中的 Cookie、localStorage 或網站資料，以刪除本網站保存在裝置端的試算紀錄。本網站不會主動要求使用者提供身分證字號、銀行帳號、信用卡號或其他高度敏感個人資料。</p>
      <h2>六、聯絡我們</h2>
      <p>若你對本隱私權政策、資料使用方式或網站內容有任何疑問，可透過聯絡頁面與我們聯繫：<a href="/contact">https://finops-planner.vercel.app/contact</a>。最後更新日期：2026 年 9 月 9 日。</p>
    </PageShell>
  );
}

function DisclaimerPage() {
  return (
    <PageShell className="app article-page">
      <h1>財務免責聲明</h1>
      <p>退休金額採固定報酬情境，不是成功機率；25 倍年支出不代表保證可永續提領。<a href="/methodology">完整假設與限制</a>。</p>
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
      <h2>回報錯誤時可以提供什麼？</h2>
      <p>請附上頁面網址、預期結果與實際結果；可用假設數字重現問題，無需提供真實收入、銀行資料、密碼或帳號金鑰。</p>
      <h2>網站用途</h2>
      <p>本網站主要提供個人財務管理、現金流試算、投資分配、同齡資產比較與旅遊基金規劃相關工具。網站內容僅供一般資訊與個人規劃參考，不提供個別化投資建議。</p>
    </PageShell>
  );
}

export default function App({ pathname = typeof window === "undefined" ? "/" : window.location.pathname }) {
  const path = pathname.replace(/^\//, "").replace(/\/$/, "");
  if (path === "" || path === "index.html") return <PageShell><DailyDashboard /></PageShell>;
  if (path === "diagnosis") return <HomePage />;
  if (path === "planning") return <PageShell><PlanningWorkspace /></PageShell>;
  if (path === "articles" || path === "blog") return <BlogIndexPage />;
  if (path === "about") return <AboutPage />;
  if (path === "privacy-policy") return <PrivacyPolicyPage />;
  if (path === "disclaimer") return <DisclaimerPage />;
  if (path === "contact") return <ContactPage />;
  if (path === "methodology") return <PageShell className="app article-page"><MethodologyContent /></PageShell>;
  if (path === "monthly-saving-rate") return <ArticlePage slug="monthly-saving-rate" />;
  if (path.startsWith("blog/")) {
    const blogSlug = path.replace(/^blog\//, "");
    const blogMatch = articles.find((article) => article.slug === blogSlug);
    if (blogMatch) return <ArticlePage slug={blogSlug} />;
  }
  const match = articles.find((article) => article.slug === path);
  if (match) return <ArticlePage slug={path} />;
  return <PageShell className="app article-page"><h1>找不到這個頁面</h1><p>網址可能已變更。你可以回到財務診斷或文章列表。</p><HomeButton /><p><a href="/blog">瀏覽所有文章</a></p></PageShell>;
}
