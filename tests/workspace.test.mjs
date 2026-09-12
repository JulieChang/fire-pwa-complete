import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

// DOM integration test, not a browser/visual test. No external network requests.
test("manual workflow: four cards, dirty guard, save, snapshot, recovery import and archive", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://finops.test/",
  });
  for (const [key, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    localStorage: dom.window.localStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
  }))
    Object.defineProperty(globalThis, key, {
      value,
      writable: true,
      configurable: true,
    });
  const React = await import("react");
  const { createRoot } = await import("react-dom/client");
  const dir = await mkdtemp(path.join(process.cwd(), ".ui-test-"));
  let root;
  try {
    const output = path.join(dir, "workspace.mjs");
    await build({
      entryPoints: ["src/Workspace.jsx"],
      outfile: output,
      bundle: true,
      format: "esm",
      platform: "node",
      external: ["react"],
      loader: { ".css": "empty" },
      logLevel: "silent",
    });
    const { DailyDashboard, PlanningWorkspace } = await import(
      pathToFileURL(output)
    );
    const mount = async (Component) => {
      if (root) await React.act(async () => root.unmount());
      root = createRoot(document.getElementById("root"));
      await React.act(async () => root.render(React.createElement(Component)));
    };
    const click = async (text) => {
      const button = [...document.querySelectorAll("button")].find(
        (b) => b.textContent === text,
      );
      assert.ok(button, `button ${text}`);
      assert.equal(button.disabled, false, `${text} enabled`);
      await React.act(async () => button.click());
    };
    const fill = async (label, value) => {
      const wrapper = [...document.querySelectorAll("label")].find(
        (l) =>
          l.querySelector("span")?.textContent === label ||
          l.firstChild?.textContent === label,
      );
      const el = wrapper?.querySelector("input,textarea");
      assert.ok(el, `field ${label}`);
      const proto =
        el.tagName === "TEXTAREA"
          ? dom.window.HTMLTextAreaElement.prototype
          : dom.window.HTMLInputElement.prototype;
      await React.act(async () => {
        Object.getOwnPropertyDescriptor(proto, "value").set.call(
          el,
          String(value),
        );
        el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        el.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
      });
    };
    await mount(DailyDashboard);
    assert.equal(document.querySelectorAll(".os-metric").length, 4);
    assert.match(document.body.textContent, /尚未建立/);
    await mount(PlanningWorkspace);
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
    }).format(new Date());
    const [y, m] = today.split("-").map(Number);
    const prev = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`;
    await fill("起算月份（月初餘額）", prev);
    await click("計算情境");
    await click("保存為新版本");
    assert.equal(
      JSON.parse(localStorage.getItem("finopsOperatingSystemV1")).revisions
        .length,
      1,
    );
    await fill("每月實領收入", "50000");
    assert.equal(
      [...document.querySelectorAll("button")].find(
        (b) => b.textContent === "保存為新版本",
      ).disabled,
      true,
    );
    await click("設為基準");
    await fill("已結束的月份", prev);
    await fill("月底實際投資資產", "350000");
    await click("保存月底實績");
    const backup = localStorage.getItem("finopsOperatingSystemV1");
    assert.equal(JSON.parse(backup).snapshots.length, 1);
    await mount(DailyDashboard);
    assert.match(
      document.querySelectorAll(".os-metric")[3].textContent,
      new RegExp(prev),
    );
    localStorage.setItem("finopsOperatingSystemV1", "{corrupt");
    await mount(PlanningWorkspace);
    assert.match(document.body.textContent, /未能讀取已存方案/);
    await fill("貼上備份 JSON", backup);
    await click("檢查匯入資料");
    await click("確認取代本機方案");
    assert.equal(
      JSON.parse(localStorage.getItem("finopsOperatingSystemV1")).revisions
        .length,
      1,
    );
    assert.equal(document.querySelector('[role="alert"]'), null);
    await click("封存後開始新的一組方案");
    await click("取消清空");
    assert.equal(
      JSON.parse(localStorage.getItem("finopsOperatingSystemV1")).revisions
        .length,
      1,
    );
    await click("封存後開始新的一組方案");
    await click("已備份，確認清空方案");
    assert.equal(
      JSON.parse(localStorage.getItem("finopsOperatingSystemV1")).revisions
        .length,
      0,
    );
  } finally {
    if (root) await React.act(async () => root.unmount());
    await rm(dir, { recursive: true, force: true });
    dom.window.close();
  }
});
