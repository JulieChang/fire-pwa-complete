import React, { useMemo, useState } from "react";
import "./App.css";

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

export default function App() {
  const [monthlyIncome, setMonthlyIncome] = useState(100000);

  const [mortgage, setMortgage] = useState(25000);
  const [personalLoan, setPersonalLoan] = useState(0);
  const [insurance, setInsurance] = useState(2000);
  const [livingExpense, setLivingExpense] = useState(25000);
  const [utilities, setUtilities] = useState(3000);

  const [currentCash, setCurrentCash] = useState(300000);
  const [cashGoal, setCashGoal] = useState(1000000);

  const [annualTravelBudget, setAnnualTravelBudget] = useState(50000);
  const [currentTravelFund, setCurrentTravelFund] = useState(0);

  const [currentInvestmentAsset, setCurrentInvestmentAsset] = useState(0);
  const [minInvestment, setMinInvestment] = useState(12000);
  const [maxInvestment, setMaxInvestment] = useState(50000);
  const [annualReturnRate, setAnnualReturnRate] = useState(6);

  const result = useMemo(() => {
    const fixedExpense =
      mortgage + personalLoan + insurance + livingExpense + utilities;

    const available = monthlyIncome - fixedExpense;
    const necessaryExpense = fixedExpense;
    const cashRunwayMonths =
      necessaryExpense > 0 ? currentCash / necessaryExpense : 0;

    const cashProgress = cashGoal > 0 ? (currentCash / cashGoal) * 100 : 0;
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

      if (currentCash >= cashGoal) {
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
      advice = "現金水位低於 3 個月，建議優先補足緊急預備金。";
    } else if (cashRunwayMonths < 6) {
      cashStatus = "偏低";
      advice = "現金水位低於 6 個月，建議提高現金配置。";
    } else if (cashRunwayMonths > 12) {
      cashStatus = "偏高";
      advice = "現金水位超過 12 個月，可考慮提高投資比例。";
    }

    const monthlyReturnRate = annualReturnRate / 100 / 12;
    const projectedInvestment =
      currentInvestmentAsset * Math.pow(1 + monthlyReturnRate, 12) +
      investmentAllocation *
        ((Math.pow(1 + monthlyReturnRate, 12) - 1) / monthlyReturnRate || 12);

    const financialFreedomTarget = 60000 * 12 * 25;
    const financialFreedomProgress =
      financialFreedomTarget > 0
        ? (currentInvestmentAsset / financialFreedomTarget) * 100
        : 0;

    return {
      fixedExpense,
      available,
      cashRunwayMonths,
      cashProgress,
      travelProgress,
      requiredMonthlyTravelSaving,
      cashAllocation,
      travelAllocation,
      investmentAllocation,
      cashStatus,
      advice,
      projectedInvestment,
      financialFreedomProgress,
    };
  }, [
    monthlyIncome,
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
  ]);

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">Financial Freedom Planner</p>
          <h1>每月資金分配引擎</h1>
          <p>
            依照收入、固定支出、現金水位、旅遊預算與投資上限，自動產出每月分配建議。
          </p>
        </div>
      </section>

      <section className="dashboard">
        <MetricCard title="每月可分配金額" value={formatNTD(result.available)} />
        <MetricCard title="固定支出合計" value={formatNTD(result.fixedExpense)} />
        <MetricCard
          title="現金安全月數"
          value={`${result.cashRunwayMonths.toFixed(1)} 個月`}
          note={result.cashStatus}
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
            note="優先維持安全水位"
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
          <h2>現金水位追蹤</h2>
          <ProgressBar value={result.cashProgress} />
          <p className="progress-text">
            現金目標達成率：{clamp(result.cashProgress).toFixed(1)}%
          </p>
        </div>

        <div>
          <h2>旅遊預算追蹤</h2>
          <ProgressBar value={result.travelProgress} />
          <p className="progress-text">
            旅遊預算達成率：{clamp(result.travelProgress).toFixed(1)}%
          </p>
          <p className="progress-text">
            建議每月旅遊沉澱：
            {formatNTD(result.requiredMonthlyTravelSaving)}
          </p>
        </div>
      </section>

      <section className="section">
        <h2>12 個月後投資資產預估</h2>
        <div className="projection">
          {formatNTD(result.projectedInvestment)}
        </div>
      </section>

      <section className="form-grid">
        <div className="form-section">
          <h2>收入設定</h2>
          <InputCard
            label="每月收入"
            value={monthlyIncome}
            onChange={setMonthlyIncome}
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
            label="現金目標"
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
        </div>
      </section>
    </main>
  );
}
