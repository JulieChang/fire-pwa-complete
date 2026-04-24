import { useMemo, useState, useEffect } from "react";
import "./App.css";

const defaultData = {
  monthlyIncome: 151000,
  bonusYearly: 0,
  sideIncome: 0,
  mortgage: 27154,
  personalLoan: 33025,
  insurance: 24587,
  livingCost: 35000,
  utilities: 5000,
  subscriptions: 2817,
  transport: 4000,
  etf006208: 10000,
  etf00918: 3000,
  etf00982A: 2000,
  travelBudget: 300000,
  emergencyTarget: 300000,
  currentInvestment: 0,
  currentCash: 0,
  expectedReturn: 6,
  targetPassiveIncome: 60000,
  withdrawalRate: 4,
};

function currency(n) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

function Input({ label, value, onChange, suffix = "NTD" }) {
  return (
    <label className="inputBox">
      <span>{label}</span>
      <div className="inputRow">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <em>{suffix}</em>
      </div>
    </label>
  );
}

export default function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("financePlannerData");
    return saved ? JSON.parse(saved) : defaultData;
  });

  useEffect(() => {
    localStorage.setItem("financePlannerData", JSON.stringify(data));
  }, [data]);

  const update = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const result = useMemo(() => {
    const annualIncome =
      data.monthlyIncome * 12 + data.bonusYearly + data.sideIncome * 12;

    const monthlyFixedExpense =
      data.mortgage +
      data.personalLoan +
      data.insurance +
      data.livingCost +
      data.utilities +
      data.subscriptions +
      data.transport;

    const monthlyETF = data.etf006208 + data.etf00918 + data.etf00982A;

    const monthlyBalance =
      data.monthlyIncome + data.sideIncome - monthlyFixedExpense - monthlyETF;

    const annualETF = monthlyETF * 12;
    const annualCashFlow = monthlyBalance * 12 - data.travelBudget;

    const targetAsset =
      (data.targetPassiveIncome * 12) / (data.withdrawalRate / 100);

    let yearsToFreedom = 0;
    let asset = data.currentInvestment;
    const monthlyReturn = data.expectedReturn / 100 / 12;

    while (asset < targetAsset && yearsToFreedom < 80) {
      asset = asset * (1 + monthlyReturn) + monthlyETF;
      yearsToFreedom += 1 / 12;
    }

    const expenseRatio =
      ((monthlyFixedExpense + monthlyETF) /
        Math.max(data.monthlyIncome + data.sideIncome, 1)) *
      100;

    return {
      annualIncome,
      monthlyFixedExpense,
      monthlyETF,
      monthlyBalance,
      annualETF,
      annualCashFlow,
      targetAsset,
      yearsToFreedom,
      expenseRatio,
    };
  }, [data]);

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">PERSONAL FINANCE PWA</p>
          <h1>Financial Freedom Planner</h1>
          <p className="subtitle">
            追蹤收入、固定支出、ETF 定期定額、旅遊預算與財務自由目標。
          </p>
        </div>

        <div className="heroCard">
          <span>Monthly Balance</span>
          <strong className={result.monthlyBalance < 0 ? "danger" : "good"}>
            {currency(result.monthlyBalance)}
          </strong>
        </div>
      </section>

      <section className="grid cards">
        <div className="card">
          <span>每月收入</span>
          <strong>{currency(data.monthlyIncome + data.sideIncome)}</strong>
        </div>
        <div className="card">
          <span>每月固定支出</span>
          <strong>{currency(result.monthlyFixedExpense)}</strong>
        </div>
        <div className="card">
          <span>每月 ETF 投入</span>
          <strong>{currency(result.monthlyETF)}</strong>
        </div>
        <div className="card">
          <span>年度 ETF 投入</span>
          <strong>{currency(result.annualETF)}</strong>
        </div>
        <div className="card">
          <span>年度現金流預估</span>
          <strong className={result.annualCashFlow < 0 ? "danger" : "good"}>
            {currency(result.annualCashFlow)}
          </strong>
        </div>
        <div className="card">
          <span>財務自由目標資產</span>
          <strong>{currency(result.targetAsset)}</strong>
        </div>
      </section>

      <section className="layout">
        <div className="panel">
          <h2>收入設定</h2>
          <Input
            label="每月薪資"
            value={data.monthlyIncome}
            onChange={(v) => update("monthlyIncome", v)}
          />
          <Input
            label="年度 Bonus"
            value={data.bonusYearly}
            onChange={(v) => update("bonusYearly", v)}
          />
          <Input
            label="每月其他收入"
            value={data.sideIncome}
            onChange={(v) => update("sideIncome", v)}
          />

          <h2>固定支出</h2>
          <Input label="房貸" value={data.mortgage} onChange={(v) => update("mortgage", v)} />
          <Input label="信貸" value={data.personalLoan} onChange={(v) => update("personalLoan", v)} />
          <Input label="保險" value={data.insurance} onChange={(v) => update("insurance", v)} />
          <Input label="生活費" value={data.livingCost} onChange={(v) => update("livingCost", v)} />
          <Input label="水電瓦斯網路" value={data.utilities} onChange={(v) => update("utilities", v)} />
          <Input label="訂閱服務" value={data.subscriptions} onChange={(v) => update("subscriptions", v)} />
          <Input label="交通費" value={data.transport} onChange={(v) => update("transport", v)} />
        </div>

        <div className="panel">
          <h2>ETF 投資設定</h2>
          <Input label="第一檔 每月投入" value={data.etf006208} onChange={(v) => update("etf006208", v)} />
          <Input label="第二檔 每月投入" value={data.etf00918} onChange={(v) => update("etf00918", v)} />
          <Input label="第三檔 每月投入" value={data.etf00982A} onChange={(v) => update("etf00982A", v)} />

          <h2>旅遊與現金水位</h2>
          <Input label="年度旅遊預算" value={data.travelBudget} onChange={(v) => update("travelBudget", v)} />
          <Input label="目前現金" value={data.currentCash} onChange={(v) => update("currentCash", v)} />
          <Input label="現金桶目標" value={data.emergencyTarget} onChange={(v) => update("emergencyTarget", v)} />

          <h2>財務自由目標</h2>
          <Input label="目前投資資產" value={data.currentInvestment} onChange={(v) => update("currentInvestment", v)} />
          <Input label="預期年化報酬率" value={data.expectedReturn} onChange={(v) => update("expectedReturn", v)} suffix="%" />
          <Input label="目標每月被動收入" value={data.targetPassiveIncome} onChange={(v) => update("targetPassiveIncome", v)} />
          <Input label="安全提領率" value={data.withdrawalRate} onChange={(v) => update("withdrawalRate", v)} suffix="%" />
        </div>

        <div className="panel resultPanel">
          <h2>財務壓力指標</h2>

          <div className="metric">
            <span>固定支出 + 投資 / 收入</span>
            <strong>{result.expenseRatio.toFixed(1)}%</strong>
          </div>

          <div className="bar">
            <div style={{ width: `${Math.min(result.expenseRatio, 100)}%` }} />
          </div>

          <p className="note">
            {result.expenseRatio > 90
              ? "目前現金流壓力偏高，建議優先降低固定支出或暫緩部分非必要投資。"
              : result.expenseRatio > 75
              ? "現金流偏緊，建議保留較高現金緩衝。"
              : "現金流相對健康，可持續投入 ETF 與旅遊預算。"}
          </p>

          <h2>財務自由估算</h2>
          <div className="freedom">
            <span>預估達標時間</span>
            <strong>
              {result.yearsToFreedom >= 80
                ? "超過 80 年"
                : `${result.yearsToFreedom.toFixed(1)} 年`}
            </strong>
          </div>

          <button onClick={() => setData(defaultData)}>恢復預設值</button>
        </div>
      </section>
    </main>
  );
}
