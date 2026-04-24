import React, { useMemo, useState } from "react";

const defaultData = {
  monthlyIncome: 151000,
  livingBudget: 35000,
  mortgage: 27154,
  personalLoan: 33025,
  insurance: 24587,
  etf006208: 10000,
  etf00918: 3000,
  etf00982A: 2000,
  annualTravelBudget: 300000,
  cashGoal: 300000,
  travelGoal: 70000,
};

function currency(value) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function App() {
  const [data, setData] = useState(defaultData);

  const totalEtf = data.etf006208 + data.etf00918 + data.etf00982A;
  const monthlyFixed =
    data.livingBudget + data.mortgage + data.personalLoan + data.insurance + totalEtf;
  const monthlyBalance = data.monthlyIncome - monthlyFixed;
  const annualInvest = totalEtf * 12;
  const annualBalance = monthlyBalance * 12;

  const expenseRatio = useMemo(() => {
    if (!data.monthlyIncome) return 0;
    return Math.min(100, Math.round((monthlyFixed / data.monthlyIncome) * 100));
  }, [monthlyFixed, data.monthlyIncome]);

  function updateField(key, value) {
    setData((prev) => ({
      ...prev,
      [key]: Number(value || 0),
    }));
  }

  const fields = [
    ["monthlyIncome", "每月收入"],
    ["livingBudget", "生活費預算"],
    ["mortgage", "房貸"],
    ["personalLoan", "信貸"],
    ["insurance", "保險"],
    ["etf006208", "006208 每月投入"],
    ["etf00918", "00918 每月投入"],
    ["etf00982A", "00982A 每月投入"],
    ["annualTravelBudget", "年度旅遊預算"],
  ];

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">Personal Finance PWA</p>
          <h1>Financial Freedom Planner</h1>
          <p className="subtitle">
            追蹤收入、固定支出、ETF 定期定額、旅遊預算與每月可運用現金流。
          </p>
        </div>
        <div className="heroBadge">
          <span>Monthly Balance</span>
          <strong className={monthlyBalance >= 0 ? "positive" : "negative"}>
            {currency(monthlyBalance)}
          </strong>
        </div>
      </section>

      <section className="cards">
        <Card title="每月收入" value={currency(data.monthlyIncome)} />
        <Card title="每月固定支出＋投資" value={currency(monthlyFixed)} />
        <Card title="每月 ETF 投入" value={currency(totalEtf)} />
        <Card title="年度 ETF 投入" value={currency(annualInvest)} />
        <Card title="年度現金流預估" value={currency(annualBalance)} />
        <Card title="年度旅遊預算" value={currency(data.annualTravelBudget)} />
      </section>

      <section className="panel">
        <div>
          <h2>現金流壓力指標</h2>
          <p>
            目前每月固定支出與投資約占收入 <strong>{expenseRatio}%</strong>。
          </p>
          <div className="progress">
            <div style={{ width: `${expenseRatio}%` }} />
          </div>
        </div>
      </section>

      <section className="layout">
        <div className="panel">
          <h2>輸入與調整</h2>
          <div className="formGrid">
            {fields.map(([key, label]) => (
              <label key={key}>
                <span>{label}</span>
                <input
                  type="number"
                  value={data[key]}
                  onChange={(event) => updateField(key, event.target.value)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>ETF 配置</h2>
          <div className="allocation">
            <Row label="006208 Core" value={data.etf006208} total={totalEtf} />
            <Row label="00918 Dividend" value={data.etf00918} total={totalEtf} />
            <Row label="00982A Growth" value={data.etf00982A} total={totalEtf} />
          </div>

          <h2 className="mt">目標桶</h2>
          <ul className="goalList">
            <li>
              <span>現金桶初期目標</span>
              <strong>{currency(data.cashGoal)}</strong>
            </li>
            <li>
              <span>旅遊桶年度目標</span>
              <strong>{currency(data.travelGoal)}</strong>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}

function Card({ title, value }) {
  return (
    <article className="card">
      <p>{title}</p>
      <strong>{value}</strong>
    </article>
  );
}

function Row({ label, value, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="row">
      <div className="rowTop">
        <span>{label}</span>
        <strong>{currency(value)} / {pct}%</strong>
      </div>
      <div className="bar">
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
