import React, { useMemo, useState } from "react";
import { articles } from "./articles";

const STORAGE_KEY = "finopsPlannerInputs";

const defaultInputs = {
  monthlyIncome: 100000,
  annualBonus: 0,
  mortgage: 27154,
  mortgageRemainingMonths: 294,
  personalLoan: 33025,
  personalLoanRemainingMonths: 12,
  insurance: 24587,
  livingExpense: 35000,
  otherExpense: 5000,
  currentCash: 300000,
  cashGoal: 300000,
  annualTravelBudget: 70000,
  currentTravelFund: 0,
  currentInvestmentAsset: 3000000,
  minInvestment: 15000,
  maxInvestment: 30000,
  annualReturnRate: 7,
  retirementMonthlyCashflow: 60000,
  currentAge: 40,
  retirementAge: 50,
};

function getInitialInputs() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultInputs, ...JSON.parse(saved) } : defaultInputs;
  } catch {
    return defaultInputs;
  }
}

function formatNTD(value) {
  const number = Number(value) || 0;
  return `NT$ ${Math.round(number).toLocaleString("zh-TW")}`;
}

function formatPercent(value) {
  return `${Math.round(Number(value) || 0)}%`;
}

function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function getPath() {
  return window.location.pathname.replace(/\/$/, "") || "/";
}

function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="回到 Personal FinOps Planner 首頁">
        <img className="brand-logo" src="/logo.png" alt="Personal FinOps Planner logo" />
        <span>Personal FinOps Planner</span>
      </a>
      <nav className="site-nav" aria-label="主要導覽">
        <a href="/">首頁</a>
        <a href="/monthly-saving-rate">存錢比例</a>
        <a href="/blog">文章</a>
        <a href="/about">關於</a>
        <a href="/contact">聯絡</a>
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Personal FinOps Planner</strong>
        <p>免費個人財務管理工具，協助你用現金流、投資、旅遊基金與財務自由目標建立自己的資金分配系統。</p>
      </div>
      <nav aria-label="頁尾導覽">
        <a href="/">首頁</a>
        <a href="/monthly-saving-rate">每月存錢比例</a>
        <a href="/blog">文章專區</a>
        <a href="/about">About</a>
        <a href="/privacy-policy">Privacy Policy</a>
        <a href="/disclaimer">Disclaimer</a>
        <a href="/contact">Contact</a>
        <a href="/sitemap.xml">Sitemap</a>
      </nav>
    </footer>
  );
}

function PageShell({ children, narrow = false }) {
  return (
    <>
      <SiteHeader />
      <main className={narrow ? "page narrow" : "page"}>{children}</main>
      <SiteFooter />
    </>
  );
}

function HomeButton() {
  return <a className="secondary-link" href="/">← 回到首頁免費試算</a>;
}

function InputCard({ label, value, onChange, suffix = "NTD" }) {
  return (
    <label className="input-card">
      <span>{label}</span>
      <div className="input-wrap">
        <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <em>{suffix}</em>
      </div>
    </label>
  );
}

