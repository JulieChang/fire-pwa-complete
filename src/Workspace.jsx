import React, { useEffect, useMemo, useState, useRef } from "react";
import { defaultInputs, normalizeInputs, calculatePlan } from "./finance.js";
import {
  defaultAssumptions,
  simulateScenario,
  sensitivity,
  CALCULATION_VERSION,
  monthIndex,
} from "./planning.js";
import {
  PLAN_STORAGE_KEY,
  emptyStore,
  parseBackup,
  saveRevision,
  snapshotDeviation,
} from "./plan-store.js";
import { buildFactDraft } from "./content-facts.js";
import "./workspace.css";
const money = (v) =>
  v === null
    ? "未能估算"
    : new Intl.NumberFormat("zh-TW", {
        style: "currency",
        currency: "TWD",
        maximumFractionDigits: 0,
      }).format(v);
const clone = (v) => JSON.parse(JSON.stringify(v));
const monthNow = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
function readInputs() {
  const saved =
    localStorage.getItem("finopsCalculatedInputsV1") ||
    localStorage.getItem("finopsPlannerInputsV3");
  return {
    inputs: saved ? normalizeInputs(JSON.parse(saved)) : defaultInputs,
    example: !saved,
  };
}
function useRecords() {
  const [records, setRecords] = useState(emptyStore),
    [storageError, setStorageError] = useState("");
  const loadedRaw = useRef(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PLAN_STORAGE_KEY);
      loadedRaw.current = raw;
      if (raw) setRecords(parseBackup(raw));
    } catch (e) {
      setStorageError(
        `未能讀取已存方案：${e.message}。原資料未被修改；請先備份。`,
      );
    }
  }, []);
  function persist(next, { replace = false } = {}) {
    if (storageError && !replace)
      throw Error("現有資料讀取異常，請先匯出原始備份並檢查，避免覆蓋。");
    if (
      !replace &&
      localStorage.getItem(PLAN_STORAGE_KEY) !== loadedRaw.current
    )
      throw Error("另一個分頁已更新資料，請先重新載入本頁。");
    try {
      const raw = JSON.stringify(next);
      localStorage.setItem(PLAN_STORAGE_KEY, raw);
      loadedRaw.current = raw;
      setRecords(next);
      setStorageError("");
    } catch {
      throw Error("裝置儲存空間不足或不可使用；尚未保存，請匯出備份。");
    }
  }
  return { records, persist, storageError };
}
function Metric({ title, value, note }) {
  return (
    <section className="os-metric">
      <p>{title}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </section>
  );
}
export function DailyDashboard() {
  const [data, setData] = useState({ inputs: defaultInputs, example: true }),
    [date, setDate] = useState(""),
    [error, setError] = useState("");
  const { records, storageError } = useRecords();
  useEffect(() => {
    setDate(monthNow());
    try {
      setData(readInputs());
    } catch {
      setError("未能讀取既有輸入；以下顯示範例，請到完整診斷確認。");
    }
  }, []);
  const r = calculatePlan(data.inputs);
  const revision = records.revisions.find((x) => x.id === records.baselineId);
  const snapshot = records.snapshots
    .filter((x) => x.revisionId === records.baselineId)
    .sort(
      (a, b) =>
        b.month.localeCompare(a.month) ||
        b.createdAt.localeCompare(a.createdAt),
    )[0];
  const deviation = snapshotDeviation(revision, snapshot);
  return (
    <div className="os-workspace">
      <header className="os-heading">
        <p className="eyebrow">Personal FinOps · {date || "每日回顧"}</p>
        <h1>今天，掌握自己的財務節奏</h1>
        <p>看懂目前狀態，決定下一步。深入比較，留在情境與 FIRE 規劃。</p>
      </header>
      <p className="os-status">
        {data.example
          ? "目前顯示 30 歲示例，尚未載入你的財務資料。"
          : "淨值、現金月數與投資建議依最近載入的診斷資料；請在金額變動後手動更新。"}
      </p>
      {(error || storageError) && <p role="alert">{error || storageError}</p>}
      <div className="os-metrics" aria-label="每日四項指標">
        <Metric
          title="淨值"
          value={money(r.totalNetWorth)}
          note="含現金、旅遊基金、投資及房產，扣除負債；本金未填時為估算。"
        />
        <Metric
          title="現金月數"
          value={
            r.fixedExpense > 0
              ? `${r.cashRunwayMonths.toFixed(1)} 個月`
              : "待補支出"
          }
          note={
            r.fixedExpense > 0
              ? `以緊急預備金支應目前固定支出，建議維持 ${r.recommendedRunwayMonths} 個月。`
              : "支出為零時無法估算，請先確認必要開銷。"
          }
        />
        <Metric
          title="本月可投資金額"
          value={money(r.suggestedInvestment)}
          note={
            r.available <= 0
              ? "本月沒有新增投資餘額，先處理現金流缺口。"
              : "依本月收入、現金與投資上下限估算，不提前使用年度獎金。"
          }
        />
        <Metric
          title="FIRE 軌道偏差"
          value={
            deviation
              ? `${deviation.amount >= 0 ? "+" : ""}${money(deviation.amount)}`
              : "尚未建立"
          }
          note={
            deviation
              ? `${deviation.month} 月底投資實績減同月計畫值；${revision.name}，不是今日即時損益。`
              : "先保存基準方案，再記錄已結束月份的投資資產實績。"
          }
        />
      </div>
      <nav className="os-actions" aria-label="下一步">
        <a className="primary-button" href="/diagnosis#calculator">
          更新財務資料
        </a>
        <a className="secondary-button" href="/planning">
          情境與 FIRE 規劃
        </a>
        <a href="/methodology">查看計算方法</a>
      </nav>
      <p className="muted">
        資料由你輸入與確認；系統提供建議，不執行交易或資金移轉。
      </p>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "number",
  min = 0,
  max,
  step = "any",
  hint,
}) {
  return (
    <label className="os-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(
            type === "number"
              ? e.target.value === ""
                ? ""
                : Number(e.target.value)
              : e.target.value,
          )
        }
        min={type === "number" ? min : undefined}
        max={max}
        step={type === "number" ? step : undefined}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}
