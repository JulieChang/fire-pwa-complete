import {
  CALCULATION_VERSION,
  SCHEMA_VERSION,
  simulateScenario,
  monthIndex,
} from "./planning.js";
export const PLAN_STORAGE_KEY = "finopsOperatingSystemV1";
export const emptyStore = () => ({
  schemaVersion: SCHEMA_VERSION,
  revisions: [],
  snapshots: [],
  baselineId: null,
});
const clone = (value) => JSON.parse(JSON.stringify(value));
export function saveRevision(state, record) {
  if (state.revisions.length >= 10)
    throw Error("最多保存 10 份版本；請先匯出備份。");
  if (!record.name?.trim() || !record.reason?.trim())
    throw Error("請填方案名稱與變更原因。");
  if (state.revisions.some((r) => r.id === record.id))
    throw Error("版本識別重複。");
  if (record.parentId && !state.revisions.some((r) => r.id === record.parentId))
    throw Error("找不到前一版。");
  return {
    ...state,
    revisions: [
      ...state.revisions,
      clone({
        ...record,
        parentId: record.parentId || null,
        name: record.name.trim().slice(0, 80),
        reason: record.reason.trim().slice(0, 500),
        inputVersion: record.id,
        calculationVersion: record.result.calculationVersion,
      }),
    ],
  };
}
export function snapshotDeviation(revision, snapshot) {
  if (!revision || !snapshot || revision.id !== snapshot.revisionId)
    return null;
  const row = revision.result.months.find((m) => m.month === snapshot.month);
  if (
    !row ||
    !Number.isFinite(snapshot.actualInvestments) ||
    snapshot.actualInvestments < 0
  )
    return null;
  return {
    amount: snapshot.actualInvestments - row.investments,
    planned: row.investments,
    actual: snapshot.actualInvestments,
    month: row.month,
  };
}
export function parseBackup(text) {
  let state;
  try {
    if (text.length > 5000000) throw Error();
    state = JSON.parse(text);
  } catch {
    throw Error("備份格式無效或超過 5 MB。");
  }
  if (state?.schemaVersion !== SCHEMA_VERSION)
    throw Error("不支援此備份版本。");
  if (
    !Array.isArray(state.revisions) ||
    state.revisions.length > 10 ||
    !Array.isArray(state.snapshots) ||
    state.snapshots.length > 120
  )
    throw Error("備份紀錄數量或格式無效。");
  const ids = new Set();
  for (const r of state.revisions) {
    if (
      typeof r.id !== "string" ||
      r.id.length > 100 ||
      ids.has(r.id) ||
      !r.name?.trim() ||
      r.name.length > 80 ||
      typeof r.reason !== "string" ||
      r.reason.length > 500 ||
      !Number.isFinite(Date.parse(r.createdAt))
    )
      throw Error("備份版本紀錄無效。");
    if (r.parentId && !ids.has(r.parentId)) throw Error("備份前版關係無效。");
    if (
      r.calculationVersion !== CALCULATION_VERSION ||
      r.result?.calculationVersion !== CALCULATION_VERSION
    )
      throw Error("此計算版本需以原版本檢視，不能自動重算覆蓋。");
    const expected = simulateScenario(r.result.inputs, r.result.assumptions);
    if (JSON.stringify(expected) !== JSON.stringify(r.result))
      throw Error("備份結果與計算版本不一致。");
    ids.add(r.id);
  }
  if (state.baselineId !== null && !ids.has(state.baselineId))
    throw Error("備份基準不存在。");
  for (const s of state.snapshots) {
    monthIndex(s.month);
    if (
      !ids.has(s.revisionId) ||
      !Number.isFinite(Date.parse(s.createdAt)) ||
      !snapshotDeviation(
        state.revisions.find((r) => r.id === s.revisionId),
        s,
      )
    )
      throw Error("備份實績無效。");
  }
  return clone(state);
}
