import { useMemo, useState } from "react";

const websiteUrl = "https://finops-planner.vercel.app";

const topicGroups = [
  { key: "auto", name: "自動輪播今日主題" },
  { key: "money-management", name: "理財" },
  { key: "financial-planning", name: "財務規劃" },
  { key: "retirement-planning", name: "退休計劃" },
  { key: "financial-literacy", name: "財商" },
];

const variants = [
  { key: "auto", name: "自動 A/B 輪播" },
  { key: "A", name: "A版：共鳴痛點型" },
  { key: "B", name: "B版：專業洞察型" },
];

export default function GrowthAgent() {
  const [topicKey, setTopicKey] = useState("auto");
  const [variant, setVariant] = useState("auto");
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedTopic = useMemo(() => {
    return topicGroups.find((item) => item.key === topicKey);
  }, [topicKey]);

  const callAgent = async (action) => {
    try {
      setLoading(true);
      setResult("");

      const statusText = {
        preview: "正在產生預覽文案...",
        publish: "正在產生並發布 Threads...",
        "force-publish": "正在強制發布 Threads...",
        "refresh-token": "正在 refresh Threads token...",
      };

      setStatus(statusText[action] || "正在執行...");

      const response = await fetch("/api/threads-auto-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          topicKey,
          variant,
          secret,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("執行失敗");
        setResult(JSON.stringify(data, null, 2));
        return;
      }

      if (action === "refresh-token") {
        setStatus(
          data.refreshResult?.refreshed
            ? "Token refresh 成功"
            : "Token 未更新"
        );
        setResult(JSON.stringify(data.refreshResult, null, 2));
        return;
      }

      if (data.skipped) {
        setStatus("今天已經發布過，系統已避免重複發文");
        setResult(data.lastPostText || JSON.stringify(data, null, 2));
        return;
      }

      setStatus(
        action === "preview"
          ? `已產生預覽：${data.topic?.name || selectedTopic?.name} / ${data.variant}`
          : `已發布：${data.topic?.name || selectedTopic?.name} / ${data.variant}`
      );

      setResult(data.generatedText || JSON.stringify(data, null, 2));
    } catch (error) {
      setStatus("發生錯誤");
      setResult(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    alert("已複製內容！");
  };

  return (
    <div className="agent-card">
      <h2>AI Growth Agent</h2>

      <p className="agent-subtitle">
        每天自動產生一篇 Threads 短文，輪播理財、財務規劃、退休計劃與財商主題，並支援 Token refresh 與 A/B 文案測試。
      </p>

      <div className="agent-form">
        <label>今日發布主題</label>
        <select value={topicKey} onChange={(e) => setTopicKey(e.target.value)}>
          {topicGroups.map((topic) => (
            <option key={topic.key} value={topic.key}>
              {topic.name}
            </option>
          ))}
        </select>

        <label>A/B 文案版本</label>
        <select value={variant} onChange={(e) => setVariant(e.target.value)}>
          {variants.map((item) => (
            <option key={item.key} value={item.key}>
              {item.name}
            </option>
          ))}
        </select>

        <label>管理員 Secret</label>
        <input
          type="password"
          placeholder="輸入 Vercel 的 CRON_SECRET"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />

        <div className="agent-buttons">
          <button
            type="button"
            disabled={loading || !secret}
            onClick={() => callAgent("preview")}
          >
            只產生預覽
          </button>

          <button
            type="button"
            disabled={loading || !secret}
            onClick={() => callAgent("publish")}
          >
            產生並發布
          </button>

          <button
            type="button"
            disabled={loading || !secret}
            onClick={() => callAgent("force-publish")}
          >
            強制發布
          </button>

          <button
            type="button"
            disabled={loading || !secret}
            onClick={() => callAgent("refresh-token")}
          >
            Refresh Token
          </button>
        </div>
      </div>

      <div className="agent-note">
        <p>
          網站連結：<a href={websiteUrl}>{websiteUrl}</a>
        </p>
        <p>
          自動模式會每天只發一篇，避免同一天重複發文。若測試需要重發，才使用「強制發布」。
        </p>
      </div>

      {status && <p className="agent-status">{status}</p>}

      {result && (
        <div className="agent-output">
          <div className="agent-output-header">
            <h3>執行結果</h3>
            <button type="button" onClick={copyToClipboard}>
              複製內容
            </button>
          </div>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}
