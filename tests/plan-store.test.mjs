import test from "node:test";
import assert from "node:assert/strict";
import * as store from "../src/plan-store.js";
import { defaultInputs } from "../src/finance.js";
import { simulateScenario, defaultAssumptions } from "../src/planning.js";
const result = () =>
  simulateScenario(defaultInputs, defaultAssumptions(defaultInputs));
test("manual save returns immutable revision with baseline predecessor", () => {
  const state = {
    schemaVersion: 1,
    revisions: [],
    snapshots: [],
    baselineId: null,
  };
  const r = result();
  const next = store.saveRevision(state, {
    id: "one",
    name: "基準",
    reason: "初始方案",
    createdAt: "2026-09-12T00:00:00Z",
    result: r,
  });
  assert.equal(state.revisions.length, 0);
  r.inputs.currentCash = 999;
  assert.equal(next.revisions[0].result.inputs.currentCash, 180000);
  const newer = store.saveRevision(next, {
    id: "two",
    name: "調整",
    reason: "提高投資",
    createdAt: "2026-09-12T00:00:00Z",
    parentId: "one",
    result: result(),
  });
  assert.equal(newer.revisions[1].parentId, "one");
});
test("snapshot compares exactly its referenced revision and calendar month", () => {
  const revision = { id: "one", result: result() };
  const month = revision.result.months[2];
  assert.equal(
    store.snapshotDeviation(revision, {
      revisionId: "one",
      month: month.month,
      actualInvestments: month.investments + 100,
    }).amount,
    100,
  );
  assert.equal(
    store.snapshotDeviation(revision, {
      revisionId: "other",
      month: month.month,
      actualInvestments: 0,
    }),
    null,
  );
  assert.equal(
    store.snapshotDeviation(revision, {
      revisionId: "one",
      month: "2025-01",
      actualInvestments: 0,
    }),
    null,
  );
});
test("backup rejects malformed, inconsistent calculated numbers and future schema", () => {
  assert.throws(() => store.parseBackup("{"), /備份/);
  assert.throws(
    () => store.parseBackup(JSON.stringify({ schemaVersion: 999 })),
    /版本/,
  );
  const state = store.saveRevision(
    { schemaVersion: 1, revisions: [], snapshots: [], baselineId: null },
    {
      id: "one",
      name: "基準",
      reason: "初始",
      createdAt: "2026-09-12T00:00:00Z",
      result: result(),
    },
  );
  assert.equal(store.parseBackup(JSON.stringify(state)).revisions.length, 1);
  state.revisions[0].result.months[0].investments = 0;
  assert.throws(() => store.parseBackup(JSON.stringify(state)), /結果/);
});
