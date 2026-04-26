const websiteUrl = "https://finops-planner.vercel.app";

const topicGroups = [
  {
    key: "money-management",
    name: "理財",
    audience: "想開始理財、存錢、管理每月收入的台灣上班族",
    concepts: ["個人 FinOps", "現金水位", "投資分配"],
  },
  {
    key: "financial-planning",
    name: "財務規劃",
    audience: "想建立預算、現金流、資產配置習慣的人",
    concepts: ["財務規劃", "現金水位", "旅遊基金"],
  },
  {
    key: "retirement-planning",
    name: "退休計劃",
    audience: "想提早準備退休、財務自由、長期投資的人",
    concepts: ["退休計劃", "投資分配", "個人 FinOps"],
  },
  {
    key: "financial-literacy",
    name: "財商",
    audience: "想提升金錢觀、財商、消費決策品質的人",
    concepts: ["財商", "現金水位", "旅遊基金"],
  },
];

function getTodayTopic() {
  const today = new Date();
  const dayNumber = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  return topicGroups[dayNumber % topicGroups.length];
}

function getTopicFromRequest(req) {
  const topicKey = req.body?.topicKey || req.query?.topicKey;

  if (!topicKey || topicKey === "auto") {
    return getTodayTopic();
  }

  return topicGroups.find((topic) => topic.key === topicKey) || getTodayTopic();
}

function checkAuthorization(req, cronSecret) {
  if (!cronSecret) return true;

  const authHeader = req.headers.authorization;
  const querySecret = req.query.secret;
  const bodySecret = req.body?.secret;

  return (
    authHeader === `Bearer ${cronSecret}` ||
    querySecret === cronSecret ||
    bodySecret === cronSecret
  );
}

async function generateThreadsPost({ apiKey, topic }) {
  const prompt = `
你是 FinOps Planner Growth Agent，也是一位熟悉 Threads 社群經營的繁體中文內容策略顧問。

請產出一篇適合發在 Threads 的繁體中文短文，用來推廣網站：
${websiteUrl}

今日主題群組：
${topic.name}

目標受眾：
${topic.audience}

今天必須自然帶入以下概念中的至少兩個：
${topic.concepts.join("、")}

貼文要求：
1. 使用繁體中文
2. 口吻自然、像真實個人分享，不要太像廣告
3. 內容 300 字以內
4. 一天只產出一篇短文
5. 開頭要有吸引注意的句子
6. 中間給 2 到 3 個簡單觀點
7. 結尾自然引導使用 FinOps Planner
8. 最後一定要放上網站連結：${websiteUrl}
9. 不要使用 Markdown 標題格式
10. 不要使用過多 emoji
11. 加上 3 到 5 個相關 hashtag
`;

  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    throw new Error(`OpenAI API failed: ${errorText}`);
  }

  const aiData = await aiResponse.json();

  const postText =
    aiData.output_text ||
    aiData.output?.[0]?.content?.[0]?.text ||
    "";

  if (!postText) {
    throw new Error("No text generated from OpenAI.");
  }

  return postText.trim();
}

async function publishToThreads({ threadsUserId, accessToken, text }) {
  const createContainerUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads`;

  const containerParams = new URLSearchParams();
  containerParams.append("media_type", "TEXT");
  containerParams.append("text", text);
  containerParams.append("access_token", accessToken);

  const containerResponse = await fetch(createContainerUrl, {
    method: "POST",
    body: containerParams,
  });

  const containerData = await containerResponse.json();

  if (!containerResponse.ok || !containerData.id) {
    return {
      ok: false,
      step: "create-container",
      detail: containerData,
    };
  }

  const publishUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`;

  const publishParams = new URLSearchParams();
  publishParams.append("creation_id", containerData.id);
  publishParams.append("access_token", accessToken);

  const publishResponse = await fetch(publishUrl, {
    method: "POST",
    body: publishParams,
  });

  const publishData = await publishResponse.json();

  if (!publishResponse.ok) {
    return {
      ok: false,
      step: "publish",
      detail: publishData,
      containerId: containerData.id,
    };
  }

  return {
    ok: true,
    containerId: containerData.id,
    publishResult: publishData,
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const {
      OPENAI_API_KEY,
      THREADS_USER_ID,
      THREADS_ACCESS_TOKEN,
      CRON_SECRET,
    } = process.env;

    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY.",
      });
    }

    const isAuthorized = checkAuthorization(req, CRON_SECRET);

    if (!isAuthorized) {
      return res.status(401).json({
        error: "Unauthorized. Please provide a valid secret.",
      });
    }

    const action =
      req.body?.action ||
      req.query?.action ||
      "publish";

    const topic = getTopicFromRequest(req);

    const generatedText = await generateThreadsPost({
      apiKey: OPENAI_API_KEY,
      topic,
    });

    if (action === "preview") {
      return res.status(200).json({
        success: true,
        mode: "preview",
        topic,
        generatedText,
      });
    }

    if (!THREADS_USER_ID || !THREADS_ACCESS_TOKEN) {
      return res.status(500).json({
        error: "Missing THREADS_USER_ID or THREADS_ACCESS_TOKEN.",
        generatedText,
      });
    }

    const publishResult = await publishToThreads({
      threadsUserId: THREADS_USER_ID,
      accessToken: THREADS_ACCESS_TOKEN,
      text: generatedText,
    });

    if (!publishResult.ok) {
      return res.status(500).json({
        error: "Failed to publish Threads post.",
        step: publishResult.step,
        detail: publishResult.detail,
        generatedText,
      });
    }

    return res.status(200).json({
      success: true,
      mode: "publish",
      message: "Threads post published successfully.",
      topic,
      generatedText,
      containerId: publishResult.containerId,
      publishResult: publishResult.publishResult,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected server error.",
      detail: error.message,
    });
  }
}
