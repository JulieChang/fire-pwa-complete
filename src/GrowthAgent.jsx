import { useMemo, useState } from "react";

const websiteUrl = "https://finops-planner.vercel.app";

const topicGroups = [
  {
    key: "auto",
    name: "自動輪播今日主題",
  },
  {
    key: "money-management",
    name: "理財",
  },
  {
    key: "financial-planning",
    name: "財務規劃",
  },
  {
    key: "retirement-planning",
    name: "退休計劃",
  },
  {
    key: "financial-literacy",
    name: "財商",
  },
];

export default function GrowthAgent() {
  const [topicKey, setTopicKey] = useState("auto");
  const [secret, setSecret] = useState("");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedTopic = useMemo(() => {
    return topicGroups.find((topic) => topic.key === topicKey);
  }, [topicKey]);

  const callAgent = async (action) => {
    try {
      setLoading(true);
      setStatus(
        action === "preview"
          ? "正在產生今日 Threads 短文..."
          : "正在產生並發布到 Threads..."
      );
      setResult("");

      const response = await fetch("/api/threads-auto-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          topicKey,
          secret,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("執行失敗");
        setResult(
          JSON.stringify(
            {
              error: data.error,
              detail: data.detail,
              generatedText: data.generatedText,
            },
            null,
            2
          )
        );
        return;
      }

      setStatus(
        action === "preview"
          ? `已產生短文：${data.topic?.name || selectedTopic?.name}`
          : `已發布到 Threads：${data.topic?.name || selectedTopic?.name}`
      );

      setResult(data.generatedText || "");
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
    alert("已複製貼文內容！");
  };

  return (
    <div className="agent-card">
      <h2>AI Growth Agent</h2>

      <p className="agent-subtitle">
        每天只產出一篇 Threads 短文，並輪流切換理財、財務規劃、退休計劃與財商主題。
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
            onClick={() => callAgent("preview")}
            disabled={loading || !secret}
          >
            只產生預覽
          </button>

          <button
            type="button"
            onClick={() => callAgent("publish")}
            disabled={loading || !secret}
          >
            產生並發布 Threads
          </button>
        </div>
      </div>

      <div className="agent-note">
        <p>
          網站連結：<a href={websiteUrl}>{websiteUrl}</a>
        </p>
        <p>建議日常使用：「只產生預覽」→ 確認內容 → 再手動發布。</p>
      </div>

      {status && <p className="agent-status">{status}</p>}

      {result && (
        <div className="agent-output">
          <div className="agent-output-header">
            <h3>今日 Threads 短文</h3>
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
