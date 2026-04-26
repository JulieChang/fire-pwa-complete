import React, { useMemo, useState } from "react";
import GrowthAgent from "./GrowthAgent";
import "./App.css";

const isDev = window.location.search.includes("dev");

const formatNTD = (value) => {
  const number = Number(value) || 0;
  return `NT$ ${Math.round(number).toLocaleString("zh-TW")}`;
};

const clamp = (value, min = 0, max = 100) => {
  return Math.min(Math.max(value, min), max);
};

function InputCard({ label, value, onChange, suffix = "NTD" }) {
  return (
    <div className="input-card">
      <label>{label}</label>
      <div className="input-wrap">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span>{suffix}</span>
      </div>
    </div>
  );
}

function ProgressBar({ value }) {
  const percent = clamp(value);

  let statusClass = "danger";
  if (percent >= 80) statusClass = "good";
  else if (percent >= 50) statusClass = "warning";

  return (
    <div className="progress-bg">
      <div
        className={`progress-fill ${statusClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function MetricCard({ title, value, note }) {
  return (
    <div className="metric-card">
      <p>{title}</p>
      <h3>{value}</h3>
      {note && <span>{note}</span>}
    </div>
  );
}

function AllocationCard({ title, amount, note }) {
  return (
    <div className="allocation-card">
      <p>{title}</p>
      <h2>{formatNTD(amount)}</h2>
      {note && <span>{note}</span>}
    </div>
  );
}

function SharePanel({ result }) {
  const pageUrl = window.location.href;

  const shareText = `我的 Personal FinOps 計算結果：
每月可分配金額：${formatNTD(result.available)}
現金安全月數：${result.cashRunwayMonths.toFixed(1)} 個月
6 個月現金目標：${formatNTD(result.sixMonthCashTarget)}
距離安全水位還差：${formatNTD(result.cashGapToSixMonths)}
建議每月補現金：${formatNTD(result.suggestedMonthlyCashTopUp)}
財務自由目標資產：${formatNTD(result.financialFreedomTarget)}
目前還差：${formatNTD(result.financialFreedomGap)}

用這個免費個人財務管理工具，試算你的現金流管理、每月存錢比例、投資配置與財務自由缺口：
${pageUrl}`;

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(pageUrl);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encodedText}`,
    threads: `https://www.threads.net/intent/post?text=${encodedText}`,
    line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      alert("已複製分享文案，可貼到 IG、Threads、LINE 或其他平台。");
    } catch {
      alert("複製失敗，請手動選取文字。");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Personal FinOps 計算結果",
          text: shareText,
          url: pageUrl,
        });
      } catch {
        return;
      }
    } else {
      copyText();
    }
  };

  const savePdf = () => {
    window.print();
  };

  return (
    <section className="section share-section">
      <h2>分享我的計算結果</h2>
      <p className="share-description">
        可將目前的現金水位、投資配置、每月存錢比例與財務自由缺口分享出去，也可以列印或另存成 PDF。
      </p>

      <div className="share-buttons">
        <button type="button" onClick={nativeShare}>手機分享</button>
        <a href={shareLinks.facebook} target="_blank" rel="noreferrer">Facebook</a>
        <a href={shareLinks.threads} target="_blank" rel="noreferrer">Threads</a>
        <a href={shareLinks.x} target="_blank" rel="noreferrer">X</a>
        <a href={shareLinks.line} target="_blank" rel="noreferrer">LINE</a>
        <button type="button" onClick={copyText}>複製給 IG</button>
        <button type="button" onClick={savePdf}>存成 PDF</button>
      </div>
    </section>
  );
}

