import React, { useEffect, useId, useState } from "react";
import "./money-input.css";

export const largeMoneyFields = new Set([
  "currentCash", "cashGoal", "currentInvestmentAsset", "currentTravelFund",
  "homeValue", "mortgageBalance", "personalLoanBalance", "otherDebt",
]);
export const nonMoneyFields = new Set([
  "age", "mortgageRemainingMonths", "personalLoanRemainingMonths", "dependents", "householdMembers",
]);

const display = (value, unit) => value === "" ? "" : String(Number(value) / unit);
const parse = (text, unit) => text === "" ? "" : Math.round(Number(text.replaceAll(",", "")) * unit * 100) / 100;

export default function MoneyInput({ label, value, onChange, defaultUnit = 1, className = "os-field", hint }) {
  const id = useId();
  const [unit, setUnit] = useState(defaultUnit);
  const [draft, setDraft] = useState(() => display(value, defaultUnit));
  useEffect(() => {
    if (parse(draft, unit) !== value) setDraft(display(value, unit));
  }, [value, unit]);
  const change = (event) => {
    const text = event.target.value.trim();
    // Accept plain decimals or correctly grouped pasted amounts; never reinterpret malformed numbers.
    if (!/^(?:\d*|\d{1,3}(?:,\d{3})+)(?:\.\d*)?$/.test(text) || text === ".") return;
    const amount = parse(text, unit);
    if (amount !== "" && (!Number.isFinite(amount) || amount > Number.MAX_SAFE_INTEGER / 100)) return;
    setDraft(text);
    onChange(amount);
  };
  return (
    <div className={`${className} money-field`}>
      <label htmlFor={id}>
        <span className="field-label">{label}</span>
        <input id={id} aria-label={label} aria-describedby={`${id}-amount`} type="text" inputMode="decimal"
          value={draft} onChange={change} onBlur={() => setDraft(display(value, unit))} />
      </label>
      <select aria-label={`${label}單位`} value={unit} onChange={(event) => {
        const next = Number(event.target.value);
        setUnit(next);
        setDraft(display(value, next));
      }}>
        <option value={1}>元</option>
        <option value={10000}>萬</option>
      </select>
      <small id={`${id}-amount`} className="money-confirmation">
        {value === "" ? "請輸入金額" : `${Number(value).toLocaleString("zh-TW", { maximumFractionDigits: 2 })} 元（新臺幣）`}
      </small>
      {hint && <small className="money-hint">{hint}</small>}
    </div>
  );
}