function ProgressBar({ value }) {
  const percent = clamp(value);
  return (
    <div className="progress" aria-label={`進度 ${Math.round(percent)}%`}>
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}

function MetricCard({ title, value, note }) {
  return (
    <article className="metric-card">
      <p>{title}</p>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

function AllocationCard({ title, amount, note }) {
  return (
    <article className="allocation-card">
      <p>{title}</p>
      <strong>{formatNTD(amount)}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

function SharePanel({ result }) {
  const pageUrl = window.location.href;
  const shareText = `我的 Personal FinOps 計算結果：\n每月可分配金額：${formatNTD(result.available)}\n現金安全月數：${result.cashRunwayMonths.toFixed(1)} 個月\n財務自由目前進度：${formatPercent(result.currentFinancialFreedomProgress)}\n退休時財務自由達成率：${formatPercent(result.retirementFinancialFreedomAchievement)}\n退休時預估投資資產：${formatNTD(result.projectedInvestmentAtRetirement)}\n退休時預估缺口：${formatNTD(result.retirementFinancialFreedomGap)}\n本月建議投資：${formatNTD(result.suggestedInvestment)}\n\n免費試算：${pageUrl}`;
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

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Personal FinOps 計算結果", text: shareText, url: pageUrl });
      } catch {
        return;
      }
    } else {
      copyText();
    }
  };

  return (
    <section className="section share-section">
      <h2>分享我的計算結果</h2>
      <p>可將目前的現金水位、投資配置、每月存錢比例與財務自由缺口分享出去，也可以列印或另存成 PDF。</p>
      <div className="share-buttons">
        <button onClick={nativeShare}>手機分享</button>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer">Facebook</a>
        <a href={`https://www.threads.net/intent/post?text=${encodedText}`} target="_blank" rel="noreferrer">Threads</a>
        <a href={`https://twitter.com/intent/tweet?text=${encodedText}`} target="_blank" rel="noreferrer">X</a>
        <a href={`https://social-plugins.line.me/lineit/share?url=${encodedUrl}`} target="_blank" rel="noreferrer">LINE</a>
        <button onClick={copyText}>複製</button>
        <button onClick={() => window.print()}>存成 PDF</button>
      </div>
    </section>
  );
}

function calculateResults(inputs) {
  const monthlyBonus = inputs.annualBonus / 12;
  const monthlyIncomeWithBonus = inputs.monthlyIncome + monthlyBonus;
  const monthlyDebtAndExpense = inputs.mortgage + inputs.personalLoan + inputs.insurance + inputs.livingExpense + inputs.otherExpense;
  const essentialExpense = inputs.mortgage + inputs.personalLoan + inputs.insurance + inputs.livingExpense;
  const available = monthlyIncomeWithBonus - monthlyDebtAndExpense;
  const availablePositive = Math.max(available, 0);
  const cashRunwayMonths = essentialExpense > 0 ? inputs.currentCash / essentialExpense : 0;
  const sixMonthCashTarget = essentialExpense * 6;
  const cashGapToSixMonths = Math.max(sixMonthCashTarget - inputs.currentCash, 0);
  const cashGapToCustomGoal = Math.max(inputs.cashGoal - inputs.currentCash, 0);
  const cashTargetGap = Math.max(cashGapToCustomGoal, cashGapToSixMonths);
  const monthlyTravelTarget = inputs.annualTravelBudget / 12;
  const travelGap = Math.max(inputs.annualTravelBudget - inputs.currentTravelFund, 0);
  const travelProgress = inputs.annualTravelBudget > 0 ? (inputs.currentTravelFund / inputs.annualTravelBudget) * 100 : 100;
  const financialFreedomTarget = inputs.retirementMonthlyCashflow * 12 * 25;
  const currentFinancialFreedomGap = Math.max(financialFreedomTarget - inputs.currentInvestmentAsset, 0);
  const currentFinancialFreedomProgress = financialFreedomTarget > 0 ? (inputs.currentInvestmentAsset / financialFreedomTarget) * 100 : 0;
  const yearsToRetire = Math.max(inputs.retirementAge - inputs.currentAge, 0);
  const monthsToRetire = yearsToRetire * 12;
  const monthlyRate = inputs.annualReturnRate / 100 / 12;

  let suggestedCashTopUp = 0;
  let suggestedTravelTopUp = 0;
  let suggestedInvestment = 0;
  let allocationReason = "";

  if (availablePositive <= 0) {
    allocationReason = "本月可分配金額為零或負數，建議先檢查固定支出、信用卡帳單與短期現金流壓力。";
  } else if (cashRunwayMonths < 3) {
    suggestedInvestment = Math.min(inputs.minInvestment, availablePositive);
    suggestedCashTopUp = Math.min(cashTargetGap, Math.max(availablePositive - suggestedInvestment, 0));
    suggestedTravelTopUp = 0;
    allocationReason = "現金安全水位低於 3 個月，系統優先補現金；旅遊基金暫緩，投資以最低定期定額為主。";
  } else {
    const temporaryProjected = projectFutureValue(inputs.currentInvestmentAsset, inputs.minInvestment, monthlyRate, monthsToRetire);
    const temporaryRetirementAchievement = financialFreedomTarget > 0 ? (temporaryProjected / financialFreedomTarget) * 100 : 0;
    const targetInvestmentRatio = temporaryRetirementAchievement < 70 ? 0.6 : temporaryRetirementAchievement < 100 ? 0.5 : 0.35;
    suggestedCashTopUp = cashRunwayMonths < 6 ? Math.min(cashTargetGap, availablePositive * 0.25) : Math.min(cashTargetGap, availablePositive * 0.1);
    suggestedTravelTopUp = travelProgress < 100 ? Math.min(travelGap, monthlyTravelTarget, Math.max(availablePositive - suggestedCashTopUp, 0) * 0.25) : 0;
    suggestedInvestment = Math.min(inputs.maxInvestment, Math.max(inputs.minInvestment, availablePositive * targetInvestmentRatio));
    const total = suggestedCashTopUp + suggestedTravelTopUp + suggestedInvestment;
    if (total > availablePositive) {
      const scale = availablePositive / total;
      suggestedCashTopUp *= scale;
      suggestedTravelTopUp *= scale;
      suggestedInvestment *= scale;
    }
    allocationReason = temporaryRetirementAchievement < 100
      ? "現金水位已達基本安全線，但退休時財務自由達成率仍不足，系統提高投資比重，同時保留旅遊基金與現金補位。"
      : "退休推估已接近或高於目標，系統採平衡分配，兼顧投資、現金與年度旅遊基金。";
  }

  const projectedInvestmentAtRetirement = projectFutureValue(inputs.currentInvestmentAsset, suggestedInvestment, monthlyRate, monthsToRetire);
  const retirementFinancialFreedomGap = Math.max(financialFreedomTarget - projectedInvestmentAtRetirement, 0);
  const retirementFinancialFreedomAchievement = financialFreedomTarget > 0 ? (projectedInvestmentAtRetirement / financialFreedomTarget) * 100 : 0;
  const debtPressure = inputs.monthlyIncome > 0 ? ((inputs.mortgage + inputs.personalLoan) / inputs.monthlyIncome) * 100 : 0;
  const remainingMortgageTotal = inputs.mortgage * inputs.mortgageRemainingMonths;
  const remainingPersonalLoanTotal = inputs.personalLoan * inputs.personalLoanRemainingMonths;

  return {
    monthlyBonus,
    monthlyIncomeWithBonus,
    monthlyDebtAndExpense,
    essentialExpense,
    available,
    cashRunwayMonths,
    sixMonthCashTarget,
    cashGapToSixMonths,
    cashGapToCustomGoal,
    suggestedMonthlyCashTopUp: suggestedCashTopUp,
    monthlyTravelTarget,
    suggestedTravelTopUp,
    suggestedInvestment,
    financialFreedomTarget,
    currentFinancialFreedomGap,
    currentFinancialFreedomProgress,
    projectedInvestmentAtRetirement,
    retirementFinancialFreedomGap,
    retirementFinancialFreedomAchievement,
    travelProgress,
    debtPressure,
    remainingMortgageTotal,
    remainingPersonalLoanTotal,
    yearsToRetire,
    allocationReason,
  };
}

function projectFutureValue(currentAsset, monthlyContribution, monthlyRate, months) {
  if (months <= 0) return currentAsset;
  if (!monthlyRate) return currentAsset + monthlyContribution * months;
  return currentAsset * Math.pow(1 + monthlyRate, months) + monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

function HomePage() {
  const [inputs, setInputs] = useState(getInitialInputs);
  const updateInput = (key, value) => {
    const next = { ...inputs, [key]: value };
    setInputs(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage may be unavailable in private browsing mode.
    }
  };

  const result = useMemo(() => calculateResults(inputs), [inputs]);

  return (
    <PageShell>
      <section className="hero">
        <div>
          <p className="eyebrow">Personal FinOps｜個人財務管理系統</p>
          <h1>用企業 FinOps 思維，管理你的現金流、投資與財務自由目標</h1>
          <p className="subtitle">
            Personal FinOps Planner 是為台灣上班族設計的免費財務試算工具。它不是單純記帳，而是把收入、房貸、信貸、保險、生活費、現金安全水位、旅遊基金、ETF 定期定額與退休目標放在同一個儀表板中檢視。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#calculator">開始免費試算</a>
            <a className="secondary-button" href="/blog">閱讀理財文章</a>
          </div>
        </div>
        <aside className="hero-badge">
          <span>本月可分配金額</span>
          <strong className={result.available >= 0 ? "positive" : "negative"}>{formatNTD(result.available)}</strong>
          <small>收入扣除固定支出後，可用於補現金、旅遊基金與投資的資金。</small>
        </aside>
      </section>

      <section className="section content-section">
        <h2>為什麼這個工具不是一般記帳 App？</h2>
        <p>傳統記帳多半是在月底回頭看錢花到哪裡，但真正困難的是：下個月薪水進來後，應該先補現金、先還債、繼續投資，還是把錢放進旅遊基金？Personal FinOps Planner 用現金安全水位、退休時財務自由達成率、年度旅遊基金進度與投資上下限，產生一套可執行的本月資金分配建議。</p>
        <p>本站的重點不是要求使用者盲目降低生活品質，而是把錢放到該去的位置。當現金安全月數不足時，系統會優先補現金；當現金水位足夠但退休時達成率不足時，系統會提高投資比重；當退休進度與現金水位都合理時，才會把更多資金分配給旅遊基金與生活彈性。</p>
      </section>

      <section className="dashboard" aria-label="財務健康摘要">
        <MetricCard title="現金安全月數" value={`${result.cashRunwayMonths.toFixed(1)} 個月`} note={`6 個月目標：${formatNTD(result.sixMonthCashTarget)}`} />
        <MetricCard title="財務自由目前進度" value={formatPercent(result.currentFinancialFreedomProgress)} note={`目前缺口：${formatNTD(result.currentFinancialFreedomGap)}`} />
        <MetricCard title="退休時財務自由達成率" value={formatPercent(result.retirementFinancialFreedomAchievement)} note={`退休時預估缺口：${formatNTD(result.retirementFinancialFreedomGap)}`} />
        <MetricCard title="債務月收入比" value={formatPercent(result.debtPressure)} note={`房貸剩餘：${formatNTD(result.remainingMortgageTotal)}；信貸剩餘：${formatNTD(result.remainingPersonalLoanTotal)}`} />
      </section>

      <section id="calculator" className="calculator-grid">
        <div className="section form-section">
          <h2>輸入你的每月現金流與目標</h2>
          <p>所有輸入資料只會保存在你的瀏覽器 localStorage，用於下次開啟時保留試算內容。本工具不要求輸入身分證、銀行帳號或信用卡資訊。</p>
          <div className="form-grid">
            <InputCard label="每月收入" value={inputs.monthlyIncome} onChange={(value) => updateInput("monthlyIncome", value)} />
            <InputCard label="年度獎金" value={inputs.annualBonus} onChange={(value) => updateInput("annualBonus", value)} />
            <InputCard label="房貸月付" value={inputs.mortgage} onChange={(value) => updateInput("mortgage", value)} />
            <InputCard label="房貸剩餘期數" value={inputs.mortgageRemainingMonths} onChange={(value) => updateInput("mortgageRemainingMonths", value)} suffix="期" />
            <InputCard label="信貸月付" value={inputs.personalLoan} onChange={(value) => updateInput("personalLoan", value)} />
            <InputCard label="信貸剩餘期數" value={inputs.personalLoanRemainingMonths} onChange={(value) => updateInput("personalLoanRemainingMonths", value)} suffix="期" />
            <InputCard label="保險月繳" value={inputs.insurance} onChange={(value) => updateInput("insurance", value)} />
            <InputCard label="生活費" value={inputs.livingExpense} onChange={(value) => updateInput("livingExpense", value)} />
            <InputCard label="其他固定支出" value={inputs.otherExpense} onChange={(value) => updateInput("otherExpense", value)} />
            <InputCard label="目前現金" value={inputs.currentCash} onChange={(value) => updateInput("currentCash", value)} />
            <InputCard label="自訂現金目標" value={inputs.cashGoal} onChange={(value) => updateInput("cashGoal", value)} />
            <InputCard label="年度旅遊預算" value={inputs.annualTravelBudget} onChange={(value) => updateInput("annualTravelBudget", value)} />
            <InputCard label="目前旅遊基金" value={inputs.currentTravelFund} onChange={(value) => updateInput("currentTravelFund", value)} />
            <InputCard label="目前投資資產" value={inputs.currentInvestmentAsset} onChange={(value) => updateInput("currentInvestmentAsset", value)} />
            <InputCard label="每月最低投資" value={inputs.minInvestment} onChange={(value) => updateInput("minInvestment", value)} />
            <InputCard label="每月最高投資" value={inputs.maxInvestment} onChange={(value) => updateInput("maxInvestment", value)} />
            <InputCard label="預估年化報酬率" value={inputs.annualReturnRate} onChange={(value) => updateInput("annualReturnRate", value)} suffix="%" />
            <InputCard label="退休後每月現金流目標" value={inputs.retirementMonthlyCashflow} onChange={(value) => updateInput("retirementMonthlyCashflow", value)} />
            <InputCard label="目前年齡" value={inputs.currentAge} onChange={(value) => updateInput("currentAge", value)} suffix="歲" />
            <InputCard label="目標退休年齡" value={inputs.retirementAge} onChange={(value) => updateInput("retirementAge", value)} suffix="歲" />
          </div>
        </div>

        <aside className="section result-section">
          <h2>本月資金分配建議</h2>
          <AllocationCard title="建議補現金" amount={result.suggestedMonthlyCashTopUp} note={`距離 6 個月現金目標：${formatNTD(result.cashGapToSixMonths)}`} />
          <AllocationCard title="建議補旅遊基金" amount={result.suggestedTravelTopUp} note={`年度旅遊基金進度：${formatPercent(result.travelProgress)}`} />
          <AllocationCard title="建議股票 / ETF 投資" amount={result.suggestedInvestment} note="依現金水位、退休達成率與投資上下限估算" />
          <div className="progress-block">
            <div className="row-between"><span>財務自由目前進度</span><strong>{formatPercent(clamp(result.currentFinancialFreedomProgress))}</strong></div>
            <ProgressBar value={result.currentFinancialFreedomProgress} />
            <p>目標資產：{formatNTD(result.financialFreedomTarget)}</p>
          </div>
          <div className="progress-block">
            <div className="row-between"><span>退休時財務自由達成率</span><strong>{formatPercent(clamp(result.retirementFinancialFreedomAchievement))}</strong></div>
            <ProgressBar value={result.retirementFinancialFreedomAchievement} />
            <p>退休時預估投資資產：{formatNTD(result.projectedInvestmentAtRetirement)}</p>
            <p>退休時預估缺口：{formatNTD(result.retirementFinancialFreedomGap)}</p>
          </div>
          <p className="note-box">{result.allocationReason}</p>
        </aside>
      </section>

      <section className="section content-section">
        <h2>計算邏輯與公式說明</h2>
        <p>本工具的資金分配邏輯不是單純用收入乘以固定比例，而是依序檢查現金安全水位、退休時財務自由達成率、旅遊基金進度與投資上下限。每月可分配金額 = 每月收入 + 年度獎金 / 12 - 房貸 - 信貸 - 保險 - 生活費 - 其他固定支出。</p>
        <p>財務自由目標資產 = 退休後每月現金流目標 × 12 × 25。財務自由目前進度使用目前投資資產除以目標資產；退休時財務自由達成率則會把目前投資資產、每月建議投資金額、預估年化報酬率與距離退休年數納入複利推估。</p>
        <p>本工具僅供教育與試算參考，不構成投資建議、保險建議、貸款建議或稅務建議。實際結果會受到市場波動、通膨、收入變化、家庭責任與個人風險承受度影響。</p>
      </section>

      <section className="section content-section">
        <h2>Personal FinOps 四層架構</h2>
        <div className="method-grid">
          <article><h3>1. 必要支出底盤</h3><p>先掌握房貸、信貸、保險、生活費與固定支出，確認每月真正可分配金額。</p></article>
          <article><h3>2. 現金安全水位</h3><p>用現金安全月數檢查抗風險能力，避免因突發事件被迫賣出長期投資。</p></article>
          <article><h3>3. 年度目標基金</h3><p>把旅遊、進修、稅金與大型支出拆成每月預算，降低信用卡帳單壓力。</p></article>
          <article><h3>4. 長期投資與自由</h3><p>在安全水位穩定後，逐步提高投資配置，追蹤財務自由目標達成率。</p></article>
        </div>
      </section>

      <ArticleCards />
      <SharePanel result={result} />
    </PageShell>
  );
}

function ArticleCards() {
  return (
    <section className="section articles-section">
      <div className="section-heading">
        <h2>個人財務管理文章</h2>
        <a href="/blog">查看全部文章 →</a>
      </div>
      <div className="article-grid">
        {articles.slice(0, 6).map((article) => (
          <article className="article-card" key={article.slug}>
            <span>{article.category}</span>
            <h3>{article.title}</h3>
            <p>{article.description}</p>
            <a href={`/blog/${article.slug}`}>閱讀文章</a>
          </article>
        ))}
      </div>
    </section>
  );
}

function BlogIndexPage() {
  return (
    <PageShell>
      <section className="section page-hero">
        <p className="eyebrow">Personal FinOps Blog</p>
        <h1>個人財務管理文章專區</h1>
        <p>這裡整理現金流管理、每月存錢比例、投資配置、旅遊基金、負債管理、同齡比較與財務自由推估等主題。所有內容皆以台灣上班族常見情境為出發點，協助你建立可長期執行的財務決策系統。</p>
        <HomeButton />
      </section>
      <div className="article-grid wide">
        {articles.map((article) => (
          <article className="article-card" key={article.slug}>
            <span>{article.category}</span>
            <h2>{article.title}</h2>
            <p>{article.description}</p>
            <a href={`/blog/${article.slug}`}>閱讀文章 →</a>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

function ArticlePage({ slug }) {
  const article = articles.find((item) => item.slug === slug);
  if (!article) {
    return (
      <PageShell narrow>
        <h1>找不到文章</h1>
        <p>這篇文章可能已經移除，請回到文章列表查看其他個人財務管理內容。</p>
        <a href="/blog">回文章列表</a>
      </PageShell>
    );
  }

  return (
    <PageShell narrow>
      <article className="article-page">
        <p className="eyebrow">{article.category}</p>
        <h1>{article.title}</h1>
        <p className="article-meta">最後更新：{article.updatedAt}</p>
        <p className="lead">{article.description}</p>
        {article.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        {article.slug === "same-age-comparison" && (
          <div className="source-box">
            <strong>資料來源說明</strong>
            <p>資料來源：行政院主計總處國富統計，110 年家庭財富分配統計，113 年發布。114 年家庭財富分配統計預計於 117 年 4 月下旬發布。此資料主要以家庭為單位，本站僅作為同齡比較與財務健康檢查的參考，不代表官方個人排名。</p>
          </div>
        )}
        <div className="article-cta">
          <h2>用 Personal FinOps Planner 試算你的財務狀況</h2>
          <p>回到首頁輸入收入、固定支出、現金水位、投資金額與退休目標，建立專屬的個人財務儀表板。</p>
          <a className="primary-button" href="/">回首頁免費試算</a>
        </div>
      </article>
    </PageShell>
  );
}

function MonthlySavingRatePage() {
  const article = articles.find((item) => item.slug === "monthly-saving-rate");
  return (
    <PageShell narrow>
      <article className="article-page">
        <p className="eyebrow">每月存錢比例計算器</p>
        <h1>每月存錢比例怎麼算？上班族個人財務管理入門指南</h1>
        <p className="lead">每月存錢比例是個人財務管理中最重要的指標之一。比起單純記帳，更重要的是知道每個月收入進來後，應該分配多少給生活費、緊急預備金、投資、旅遊基金與長期財務自由目標。</p>
        <HomeButton />
        {article.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        <h2>本工具使用的分配邏輯</h2>
        <p>本工具會先計算每月可分配金額，再檢查現金安全月數。如果現金安全月數低於 3 個月，會優先補現金，旅遊基金暫緩，投資以最低定期定額為主。若現金水位已達標但退休時財務自由達成率不足，系統會提高投資比重。若退休推估已接近目標，則採取較平衡的現金、投資與旅遊基金配置。</p>
        <h2>每月存錢比例常見問題 FAQ</h2>
        <h3>每月存錢 20% 夠嗎？</h3>
        <p>對剛開始理財的人來說，每月存下收入的 20% 是很好的起點。若收入穩定且支出可控，可以逐步提高到 30% 或 40%。但如果現金水位不足，優先順序應該是補緊急預備金。</p>
        <h3>應該先存錢還是先投資？</h3>
        <p>建議先建立至少 3 個月、較理想為 6 個月的緊急預備金，再逐步提高投資比例。現金水位不足時，過度投資會增加財務壓力。</p>
        <h3>為什麼要把旅遊基金放進計算？</h3>
        <p>旅遊、進修與年度大型支出若沒有提前準備，容易破壞每月投資紀律。把年度目標拆成每月沉澱金額，可以讓生活品質與財務紀律共存。</p>
        <div className="article-cta">
          <h2>免費計算我的每月存錢比例</h2>
          <p>回到首頁輸入自己的收入、固定支出與投資目標，工具會自動估算本月資金分配建議。</p>
          <a className="primary-button" href="/">開始試算</a>
        </div>
      </article>
    </PageShell>
  );
}

function AboutPage() {
  return (
    <PageShell narrow>
      <h1>關於 Personal FinOps Planner</h1>
      <p className="lead">Personal FinOps Planner 是一個以企業 FinOps、TBM 與現金流管理概念為基礎所設計的個人財務管理工具，目標是協助使用者用更有系統的方式掌握收入、支出、現金水位、投資配置、旅遊基金與財務自由目標。</p>
      <p>建立這個網站的原因，是因為許多理財工具只處理單一問題：有些工具只記帳，有些工具只估退休金，有些工具只計算投資複利。但現實生活中的財務壓力通常是同時發生的。你可能一邊繳房貸，一邊有信貸，一邊定期定額 ETF，一邊想準備旅遊基金，也一邊擔心退休後現金流是否足夠。這些問題不能分開看，必須放進同一個資金分配架構。</p>
      <p>Personal FinOps Planner 的方法，是先從每月可分配金額開始。工具會將每月收入與年度獎金月平均加總，再扣除房貸、信貸、保險、生活費與其他固定支出，得到真正可用於規劃的資金。接著再檢查現金安全月數、旅遊基金達成率、投資上下限與財務自由目標，產生本月資金分配建議。</p>
      <p>這個網站特別重視台灣上班族的真實情境。例如房貸與信貸需要分別輸入剩餘期數，因為兩者對現金流的壓力不同；旅遊基金被視為年度預算，因為許多人不是日常生活費失控，而是大型支出沒有提前準備；財務自由目標則用退休後每月現金流回推，而不是套用單一標準。</p>
      <p>本站內容以教育與試算為主，不提供個別化投資建議，也不推薦特定股票、ETF、基金、保險或貸款商品。所有計算結果都依使用者自行輸入的資料與簡化假設產生，實際結果仍會受到收入變化、市場波動、利率、通膨、稅務、家庭責任與個人風險承受度影響。</p>
      <p>未來網站會持續補充個人 FinOps 方法論、現金流管理文章、同齡財務比較說明、旅遊基金規劃、投資分配邏輯與財務自由情境分析。希望這個工具能幫助使用者從「月底看剩多少錢」進一步走向「每月主動分配資金」，讓理財變成一套能長期執行的生活系統。</p>
      <HomeButton />
    </PageShell>
  );
}

function PrivacyPolicyPage() {
  return (
    <PageShell narrow>
      <h1>隱私權政策</h1>
      <p>歡迎使用 Personal FinOps Planner。本隱私權政策說明本網站如何處理使用者資料、Cookie、第三方服務與廣告相關資訊。使用本網站即表示你了解並同意本政策的內容。</p>
      <h2>一、我們收集的資訊</h2>
      <p>本網站主要提供財務試算與規劃工具。使用者在頁面中輸入的收入、支出、投資金額、旅遊預算、現金目標與退休目標等資料，主要用於即時計算與畫面呈現。本網站不會要求你提供身分證字號、銀行帳號、信用卡號、精確地址等高度敏感個人資料。</p>
      <h2>二、瀏覽器本機儲存</h2>
      <p>為了讓使用者下次開啟網站時可以保留前一次輸入的試算資料，本網站會將部分輸入資料儲存在使用者自己的瀏覽器 localStorage 中。這些資料主要保存在使用者裝置端，用於改善使用體驗，不作為個別化投資建議用途。</p>
      <h2>三、Cookie 與第三方服務</h2>
      <p>本網站可能使用 Cookie 或類似技術，以改善網站體驗、分析流量來源，或提供更合適的內容與廣告。第三方廣告供應商可能會根據使用者過去造訪本網站或其他網站的情況投放廣告。</p>
      <h2>四、Google AdSense 與第三方廣告</h2>
      <p>本網站可能申請或使用 Google AdSense 等第三方廣告服務。第三方廣告合作夥伴可能使用 Cookie、裝置識別碼或類似技術來提供廣告、衡量廣告成效或防止不當行為。使用者可透過瀏覽器設定管理 Cookie。</p>
      <h2>五、資料用途</h2>
      <ul><li>提供財務試算與網站功能</li><li>改善網站內容與使用者體驗</li><li>分析網站流量與使用情況</li><li>顯示第三方廣告或衡量廣告成效</li></ul>
      <h2>六、第三方連結</h2>
      <p>本網站可能包含連往第三方網站的連結。當使用者點擊這些連結並離開本網站後，第三方網站的資料處理方式將依其各自的隱私權政策為準，本網站不對第三方網站的內容或資料處理方式負責。</p>
      <h2>七、使用者權利</h2>
      <p>使用者可自行清除瀏覽器中的 Cookie、localStorage 或網站資料，以刪除本網站保存在裝置端的試算紀錄。本網站不會主動要求使用者提供身分證字號、銀行帳號、信用卡號或其他高度敏感個人資料。</p>
      <h2>八、聯絡我們</h2>
      <p>若你對本隱私權政策、資料使用方式或網站內容有任何疑問，可透過聯絡頁面與我們聯繫：<a href="/contact">https://finops-planner.vercel.app/contact</a></p>
      <h2>九、政策更新</h2>
      <p>本網站可能因應服務調整、法規變更或第三方服務政策更新而修改本隱私權政策。最新版本將公布於本頁面。</p>
      <p>最後更新日期：2026 年 5 月 14 日</p>
      <HomeButton />
    </PageShell>
  );
}

function DisclaimerPage() {
  return (
    <PageShell narrow>
      <h1>財務免責聲明</h1>
      <p>本網站提供之內容與計算工具僅供一般財務規劃、現金流管理與個人理財教育參考，不構成投資建議、理財建議、保險建議、稅務建議、法律建議或任何形式的專業顧問服務。</p>
      <p>Personal FinOps Planner 所產生的現金水位、每月分配建議、投資推估、退休現金流、財務自由目標與同齡比較，均依使用者自行輸入的資料、公開資料或簡化假設計算。實際結果可能受到收入變化、市場波動、利率變動、通膨、稅務、個人風險承受度、家庭責任與政策變化等因素影響。</p>
      <p>本網站不保證任何投資報酬，也不推薦特定股票、ETF、基金、保險、貸款、信用卡或其他金融商品。使用者應依自身財務狀況、風險承受能力與人生目標審慎評估，必要時應諮詢合格專業人士。</p>
      <p>使用本網站代表你了解並同意：所有財務決策均由使用者自行承擔責任，本網站與內容提供者不因使用者依據網站資訊做出的任何決策，承擔直接或間接損失責任。</p>
      <p>本站文章中若引用官方統計或外部資料，皆會盡可能標示資料來源與限制。統計資料可能因年度、樣本、定義與更新時間不同而有所差異，使用時應理解其適用範圍。</p>
      <HomeButton />
    </PageShell>
  );
}

function ContactPage() {
  return (
    <PageShell narrow>
      <h1>聯絡我們</h1>
      <p>如果你對 Personal FinOps Planner 有任何問題、建議、合作邀約，或發現網站內容需要修正，歡迎透過 Facebook 粉絲專頁與我們聯繫。</p>
      <h2>聯絡方式</h2>
      <p>Facebook 粉絲專頁：<a href="https://www.facebook.com/finopsplanner" target="_blank" rel="noreferrer">個人 FinOps 財務管理</a></p>
      <h2>適合聯絡的主題</h2>
      <ul><li>網站功能錯誤回報</li><li>個人財務管理工具使用建議</li><li>文章內容修正或資料來源建議</li><li>合作、引用或內容授權詢問</li></ul>
      <h2>重要提醒</h2>
      <p>本站不提供個別化投資建議，也不會針對特定股票、ETF、基金、保險或貸款商品給予買賣建議。如果你的問題涉及重大財務、法律、稅務或保險決策，建議諮詢合格專業人士。</p>
      <h2>回覆時間</h2>
      <p>我們會盡量在收到訊息後的合理時間內回覆，但實際回覆時間可能依訊息內容與工作量而有所不同。</p>
      <HomeButton />
    </PageShell>
  );
}

export default function App() {
  const path = getPath();
  if (path === "/monthly-saving-rate") return <MonthlySavingRatePage />;
  if (path === "/blog") return <BlogIndexPage />;
  if (path.startsWith("/blog/")) return <ArticlePage slug={path.replace("/blog/", "")} />;
  if (path === "/about") return <AboutPage />;
  if (path === "/privacy-policy") return <PrivacyPolicyPage />;
  if (path === "/disclaimer") return <DisclaimerPage />;
  if (path === "/contact") return <ContactPage />;
  return <HomePage />;
}