export default function App() {
  const [monthlyIncome, setMonthlyIncome] = useState(100000);
  const [annualBonus, setAnnualBonus] = useState(0);
  const [mortgage, setMortgage] = useState(25000);
  const [personalLoan, setPersonalLoan] = useState(0);
  const [insurance, setInsurance] = useState(2000);
  const [livingExpense, setLivingExpense] = useState(25000);
  const [utilities, setUtilities] = useState(1000);
  const [currentCash, setCurrentCash] = useState(300000);
  const [cashGoal, setCashGoal] = useState(1000000);
  const [annualTravelBudget, setAnnualTravelBudget] = useState(50000);
  const [currentTravelFund, setCurrentTravelFund] = useState(0);
  const [currentInvestmentAsset, setCurrentInvestmentAsset] = useState(0);
  const [minInvestment, setMinInvestment] = useState(12000);
  const [maxInvestment, setMaxInvestment] = useState(50000);
  const [annualReturnRate, setAnnualReturnRate] = useState(6);
  const [retirementMonthlyCashflow, setRetirementMonthlyCashflow] = useState(60000);

  const result = useMemo(() => {
    const fixedExpense = mortgage + personalLoan + insurance + livingExpense + utilities;
    const monthlyBonusEquivalent = annualBonus / 12;
    const monthlyTotalIncome = monthlyIncome + monthlyBonusEquivalent;
    const available = monthlyTotalIncome - fixedExpense;
    const necessaryExpense = fixedExpense;
    const cashRunwayMonths = necessaryExpense > 0 ? currentCash / necessaryExpense : 0;
    const sixMonthCashTarget = necessaryExpense * 6;
    const cashGapToSixMonths = Math.max(sixMonthCashTarget - currentCash, 0);
    const suggestedMonthlyCashTopUp = cashGapToSixMonths > 0 ? cashGapToSixMonths / 12 : 0;
    const cashProgress = sixMonthCashTarget > 0 ? (currentCash / sixMonthCashTarget) * 100 : 0;
    const travelProgress = annualTravelBudget > 0 ? (currentTravelFund / annualTravelBudget) * 100 : 100;
    const remainingMonths = Math.max(12 - new Date().getMonth(), 1);
    const requiredMonthlyTravelSaving = Math.max((annualTravelBudget - currentTravelFund) / remainingMonths, 0);

    let cashAllocation = 0;
    let travelAllocation = 0;
    let investmentAllocation = 0;

    if (available > 0) {
      investmentAllocation = Math.min(minInvestment, available);
      let remaining = available - investmentAllocation;

      if (cashRunwayMonths < 6) {
        cashAllocation = remaining * 0.8;
        travelAllocation = remaining * 0.2;
      } else if (cashRunwayMonths <= 12) {
        cashAllocation = remaining * 0.3;
        travelAllocation = remaining * 0.3;
        investmentAllocation += remaining * 0.4;
      } else {
        cashAllocation = remaining * 0.1;
        travelAllocation = remaining * 0.2;
        investmentAllocation += remaining * 0.7;
      }

      if (currentTravelFund >= annualTravelBudget) {
        investmentAllocation += travelAllocation;
        travelAllocation = 0;
      }

      if (currentCash >= cashGoal || currentCash >= sixMonthCashTarget) {
        investmentAllocation += cashAllocation;
        cashAllocation = 0;
      }

      if (investmentAllocation > maxInvestment) {
        const excess = investmentAllocation - maxInvestment;
        investmentAllocation = maxInvestment;
        cashAllocation += excess;
      }
    }

    let cashStatus = "健康";
    let advice = "目前現金水位穩定，可平衡配置投資與旅遊基金。";

    if (cashRunwayMonths < 3) {
      cashStatus = "危險";
      advice = "現金水位低於 3 個月，建議暫緩增加風險性投資，優先補足緊急預備金。";
    } else if (cashRunwayMonths < 6) {
      cashStatus = "偏低";
      advice = "現金水位低於 6 個月，建議提高現金配置，先補足安全水位。";
    } else if (cashRunwayMonths > 12) {
      cashStatus = "偏高";
      advice = "現金水位超過 12 個月，可考慮提高長期投資比例。";
    }

    const monthlyReturnRate = annualReturnRate / 100 / 12;

    const projectedInvestment =
      monthlyReturnRate > 0
        ? currentInvestmentAsset * Math.pow(1 + monthlyReturnRate, 12) +
          investmentAllocation * ((Math.pow(1 + monthlyReturnRate, 12) - 1) / monthlyReturnRate)
        : currentInvestmentAsset + investmentAllocation * 12;

    const financialFreedomTarget = retirementMonthlyCashflow * 12 * 25;
    const financialFreedomGap = Math.max(financialFreedomTarget - currentInvestmentAsset, 0);
    const financialFreedomProgress =
      financialFreedomTarget > 0 ? (currentInvestmentAsset / financialFreedomTarget) * 100 : 0;

    let investmentAdvice = "";

    if (cashRunwayMonths < 6) {
      investmentAdvice = "目前建議以補強現金水位為優先，投資維持最低定期定額即可。";
    } else if (financialFreedomProgress < 25) {
      investmentAdvice = "目前距離財務自由目標仍遠，建議以長期成長型資產為主，例如大盤型 ETF 或核心股票配置。";
    } else if (financialFreedomProgress < 60) {
      investmentAdvice = "已進入資產累積期，建議維持核心投資，同時控制單一標的集中風險。";
    } else {
      investmentAdvice = "財務自由進度已具規模，建議逐步提高現金流型資產與防禦型配置。";
    }

    return {
      fixedExpense,
      monthlyBonusEquivalent,
      monthlyTotalIncome,
      available,
      cashRunwayMonths,
      sixMonthCashTarget,
      cashGapToSixMonths,
      suggestedMonthlyCashTopUp,
      cashProgress,
      travelProgress,
      requiredMonthlyTravelSaving,
      cashAllocation,
      travelAllocation,
      investmentAllocation,
      cashStatus,
      advice,
      projectedInvestment,
      financialFreedomTarget,
      financialFreedomGap,
      financialFreedomProgress,
      investmentAdvice,
    };
  }, [
    monthlyIncome,
    annualBonus,
    mortgage,
    personalLoan,
    insurance,
    livingExpense,
    utilities,
    currentCash,
    cashGoal,
    annualTravelBudget,
    currentTravelFund,
    currentInvestmentAsset,
    minInvestment,
    maxInvestment,
    annualReturnRate,
    retirementMonthlyCashflow,
  ]);

  return (
    <main className="app">
      <section className="hero">
        <div>
          {isDev && <GrowthAgent />}

          <p className="eyebrow">Personal FinOps Planner</p>

          <h1>個人財務管理工具｜用理財規劃做好現金流管理</h1>

          <div style={{ marginTop: "20px", marginBottom: "24px" }}>
            <a href="#calculator" className="cta-button">
              👉 開始試算我的財務狀況（免費）
            </a>
          </div>

          <p>
            想知道財務自由怎麼開始？FinOps Planner 是一個免費個人財務管理工具，
            幫助你用數據計算每月存錢比例、現金安全月數、投資配置與財務自由缺口。
          </p>

          <p>
            不只是記帳，而是協助你建立完整的理財規劃系統：收入進來後，該留多少現金、
            存多少旅遊基金、投入多少股票或 ETF，都能透過工具快速試算。
          </p>

          <p>
            適合：月薪族、股票與 ETF 投資者、想改善現金流管理、想開始財務自由規劃的人。
          </p>
        </div>
      </section>

      <section className="seo-content">
        <h2>免費個人財務管理工具：從現金流管理開始</h2>
        <p>
          多數人以為理財規劃的第一步是投資，但真正穩定的個人財務管理，
          應該先從現金流管理開始。你需要知道每個月收入扣除房貸、信貸、
          保險、生活費與固定支出後，還剩下多少可分配金額。
        </p>
        <p>
          FinOps Planner 會根據你的收入、年度獎金、固定支出、目前現金、
          旅遊預算與投資上限，自動計算每月資金分配建議，協助你建立更清楚的財務決策流程。
        </p>

        <h2>理財規劃不只記帳，而是做出更好的財務決策</h2>
        <p>
          傳統記帳工具通常只能告訴你錢花去哪裡，但完整的理財規劃應該回答：
          現金安全水位是否足夠？每月存錢比例是否合理？投資比例是否過高？
          距離財務自由還差多少？
        </p>
        <p>
          這個工具將個人財務管理拆解成現金、旅遊基金、股票投資與退休現金流目標，
          讓你可以用一個簡單的儀表板追蹤整體財務狀況。
        </p>

        <h2>財務自由怎麼開始？先建立每月存錢比例</h2>
        <p>
          如果你正在搜尋「財務自由怎麼開始」，第一步不是追求高報酬，
          而是建立穩定的每月存錢比例。一般來說，每月存下收入的 20% 是基本財務紀律；
          若想加速累積資產，可以逐步提高到 30% 至 40%。
        </p>
        <p>
          但每個人的房貸、生活費、家庭責任、旅遊需求與投資目標都不同，
          因此最好的方式不是套用固定公式，而是依照你的現金流狀況自動試算。
        </p>
      </section>

      <section id="calculator" className="dashboard">
        <MetricCard
          title="每月總收入"
          value={formatNTD(result.monthlyTotalIncome)}
          note={`含獎金月均 ${formatNTD(result.monthlyBonusEquivalent)}`}
        />
        <MetricCard title="每月可分配金額" value={formatNTD(result.available)} />
        <MetricCard title="固定支出合計" value={formatNTD(result.fixedExpense)} />
        <MetricCard
          title="現金安全月數"
          value={`${result.cashRunwayMonths.toFixed(1)} 個月`}
          note={result.cashStatus}
        />
      </section>

      <section className="dashboard">
        <MetricCard title="6 個月現金目標" value={formatNTD(result.sixMonthCashTarget)} />
        <MetricCard title="距離 6 個月水位還差" value={formatNTD(result.cashGapToSixMonths)} />
        <MetricCard
          title="建議每月補現金"
          value={formatNTD(result.suggestedMonthlyCashTopUp)}
          note="以 12 個月補足估算"
        />
        <MetricCard
          title="財務自由進度"
          value={`${clamp(result.financialFreedomProgress).toFixed(1)}%`}
        />
      </section>

      <section className="section">
        <h2>本月建議分配</h2>
        <div className="allocation-grid">
          <AllocationCard title="建議補現金" amount={result.cashAllocation} note="優先維持 6 個月安全水位" />
          <AllocationCard title="建議旅遊基金" amount={result.travelAllocation} note="追蹤年度旅遊預算" />
          <AllocationCard title="建議股票投資" amount={result.investmentAllocation} note="依最低與最高投資上限控管" />
        </div>
        <div className="advice-box">{result.advice}</div>
      </section>

      <section className="section two-column">
        <div>
          <h2>現金安全水位追蹤</h2>
          <ProgressBar value={result.cashProgress} />
          <p className="progress-text">6 個月現金目標達成率：{clamp(result.cashProgress).toFixed(1)}%</p>
          <p className="progress-text">目標現金水位：{formatNTD(result.sixMonthCashTarget)}</p>
        </div>

        <div>
          <h2>旅遊預算追蹤</h2>
          <ProgressBar value={result.travelProgress} />
          <p className="progress-text">旅遊預算達成率：{clamp(result.travelProgress).toFixed(1)}%</p>
          <p className="progress-text">建議每月旅遊沉澱：{formatNTD(result.requiredMonthlyTravelSaving)}</p>
        </div>
      </section>

      <section className="section">
        <h2>退休現金流與財務自由推估</h2>
        <div className="allocation-grid">
          <AllocationCard title="財務自由目標資產" amount={result.financialFreedomTarget} note="以 25 倍年支出估算" />
          <AllocationCard title="目前還差" amount={result.financialFreedomGap} note="目標資產 - 目前投資資產" />
          <AllocationCard title="12 個月後投資資產預估" amount={result.projectedInvestment} note="依目前每月投資與年化報酬率估算" />
        </div>
        <div className="advice-box">{result.investmentAdvice}</div>
      </section>

      <SharePanel result={result} />

      <section className="seo-content">
        <h2>這個個人財務管理工具適合誰？</h2>
        <p>
          FinOps Planner 適合想開始理財規劃的新手，也適合已經有投資習慣、
          但想更精準管理現金流與每月存錢比例的人。若你常常覺得收入不低，
          但月底卻沒有留下多少錢，這個工具可以協助你重新檢視資金分配。
        </p>

        <h2>為什麼現金流管理比單純記帳更重要？</h2>
        <p>
          記帳是回頭看過去的支出，現金流管理則是幫你安排未來的資金。
          當你知道每月可分配金額、現金安全月數與財務自由缺口後，
          就能更理性地決定該存錢、投資、還債，或安排旅遊基金。
        </p>
      </section>

      <section className="seo-content">
        <h2>個人財務管理常見問題 FAQ</h2>

        <h3>個人財務管理應該從哪裡開始？</h3>
        <p>
          建議先從現金流管理開始，了解每月收入與固定支出，確保至少 3–6 個月的現金安全水位，
          再逐步建立投資與存錢比例。
        </p>

        <h3>理財規劃一定要記帳嗎？</h3>
        <p>
          記帳可以幫助了解支出，但更重要的是建立資金分配策略。
          本工具著重在「如何分配錢」，而不只是記錄花費。
        </p>

        <h3>每月存錢比例應該多少？</h3>
        <p>
          一般建議至少 20%，若希望加速累積資產可以提高到 30%–40%。
          但最佳比例應依個人收入與支出結構調整。
        </p>

        <h3>財務自由怎麼開始？</h3>
        <p>
          財務自由的第一步是建立穩定現金流與儲蓄習慣，
          接著透過長期投資累積資產，最終讓資產產生的現金流覆蓋生活支出。
        </p>

        <h3>這個工具適合新手嗎？</h3>
        <p>
          非常適合。本工具將個人財務管理拆解為簡單步驟，
          即使沒有理財經驗也可以快速上手。
        </p>
      </section>

      <section className="form-grid">
        <div className="form-section">
          <h2>收入設定</h2>
          <InputCard label="每月收入" value={monthlyIncome} onChange={setMonthlyIncome} />
          <InputCard label="每年獎金收入" value={annualBonus} onChange={setAnnualBonus} />
        </div>

        <div className="form-section">
          <h2>固定支出</h2>
          <InputCard label="房貸" value={mortgage} onChange={setMortgage} />
          <InputCard label="信貸" value={personalLoan} onChange={setPersonalLoan} />
          <InputCard label="保險" value={insurance} onChange={setInsurance} />
          <InputCard label="生活費" value={livingExpense} onChange={setLivingExpense} />
          <InputCard label="水電瓦斯網路" value={utilities} onChange={setUtilities} />
        </div>

        <div className="form-section">
          <h2>旅遊與現金水位</h2>
          <InputCard label="年度旅遊預算" value={annualTravelBudget} onChange={setAnnualTravelBudget} />
          <InputCard label="目前旅遊基金" value={currentTravelFund} onChange={setCurrentTravelFund} />
          <InputCard label="目前現金" value={currentCash} onChange={setCurrentCash} />
          <InputCard label="自訂現金目標" value={cashGoal} onChange={setCashGoal} />
        </div>

        <div className="form-section">
          <h2>股票投資設定</h2>
          <InputCard label="目前投資資產" value={currentInvestmentAsset} onChange={setCurrentInvestmentAsset} />
          <InputCard label="每月最低投資金額" value={minInvestment} onChange={setMinInvestment} />
          <InputCard label="每月最高投資金額" value={maxInvestment} onChange={setMaxInvestment} />
          <InputCard label="預期年化報酬率" value={annualReturnRate} onChange={setAnnualReturnRate} suffix="%" />
          <InputCard label="退休後每月期待現金流" value={retirementMonthlyCashflow} onChange={setRetirementMonthlyCashflow} />
        </div>
      </section>
      
      <section className="seo-content">
        <p style={{ textAlign: "center", marginTop: "40px" }}>
          <a href="/sitemap.xml" target="_blank" rel="noreferrer">
            Sitemap
          </a>
        </p>
      </section>
      
    </main>
  );
}
