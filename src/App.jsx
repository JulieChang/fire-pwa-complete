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

用這個免費工具試算你的現金水位、投資配置與財務自由缺口：
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
        可將目前的現金水位、投資配置與財務自由缺口分享出去，也可以列印或另存成 PDF。
      </p>

      <div className="share-buttons">
        <button type="button" onClick={nativeShare}>
          手機分享
        </button>

        <a href={shareLinks.facebook} target="_blank" rel="noreferrer">
          Facebook
        </a>

        <a href={shareLinks.threads} target="_blank" rel="noreferrer">
          Threads
        </a>

        <a href={shareLinks.x} target="_blank" rel="noreferrer">
          X
        </a>

        <a href={shareLinks.line} target="_blank" rel="noreferrer">
          LINE
        </a>

        <button type="button" onClick={copyText}>
          複製給 IG
        </button>

        <button type="button" onClick={savePdf}>
          存成 PDF
        </button>
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

  const [retirementMonthlyCashflow, setRetirementMonthlyCashflow] =
    useState(60000);

  const result = useMemo(() => {
    const fixedExpense =
      mortgage + personalLoan + insurance + livingExpense + utilities;

    const monthlyBonusEquivalent = annualBonus / 12;
    const monthlyTotalIncome = monthlyIncome + monthlyBonusEquivalent;
    const available = monthlyTotalIncome - fixedExpense;

    const necessaryExpense = fixedExpense;
    const cashRunwayMonths =
      necessaryExpense > 0 ? currentCash / necessaryExpense : 0;

    const sixMonthCashTarget = necessaryExpense * 6;
    const cashGapToSixMonths = Math.max(sixMonthCashTarget - currentCash, 0);

    const suggestedMonthlyCashTopUp =
      cashGapToSixMonths > 0 ? cashGapToSixMonths / 12 : 0;

    const cashProgress =
      sixMonthCashTarget > 0 ? (currentCash / sixMonthCashTarget) * 100 : 0;

    const travelProgress =
      annualTravelBudget > 0
        ? (currentTravelFund / annualTravelBudget) * 100
        : 100;

    const remainingMonths = Math.max(12 - new Date().getMonth(), 1);

    const requiredMonthlyTravelSaving = Math.max(
      (annualTravelBudget - currentTravelFund) / remainingMonths,
      0
    );

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
      advice =
        "現金水位低於 3 個月，建議暫緩增加風險性投資，優先補足緊急預備金。";
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
          investmentAllocation *
            ((Math.pow(1 + monthlyReturnRate, 12) - 1) / monthlyReturnRate)
        : currentInvestmentAsset + investmentAllocation * 12;

    const financialFreedomTarget = retirementMonthlyCashflow * 12 * 25;

    const financialFreedomGap = Math.max(
      financialFreedomTarget - currentInvestmentAsset,
      0
    );

    const financialFreedomProgress =
      financialFreedomTarget > 0
        ? (currentInvestmentAsset / financialFreedomTarget) * 100
        : 0;

    let investmentAdvice = "";

    if (cashRunwayMonths < 6) {
      investmentAdvice =
        "目前建議以補強現金水位為優先，投資維持最低定期定額即可。";
    } else if (financialFreedomProgress < 25) {
      investmentAdvice =
        "目前距離財務自由目標仍遠，建議以長期成長型資產為主，例如大盤型 ETF 或核心股票配置。";
    } else if (financialFreedomProgress < 60) {
      investmentAdvice =
        "已進入資產累積期，建議維持核心投資，同時控制單一標的集中風險。";
    } else {
      investmentAdvice =
        "財務自由進度已具規模，建議逐步提高現金流型資產與防禦型配置。";
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

          <p className="eyebrow">Personal FinOps Engine</p>
          <h1>每月資金分配引擎</h1>
          <p>
            依照收入、獎金、固定支出、現金水位、旅遊預算與投資上限，自動產出每月分配建議。
          </p>
          <p>
            幫助你自動計算：✔ 現金安全水位 ✔ 每月投資配置 ✔ 旅遊預算規劃 ✔ 財務自由缺口
          </p>
          <p>適合：月薪族 / 股票與 ETF 投資者 / 想達成財務自由的人</p>
        </div>
      </section>

      <section className="seo-content">
        <h2>免費財務規劃工具｜現金水位與投資配置一次搞定</h2>
        <p>
          這是一個專為台灣上班族設計的免費財務規劃工具，透過簡單輸入每月收入、
          年度獎金、固定支出與現金資產，即可自動計算最適合你的資金分配策略。
        </p>
        <p>
          本工具整合現金流管理、投資配置、旅遊預算與退休現金流目標，
          幫助你用更系統化的方式管理財務，而不是單純記帳。
        </p>
      </section>

      <section className="dashboard">
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
        <MetricCard
          title="6 個月現金目標"
          value={formatNTD(result.sixMonthCashTarget)}
        />
        <MetricCard
          title="距離 6 個月水位還差"
          value={formatNTD(result.cashGapToSixMonths)}
        />
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
          <AllocationCard
            title="建議補現金"
            amount={result.cashAllocation}
            note="優先維持 6 個月安全水位"
          />
          <AllocationCard
            title="建議旅遊基金"
            amount={result.travelAllocation}
            note="追蹤年度旅遊預算"
          />
          <AllocationCard
            title="建議股票投資"
            amount={result.investmentAllocation}
            note="依最低與最高投資上限控管"
          />
        </div>
        <div className="advice-box">{result.advice}</div>
      </section>

      <section className="section two-column">
        <div>
          <h2>現金安全水位追蹤</h2>
          <ProgressBar value={result.cashProgress} />
          <p className="progress-text">
            6 個月現金目標達成率：{clamp(result.cashProgress).toFixed(1)}%
          </p>
          <p className="progress-text">
            目標現金水位：{formatNTD(result.sixMonthCashTarget)}
          </p>
        </div>

        <div>
          <h2>旅遊預算追蹤</h2>
          <ProgressBar value={result.travelProgress} />
          <p className="progress-text">
            旅遊預算達成率：{clamp(result.travelProgress).toFixed(1)}%
          </p>
          <p className="progress-text">
            建議每月旅遊沉澱：{formatNTD(result.requiredMonthlyTravelSaving)}
          </p>
        </div>
      </section>

      <section className="section">
        <h2>退休現金流與財務自由推估</h2>
        <div className="allocation-grid">
          <AllocationCard
            title="財務自由目標資產"
            amount={result.financialFreedomTarget}
            note="以 25 倍年支出估算"
          />
          <AllocationCard
            title="目前還差"
            amount={result.financialFreedomGap}
            note="目標資產 - 目前投資資產"
          />
          <AllocationCard
            title="12 個月後投資資產預估"
            amount={result.projectedInvestment}
            note="依目前每月投資與年化報酬率估算"
          />
        </div>
        <div className="advice-box">{result.investmentAdvice}</div>
      </section>

      <SharePanel result={result} />

      <section className="form-grid">
        <div className="form-section">
          <h2>收入設定</h2>
          <InputCard
            label="每月收入"
            value={monthlyIncome}
            onChange={setMonthlyIncome}
          />
          <InputCard
            label="每年獎金收入"
            value={annualBonus}
            onChange={setAnnualBonus}
          />
        </div>

        <div className="form-section">
          <h2>固定支出</h2>
          <InputCard label="房貸" value={mortgage} onChange={setMortgage} />
          <InputCard
            label="信貸"
            value={personalLoan}
            onChange={setPersonalLoan}
          />
          <InputCard label="保險" value={insurance} onChange={setInsurance} />
          <InputCard
            label="生活費"
            value={livingExpense}
            onChange={setLivingExpense}
          />
          <InputCard
            label="水電瓦斯網路"
            value={utilities}
            onChange={setUtilities}
          />
        </div>

        <div className="form-section">
          <h2>旅遊與現金水位</h2>
          <InputCard
            label="年度旅遊預算"
            value={annualTravelBudget}
            onChange={setAnnualTravelBudget}
          />
          <InputCard
            label="目前旅遊基金"
            value={currentTravelFund}
            onChange={setCurrentTravelFund}
          />
          <InputCard
            label="目前現金"
            value={currentCash}
            onChange={setCurrentCash}
          />
          <InputCard
            label="自訂現金目標"
            value={cashGoal}
            onChange={setCashGoal}
          />
        </div>

        <div className="form-section">
          <h2>股票投資設定</h2>
          <InputCard
            label="目前投資資產"
            value={currentInvestmentAsset}
            onChange={setCurrentInvestmentAsset}
          />
          <InputCard
            label="每月最低投資金額"
            value={minInvestment}
            onChange={setMinInvestment}
          />
          <InputCard
            label="每月最高投資金額"
            value={maxInvestment}
            onChange={setMaxInvestment}
          />
          <InputCard
            label="預期年化報酬率"
            value={annualReturnRate}
            onChange={setAnnualReturnRate}
            suffix="%"
          />
          <InputCard
            label="退休後每月期待現金流"
            value={retirementMonthlyCashflow}
            onChange={setRetirementMonthlyCashflow}
          />
        </div>
      </section>
    </main>
  );
}