const inputFields = [
  ["age", "目前年齡"],
  ["monthlyIncome", "每月實領收入"],
  ["currentCash", "緊急預備金現金"],
  ["currentInvestmentAsset", "目前投資資產"],
  ["annualBonus", "年度獎金"],
  ["livingExpense", "每月生活費"],
  ["mortgage", "房貸每月還款"],
  ["mortgageRemainingMonths", "房貸剩餘期數"],
  ["personalLoan", "信貸每月還款"],
  ["personalLoanRemainingMonths", "信貸剩餘期數"],
  ["annualTravelBudget", "年度旅遊預算"],
  ["currentTravelFund", "現有旅遊基金"],
];
const extraFields = [
  ["insurance", "每月保險費"],
  ["utilities", "每月水電網路"],
  ["transportation", "每月交通費"],
  ["familySupport", "每月家庭支援"],
  ["otherFixedExpense", "其他固定月支出"],
  ["cashGoal", "自訂緊急現金目標"],
  ["otherAnnualIncome", "其他年度收入"],
  ["dependents", "扶養人數"],
  ["householdMembers", "家庭總人數"],
  ["homeValue", "自住房市值"],
  ["mortgageBalance", "房貸剩餘本金"],
  ["personalLoanBalance", "信貸剩餘本金"],
  ["otherDebt", "其他負債"],
  ["minInvestment", "診斷最低月投資"],
  ["maxInvestment", "診斷最高月投資"],
];
function ProjectionChart({ result }) {
  const points = [
    { investments: result.inputs.currentInvestmentAsset },
    ...result.months.filter((_, i) => i % 12 === 11),
  ];
  const max = Math.max(1, ...points.map((p) => p.investments));
  return (
    <figure className="os-chart">
      <svg
        viewBox="0 0 760 200"
        role="img"
        aria-label="情境投資資產年度走勢；非實績"
      >
        <line x1="20" y1="175" x2="740" y2="175" stroke="#cbd5e1" />
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          points={points
            .map(
              (p, i) =>
                `${20 + (i / (points.length - 1)) * 720},${175 - (p.investments / max) * 155}`,
            )
            .join(" ")}
        />
      </svg>
      <figcaption>
        {result.assumptions.startMonth} 至 {result.months.at(-1).month} ·
        每年投資資產，縱軸 0 至 {money(max)}。詳細數值見月表。
      </figcaption>
    </figure>
  );
}
function Portfolio({ amount }) {
  const [current, setCurrent] = useState([60, 30, 10]),
    [target, setTarget] = useState([60, 30, 10]);
  const valid = [current, target].every(
    (xs) =>
      xs.every((x) => Number.isFinite(x) && x >= 0 && x <= 100) &&
      xs.reduce((a, b) => a + b, 0) === 100,
  );
  return (
    <section className="section">
      <h2>資產配置檢查</h2>
      <p>
        以本次已計算的投資資產為本金，手動比較目前比例與目標比例。預設比例僅為示例，不是推薦；不會觸發買賣。
      </p>
      <div className="os-table-wrap">
        <table>
          <thead>
            <tr>
              <th>類別</th>
              <th>目前比例 %</th>
              <th>目標比例 %</th>
              <th>與目標金額差</th>
            </tr>
          </thead>
          <tbody>
            {["股票", "債券", "其他投資"].map((name, i) => (
              <tr key={name}>
                <th>{name}</th>
                <td>
                  <input
                    aria-label={`${name}目前比例`}
                    type="number"
                    min="0"
                    max="100"
                    value={current[i]}
                    onChange={(e) =>
                      setCurrent(
                        current.map((v, j) =>
                          j === i ? Number(e.target.value) : v,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    aria-label={`${name}目標比例`}
                    type="number"
                    min="0"
                    max="100"
                    value={target[i]}
                    onChange={(e) =>
                      setTarget(
                        target.map((v, j) =>
                          j === i ? Number(e.target.value) : v,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  {valid
                    ? money((amount * (target[i] - current[i])) / 100)
                    : "比例合計須為 100%"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        {valid
          ? Math.max(...current) > 70
            ? "目前單一類別超過 70%，可檢視集中風險；此門檻為本站提醒規則。"
            : "請同時檢查幣別、產業與單一標的集中度；三類比例無法反映全部風險。"
          : "每組比例均須合計 100%。"}
      </p>
      <p className="muted">
        配置比例僅供此區檢查，不會改變下方已計算的整體報酬假設，也不隨方案保存。
      </p>
    </section>
  );
}
export function PlanningWorkspace() {
  const [inputs, setInputs] = useState(defaultInputs),
    [a, setA] = useState(() => defaultAssumptions(defaultInputs));
  const [name, setName] = useState("現況基準"),
    [reason, setReason] = useState("建立初始規劃"),
    [parentId, setParentId] = useState(null),
    [result, setResult] = useState(null),
    [signature, setSignature] = useState("");
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [today, setToday] = useState(""),
    [snapshotMonth, setSnapshotMonth] = useState(""),
    [actual, setActual] = useState(""),
    [importText, setImportText] = useState(""),
    [pendingImport, setPendingImport] = useState(null),
    [resetPending, setResetPending] = useState(false);
  const { records, persist, storageError } = useRecords();
  useEffect(() => {
    try {
      const i = readInputs().inputs;
      setInputs(i);
      setA(defaultAssumptions(i, monthNow()));
      setToday(monthNow());
    } catch {
      setError("未能讀取診斷資料；目前使用範例。");
    }
  }, []);
  const dirty = signature !== JSON.stringify({ inputs, a });
  const baseline = records.revisions.find((r) => r.id === records.baselineId);
  const variants = useMemo(
    () => (result ? sensitivity(result.inputs, result.assumptions) : []),
    [result],
  );
  const updateInput = (key, value) => setInputs({ ...inputs, [key]: value });
  const updateA = (key, value) => setA({ ...a, [key]: value });
  function action(fn) {
    try {
      setError("");
      setMessage("");
      fn();
    } catch (e) {
      setError(e.message);
    }
  }
  function calculate() {
    action(() => {
      const r = simulateScenario(inputs, a);
      setResult(r);
      setSignature(JSON.stringify({ inputs, a }));
      setMessage("已完成本機計算。結果尚未保存為方案。");
    });
  }
  function save() {
    action(() => {
      if (!result || dirty) throw Error("請先重新計算，再保存這份方案。");
      const id = crypto.randomUUID();
      const next = saveRevision(records, {
        id,
        name,
        reason,
        parentId,
        createdAt: new Date().toISOString(),
        result,
      });
      persist(next);
      setParentId(id);
      setMessage("已保存新版本。可在方案列表選為追蹤基準。");
    });
  }
  function load(r) {
    setInputs(clone(r.result.inputs));
    setA(clone(r.result.assumptions));
    setResult(clone(r.result));
    setSignature(
      JSON.stringify({ inputs: r.result.inputs, a: r.result.assumptions }),
    );
    setName(r.name);
    setParentId(r.id);
    setReason("");
    setMessage(`已載入「${r.name}」；修改後請填原因並另存新版本。`);
  }
  function preset(kind) {
    const next = { ...a, changeMonth: "", breakMonths: 0 };
    if (kind === "early")
      next.retirementAge = Math.max(
        Number(inputs.age),
        Number(a.retirementAge) - 5,
      );
    if (kind === "career" || kind === "self") {
      next.changeMonth = a.startMonth;
      next.breakMonths = kind === "career" ? 3 : 0;
      next.newMonthlyIncome =
        kind === "self"
          ? Math.round(Number(inputs.monthlyIncome) * 0.7)
          : inputs.monthlyIncome;
    }
    setA(next);
    setName(
      {
        base: "現況基準",
        early: "提早退休",
        career: "轉職空窗",
        self: "自雇試算",
      }[kind],
    );
    setMessage("已套用假設範例，請調整數字後重新計算；尚未保存。");
  }
  function recordSnapshot() {
    action(() => {
      if (!baseline) throw Error("請先選擇追蹤基準。");
      if (!snapshotMonth || monthIndex(snapshotMonth) >= monthIndex(today))
        throw Error("請記錄已結束月份的月底實績，避免和未完成月份比較。");
      if (
        actual === "" ||
        !Number.isFinite(Number(actual)) ||
        Number(actual) < 0 ||
        Number(actual) > 1e12
      )
        throw Error("請填有效投資資產金額。");
      const s = {
        revisionId: baseline.id,
        month: snapshotMonth,
        actualInvestments: Number(actual),
        createdAt: new Date().toISOString(),
      };
      if (!snapshotDeviation(baseline, s))
        throw Error("此月份不在基準方案期間內。");
      if (records.snapshots.length >= 120)
        throw Error("已達 120 筆實績上限，請先匯出備份。");
      persist({ ...records, snapshots: [...records.snapshots, s] });
      setMessage("已保存月底實績，首頁將顯示同月軌道偏差。");
    });
  }
  function exportBackup() {
    action(() => {
      const raw = storageError
        ? localStorage.getItem(PLAN_STORAGE_KEY)
        : JSON.stringify(records, null, 2);
      const url = URL.createObjectURL(
        new Blob([raw || ""], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "finops-v1-backup.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("已準備備份下載；請保管其中的財務資料。");
    });
  }
  return (
    <div className="os-workspace">
      <header className="os-heading">
        <p className="eyebrow">情境與 FIRE 規劃</p>
        <h1>把未來的選擇，放進同一份計畫</h1>
        <p>
          先確認輸入與假設，再比較結果。所有計算與方案保存在此瀏覽器，AI
          不會修改你的資料。
        </p>
      </header>
      <nav className="os-actions">
        <a href="/">今日 Dashboard</a>
        <a href="/diagnosis#calculator">完整診斷與資料</a>
        <a href="/methodology#monthly-method">計算方法與限制</a>
      </nav>
      {(error || storageError) && (
        <p className="os-error" role="alert">
          {error || storageError}
        </p>
      )}
      {message && (
        <p className="os-status" role="status">
          {message}
        </p>
      )}
      <section className="section">
        <h2>1. 建立情境</h2>
        <p>
          初次載入沿用診斷資料或示例；本頁修改只影響這份情境，不會覆寫診斷輸入。
        </p>
        <div className="os-actions">
          {[
            ["base", "現況"],
            ["early", "提早退休"],
            ["career", "轉職"],
            ["self", "自雇"],
          ].map(([k, label]) => (
            <button key={k} type="button" onClick={() => preset(k)}>
              {label}範例
            </button>
          ))}
        </div>
        <div className="os-form-grid">
          <Field label="方案名稱" type="text" value={name} onChange={setName} />
          <Field
            label="變更原因"
            type="text"
            value={reason}
            onChange={setReason}
          />
          <Field
            label="起算月份（月初餘額）"
            type="month"
            value={a.startMonth}
            onChange={(v) => updateA("startMonth", v)}
          />
        </div>
        <details open>
          <summary>收入、資產與貸款（NTD）</summary>
          <div className="os-form-grid">
            {inputFields.map(([key, label]) => (
              <Field
                key={key}
                label={label}
                value={inputs[key]}
                onChange={(v) => updateInput(key, v)}
              />
            ))}
          </div>
        </details>
        <details>
          <summary>其他支出、負債與現金目標</summary>
          <div className="os-form-grid">
            {extraFields.map(([key, label]) => (
              <Field
                key={key}
                label={label}
                value={inputs[key]}
                onChange={(v) => updateInput(key, v)}
              />
            ))}
            <label className="os-field">
              收入穩定性
              <select
                value={inputs.incomeStability}
                onChange={(e) => updateInput("incomeStability", e.target.value)}
              >
                <option value="stable">穩定受薪</option>
                <option value="variableBonus">獎金波動</option>
                <option value="freelance">自營接案</option>
                <option value="unstable">收入不穩定</option>
              </select>
            </label>
          </div>
          <p>
            房產與本金供完整診斷參考；逐月 FIRE
            僅推估現金、投資及貸款付款，不模擬房價或負債本金變化。其他负債若有月付款，請填入其他固定月支出。
          </p>
        </details>
        <h3>退休與報酬假設</h3>
        <div className="os-form-grid">
          {[
            ["retirementAge", "退休年齡", 0],
            ["horizonAge", "推估至幾歲", 0],
            [
              "retirementMonthlyExpense",
              "退休每月生活支出（今日幣值、不含貸款）",
              0,
            ],
            ["annualReturnRate", "投資年化總報酬率 %（含股息）", -50],
            ["inflationRate", "年通膨率 %", 0],
            ["withdrawalRate", "起始提領率 %", 0.5],
            ["monthlyContribution", "工作期間基本月投入", 0],
            ["bonusMonth", "獎金與其他年度收入入帳月份", 1],
            ["bonusInvestmentPercent", "獎金可投入上限 %", 0],
            ["travelMonth", "年度旅遊付款月份", 1],
          ].map(([key, label, min]) => (
            <Field
              key={key}
              label={label}
              value={a[key]}
              min={min}
              onChange={(v) => updateA(key, v)}
            />
          ))}
        </div>
        <h3>轉職、自雇與壓力測試</h3>
        <div className="os-form-grid">
          <Field
            label="收入變更月份（可留空）"
            type="month"
            value={a.changeMonth}
            onChange={(v) => updateA("changeMonth", v)}
          />
          <Field
            label="收入空窗月數"
            value={a.breakMonths}
            onChange={(v) => updateA("breakMonths", v)}
          />
          <Field
            label="空窗後每月實領收入"
            value={a.newMonthlyIncome}
            onChange={(v) => updateA("newMonthlyIncome", v)}
          />
          <Field
            label="市場衝擊月份（可留空）"
            type="month"
            value={a.shockMonth}
            onChange={(v) => updateA("shockMonth", v)}
          />
          <Field
            label="投資組合一次跌幅 %"
            value={a.shockPercent}
            onChange={(v) => updateA("shockPercent", v)}
          />
        </div>
        <p>
          退休月份起停止薪資與年度獎金。空窗期間也不計獎金；其他年度收入沿用同一規則。退休生活費包含旅遊與保險等日常需求，貸款另計。投資以現金安全水位優先，貸款到期釋出金額可增加投入；不等同完整診斷的固定投入模型。
        </p>
        <div className="os-actions">
          <button className="primary-button" onClick={calculate}>
            計算情境
          </button>
          <button onClick={save} disabled={!result || dirty || !!storageError}>
            保存為新版本
          </button>
        </div>
        {result && dirty && (
          <p className="pending-note">
            輸入已變動，下方仍為前次計算；請重新計算後再保存。
          </p>
        )}
      </section>
      {result && (
        <>
          <section className="section" aria-label="情境結果">
            <h2>2. 查看計算結果</h2>
            <p>以下均為情境估算，不是達標機率，也不是保證收益。</p>
            <div className="os-metrics">
              <Metric
                title="退休時投資資產"
                value={money(result.retirementInvestments)}
                note="退休開始前、尚未扣第一期退休支出。"
              />
              <Metric
                title="退休目標資產"
                value={money(result.target)}
                note={`依通膨後年生活費 ÷ ${result.assumptions.withdrawalRate}% 計算；不含貸款，請一起檢查月表。`}
              />
              <Metric
                title="退休時與目標差距"
                value={money(result.retirementGap)}
                note="投資資產減目標資產；達標不代表終身不會耗盡。"
              />
              <Metric
                title="累積未支應支出"
                value={money(result.totalShortfall)}
                note={
                  result.firstShortfall
                    ? `${result.firstShortfall} 起出現不足，需調整收入、支出或退休時間。`
                    : "在這組假設與推估期間內，現金和投資足以支應支出。"
                }
              />
            </div>
            <ProjectionChart result={result} />
            <h3>報酬敏感度</h3>
            <div className="os-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>情境</th>
                    <th>年報酬</th>
                    <th>退休投資資產</th>
                    <th>未支應支出</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.label}>
                      <th>{v.label}</th>
                      <td>{v.annualReturnRate}%</td>
                      <td>{money(v.retirementInvestments)}</td>
                      <td>{money(v.totalShortfall)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted">
              敏感度只改年報酬 ±2 個百分點（界限 -50% 至
              50%）；其他已計算假設不變，包含你設定的衝擊事件。
            </p>
            <details>
              <summary>逐月現金流與投資明細</summary>
              <div className="os-table-wrap os-months">
                <table>
                  <thead>
                    <tr>
                      <th>月份</th>
                      <th>收入</th>
                      <th>支出</th>
                      <th>投入</th>
                      <th>模擬提領</th>
                      <th>現金</th>
                      <th>投資</th>
                      <th>未支應</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.months.map((m) => (
                      <tr key={m.month}>
                        <th>
                          {m.month}
                          {m.retired ? " 退休" : ""}
                        </th>
                        <td>{money(m.income)}</td>
                        <td>{money(m.expense)}</td>
                        <td>{money(m.contribution)}</td>
                        <td>{money(m.withdrawal)}</td>
                        <td>{money(m.cash)}</td>
                        <td>{money(m.investments)}</td>
                        <td>{money(m.shortfall)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
            <details>
              <summary>來源、完整輸入與計算版本</summary>
              <p>
                人工輸入 → 本機確定性計算；版本 {CALCULATION_VERSION}。輸入幣別
                NTD；年齡依起算月份對齊，未按生日精算。總報酬含股息，不再重複加入配息；未含稅費、長照、勞保勞退、交易摩擦與随机報酬序列。
              </p>
              <pre className="os-json">
                {JSON.stringify(
                  { inputs: result.inputs, assumptions: result.assumptions },
                  null,
                  2,
                )}
              </pre>
            </details>
          </section>
          <Portfolio amount={result.inputs.currentInvestmentAsset} />
        </>
      )}
      <section className="section">
        <h2>3. 保存與比較方案</h2>
        <p>
          每次保存建立新版本，保留前版及變更原因。不同起算月份或幣值的方案，不宜直接當作同時點績效比較。
        </p>
        {!records.revisions.length ? (
          <p>尚未保存方案。</p>
        ) : (
          <div className="os-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>方案與日期</th>
                  <th>退休年齡</th>
                  <th>退休投資</th>
                  <th>目標差距</th>
                  <th>未支應</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {records.revisions.map((r) => (
                  <tr key={r.id}>
                    <th>
                      {r.name}
                      <small>
                        {r.createdAt.slice(0, 10)} · 起算{" "}
                        {r.result.assumptions.startMonth}
                        <br />
                        {r.reason}
                      </small>
                    </th>
                    <td>{r.result.assumptions.retirementAge}</td>
                    <td>{money(r.result.retirementInvestments)}</td>
                    <td>{money(r.result.retirementGap)}</td>
                    <td>{money(r.result.totalShortfall)}</td>
                    <td>
                      <button onClick={() => load(r)}>載入</button>
                      <button
                        onClick={() =>
                          action(() => {
                            persist({ ...records, baselineId: r.id });
                            setMessage(
                              "已由你指定追蹤基準；既有實績仍保留其原版本關聯。",
                            );
                          })
                        }
                        disabled={records.baselineId === r.id || !!storageError}
                      >
                        {records.baselineId === r.id ? "目前基準" : "設為基準"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="section">
        <h2>4. 記錄月底實績</h2>
        <p>
          追蹤基準：{baseline?.name || "尚未選擇"}
          。只比較同月投資資產，不把新增投入誤稱為投資報酬。這不會改寫診斷資料。
        </p>
        <div className="os-form-grid">
          <Field
            label="已結束的月份"
            type="month"
            value={snapshotMonth}
            onChange={setSnapshotMonth}
          />
          <Field label="月底實際投資資產" value={actual} onChange={setActual} />
        </div>
        <button onClick={recordSnapshot} disabled={!baseline || !!storageError}>
          保存月底實績
        </button>
        <ul>
          {records.snapshots
            .filter((s) => s.revisionId === records.baselineId)
            .slice(-12)
            .map((s, i) => (
              <li key={`${s.createdAt}-${i}`}>
                {s.month}：實績 {money(s.actualInvestments)}；軌道偏差{" "}
                {money(snapshotDeviation(baseline, s)?.amount ?? null)}
              </li>
            ))}
        </ul>
      </section>
      {result && (
        <section className="section">
          <h2>5. 從計算結果整理內容</h2>
          <p>
            以下是本次已計算輸入的靜態現金流摘要，附來源與假設；不代表逐月退休推估。由你確認後複製，可用於
            Threads 或 Instagram；不會自動發布。
          </p>
          <textarea
            aria-label="可複製的財務內容草稿"
            readOnly
            value={buildFactDraft(result.inputs)}
            rows={9}
          />
          <button
            onClick={() =>
              action(() => {
                navigator.clipboard
                  .writeText(buildFactDraft(result.inputs))
                  .then(() => setMessage("已複製草稿，請確認內容再分享。"))
                  .catch(() => setError("複製失敗，請直接選取上方文字。"));
              })
            }
          >
            複製已驗算草稿
          </button>
        </section>
      )}
      <section className="section">
        <h2>資料備份與移轉</h2>
        <p>
          方案只在目前瀏覽器保存；更換裝置前請匯出。匯入會先檢查格式與計算結果，由你再次按鈕確認才取代本機方案。
        </p>
        <button onClick={exportBackup}>匯出 JSON 備份</button>
        <button onClick={() => setResetPending(true)}>
          封存後開始新的一組方案
        </button>
        {resetPending && (
          <div>
            <p>
              請先匯出目前備份。本操作會清空本機方案與實績，保留完整診斷資料；可用備份恢復。是否已下載備份並要清空？
            </p>
            <button
              onClick={() =>
                action(() => {
                  persist(emptyStore(), { replace: true });
                  setResetPending(false);
                  setParentId(null);
                  setMessage("已由你確認清空本機方案；備份可透過匯入恢復。");
                })
              }
            >
              已備份，確認清空方案
            </button>
            <button onClick={() => setResetPending(false)}>取消清空</button>
          </div>
        )}
        <label className="os-field">
          貼上備份 JSON
          <textarea
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value);
              setPendingImport(null);
            }}
            rows={3}
          />
        </label>
        <button
          onClick={() =>
            action(() => {
              setPendingImport(parseBackup(importText));
              setMessage("備份已驗證，請確認取代前先匯出目前資料。");
            })
          }
        >
          檢查匯入資料
        </button>
        {pendingImport && (
          <div>
            <p>
              將匯入 {pendingImport.revisions.length} 份方案與{" "}
              {pendingImport.snapshots.length} 筆實績，取代目前本機記錄。
            </p>
            <button
              onClick={() =>
                action(() => {
                  persist(pendingImport, { replace: true });
                  setPendingImport(null);
                  setImportText("");
                  setMessage("已由你確認完成匯入。");
                })
              }
            >
              確認取代本機方案
            </button>
            <button onClick={() => setPendingImport(null)}>取消</button>
          </div>
        )}
      </section>
    </div>
  );
}
