<button
  onClick={() => {
    window.location.href =
      "https://threads.net/oauth/authorize?client_id=946279961323330&redirect_uri=https://finops-planner.vercel.app/api/threads-token&scope=threads_basic,threads_content_publish&response_type=code";
  }}
>
  連接 Threads（取得授權）
</button>
import { useState } from "react";

export default function GrowthAgent() {
  const [visitors, setVisitors] = useState("");
  const [topic, setTopic] = useState("財務自由、旅遊預算、股票投資分配");
  const [result, setResult] = useState("");

  const website = "https://finops-planner.vercel.app";

  const generateContent = () => {
    const todayVisitors = visitors || "尚未輸入";

    const output = `
# FinOps Planner Growth Agent 每日推廣包

網站：${website}
昨日訪客數：${todayVisitors}
今日主題：${topic}

---

## 1. Threads 貼文 1：痛點型

很多人不是不會存錢，而是不知道每個月的錢到底該怎麼分配。

生活費、投資、旅遊、房貸、保險全部混在一起，月底才發現現金水位又變低。

我做了一個免費工具，可以幫你試算每月收入應該如何分配到：

- 股票投資
- 現金水位
- 旅遊基金
- 生活預算

適合想財務自由，但又不想放棄生活品質的人。

免費試算：
${website}

---

## 2. Threads 貼文 2：情境型

假設你月收入 10 萬，每月想投資 1.5 萬，又想一年安排 1–2 次旅行。

真正的問題不是「可不可以花」，而是：

你的現金水位夠不夠？
旅遊基金會不會影響投資？
投資比例會不會壓縮生活品質？

我做了一個個人 FinOps 財務規劃工具，可以幫你快速試算。

免費使用：
${website}

---

## 3. Threads 貼文 3：互動型

你每個月會先把錢分配好嗎？

A. 會，投資和生活費都先分好  
B. 大概抓一下，沒有很精準  
C. 花到月底才知道剩多少  
D. 完全沒在分配  

我最近做了一個小工具，幫自己試算投資、現金、旅遊預算怎麼分配比較健康。

也分享給需要的人：
${website}

---

## 4. Facebook 社團貼文

分享一個我自己做的免費財務分配工具。

它不是記帳 App，而是幫你回答一個更實際的問題：

「我這個月的錢應該怎麼分配，才不會投資、旅遊、生活費互相打架？」

可以輸入月收入、固定支出、股票投資金額、旅遊目標與現金水位，系統會幫你估算目前配置是否健康。

適合：
- 想開始投資的上班族
- 想存旅遊基金的人
- 想財務自由但不想犧牲生活品質的人
- 想知道每月現金流是否安全的人

免費使用：
${website}

歡迎給我建議，我會持續優化功能。

---

## 5. LinkedIn 貼文

I recently built a simple personal finance planning tool inspired by FinOps thinking.

Instead of only tracking expenses, the tool helps users think about monthly allocation across:

- Stock investment
- Cash reserve
- Travel budget
- Living expenses
- Financial freedom planning

The idea is simple: personal finance should not only be about saving more, but also about making better allocation decisions.

Free tool:
${website}

---

## 6. SEO 文章題目

1. 月薪 10 萬如何分配投資、生活費與旅遊基金？
2. 個人 FinOps 是什麼？用企業成本管理思維規劃人生現金流
3. 旅遊基金怎麼存，才不會影響投資計畫？
4. 股票投資每月應該投入多少比例才合理？
5. 財務自由不是只靠省錢，而是靠現金流分配

---

## 7. 今日首頁優化建議

在首頁新增一個「月薪試算範例」區塊，例如：

月收入 NT$100,000  
固定支出 NT$45,000  
每月股票投資 NT$15,000  
旅遊基金 NT$8,000  
現金保留 NT$10,000  

這樣使用者會更快理解這個工具可以解決什麼問題。

---

## 8. 明日行動清單

1. Threads 發 3 篇短文
2. Facebook 社團發 1 篇分享文
3. 把今日 SEO 題目選 1 篇寫成首頁文章
4. 觀察哪一篇貼文帶來最多點擊
5. 明天調整文案角度
`;

    setResult(output);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    alert("已複製推廣內容！");
  };

  return (
    <div className="agent-card">
      <h2>AI Growth Agent</h2>
      <p className="agent-subtitle">
        每日自動產出 FinOps Planner 推廣內容，協助提升網站曝光。
      </p>

      <div className="agent-form">
        <label>昨日網站訪客數</label>
        <input
          type="number"
          placeholder="例如：35"
          value={visitors}
          onChange={(e) => setVisitors(e.target.value)}
        />

        <label>今日推廣主題</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <button onClick={generateContent}>產出今日推廣包</button>
      </div>

      {result && (
        <div className="agent-output">
          <div className="agent-output-header">
            <h3>今日推廣內容</h3>
            <button onClick={copyToClipboard}>複製全部</button>
          </div>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}
