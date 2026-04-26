const websiteUrl = "https://finops-planner.vercel.app";

const TOPICS = [
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
    audience: "想提升金錢觀、消費決策品質、財務判斷力的人",
    concepts: ["財商", "現金水位", "旅遊基金"],
  },
];

const REDIS_KEYS = {
  token: "threads:access_token",
  tokenUpdatedAt: "threads:token_updated_at",
  lastPostDate: "threads:last_post_date",
  lastPostText: "threads:last_post_text",
  lastPostTopic: "threads:last_post_topic",
  lastPostVariant: "threads:last_post_variant",
  posts: "threads:posts",
};

function getTaipeiDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getTopicByDate() {
  const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return TOPICS[dayNumber % TOPICS.length];
}

function getVariantByDate() {
  const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return dayNumber % 2 === 0 ? "A" : "B";
}

function getTopicFromRequest(req) {
  const topicKey = req.body?.topicKey || req.query?.topicKey;

  if (!topicKey || topicKey === "auto") {
    return getTopicByDate();
  }

  return TOPICS.find((topic) => topic.key === topicKey) || getTopicByDate();
}

function getVariantFromRequest(req) {
  const variant = req.body?.variant || req.query?.variant;

  if (!variant || variant === "auto") {
    return getVariantByDate();
  }

  return variant === "B" ? "B" : "A";
}

function isAuthorized(req, cronSecret) {
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

function buildTrackingUrl(topic, variant) {
  const date = getTaipeiDateString();
  const utmContent = `${topic.key}_${variant}_${date}`;

  return (
    `${websiteUrl}/?utm_source=threads` +
    `&utm_medium=social` +
    `&utm_campaign=finops_growth` +
    `&utm_content=${encodeURIComponent(utmContent)}`
  );
}

async function redisCommand(command, args = []) {
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;

  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const url = `${UPSTASH_REDIS_REST_URL}/${command}/${args
    .map((arg) => encodeURIComponent(String(arg)))
    .join("/")}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Redis command failed: ${JSON.stringify(data)}`);
  }

  return data.result;
}

async function redisGet(key) {
  return redisCommand("get", [key]);
}

async function redisSet(key, value) {
  return redisCommand("set", [key, value]);
}

async function getAccessToken() {
  const redisToken = await redisGet(REDIS_KEYS.token);
  return redisToken || process.env.THREADS_ACCESS_TOKEN;
}

async function saveAccessToken(token) {
  await redisSet(REDIS_KEYS.token, token);
  await redisSet(REDIS_KEYS.tokenUpdatedAt, new Date().toISOString());
}

async function refreshThreadsTokenIfNeeded(force = false) {
  const currentToken = await getAccessToken();

  if (!currentToken) {
    throw new Error("Missing Threads access token.");
  }

  const lastUpdatedAt = await redisGet(REDIS_KEYS.tokenUpdatedAt);
  const lastUpdatedTime = lastUpdatedAt ? new Date(lastUpdatedAt).getTime() : 0;

  const daysSinceUpdate = lastUpdatedTime
    ? (Date.now() - lastUpdatedTime) / (1000 * 60 * 60 * 24)
    : 999;

  if (!force && daysSinceUpdate < 7) {
    return {
      refreshed: false,
      token: currentToken,
      reason: "Token was refreshed recently.",
    };
  }

  const refreshUrl = new URL("https://graph.threads.net/refresh_access_token");
  refreshUrl.searchParams.set("grant_type", "th_refresh_token");
  refreshUrl.searchParams.set("access_token", currentToken);

  const response = await fetch(refreshUrl.toString(), {
    method: "GET",
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(`Threads token refresh failed: ${JSON.stringify(data)}`);
  }

  await saveAccessToken(data.access_token);

  return {
    refreshed: true,
    token: data.access_token,
    expiresIn: data.expires_in,
  };
}

async function generatePost({ topic, variant, trackingUrl }) {
  const style =
    variant === "A"
      ? "A版：開頭偏共鳴痛點，例如月光族、存不到錢、旅行預算失控。"
      : "B版：開頭偏專業洞察，例如現金流、資產配置、退休準備、財務安全感。";

  const prompt = `
你是 FinOps Planner Growth Agent，也是一位熟悉 Threads 社群經營的繁體中文內容策略顧問。

請產出一篇適合 Threads 的繁體中文短文，用來推廣網站：
${trackingUrl}

今日主題：
${topic.name}

目標受眾：
${topic.audience}

今天必須自然帶入以下概念中的至少兩個：
${topic.concepts.join("、")}

A/B 測試版本：
${style}

貼文要求：
1. 使用繁體中文
2. 口吻自然，像真實個人分享，不要太像廣告
3. 300 字以內
4. 一天只產出一篇短文
5. 開頭要吸引注意
6. 中間給 2 到 3 個簡單觀點
7. 結尾自然引導使用 FinOps Planner
8. 最後一定要放上這個追蹤連結：${trackingUrl}
9. 不要使用 Markdown 標題格式
10. 不要使用過多 emoji
11. 加上 3 到 5 個相關 hashtag
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API failed: ${text}`);
  }

  const data = await response.json();

  const text =
    data.output_text || data.output?.[0]?.content?.[0]?.text || "";

  if (!text) {
    throw new Error("OpenAI did not return generated text.");
  }

  return text.trim();
}

async function publishToThreads({ text, token }) {
  const createUrl = "https://graph.threads.net/v1.0/me/threads";

  const createParams = new URLSearchParams();
  createParams.append("media_type", "TEXT");
  createParams.append("text", text);
  createParams.append("access_token", token);

  const createResponse = await fetch(createUrl, {
    method: "POST",
    body: createParams,
  });

  const createData = await createResponse.json();

  if (!createResponse.ok || !createData.id) {
    return {
      ok: false,
      step: "create-container",
      detail: createData,
    };
  }

  const publishUrl = "https://graph.threads.net/v1.0/me/threads_publish";

  const publishParams = new URLSearchParams();
  publishParams.append("creation_id", createData.id);
  publishParams.append("access_token", token);

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
      containerId: createData.id,
    };
  }

  return {
    ok: true,
    containerId: createData.id,
    publishResult: publishData,
  };
}

  const createParams = new URLSearchParams();
  createParams.append("media_type", "TEXT");
  createParams.append("text", text);
  createParams.append("access_token", token);

  const createResponse = await fetch(createUrl, {
    method: "POST",
    body: createParams,
  });

  const createData = await createResponse.json();

  if (!createResponse.ok || !createData.id) {
    return {
      ok: false,
      step: "create-container",
      detail: createData,
    };
  }

  const publishUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`;

  const publishParams = new URLSearchParams();
  publishParams.append("creation_id", createData.id);
  publishParams.append("access_token", token);

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
      containerId: createData.id,
    };
  }

  return {
    ok: true,
    containerId: createData.id,
    publishResult: publishData,
  };
}

async function savePostRecord(record) {
  await redisCommand("lpush", [REDIS_KEYS.posts, JSON.stringify(record)]);
  await redisCommand("ltrim", [REDIS_KEYS.posts, 0, 49]);
}

async function getRecentPosts() {
  const posts = await redisCommand("lrange", [REDIS_KEYS.posts, 0, 9]);

  if (!Array.isArray(posts)) return [];

  return posts
    .map((item) => {
      try {
        return JSON.parse(item);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY." });
    }

    if (!isAuthorized(req, process.env.CRON_SECRET)) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const action = req.body?.action || req.query?.action || "publish";

    if (action === "recent-posts") {
      const posts = await getRecentPosts();

      return res.status(200).json({
        success: true,
        posts,
      });
    }

    if (action === "refresh-token") {
      const refreshResult = await refreshThreadsTokenIfNeeded(true);

      return res.status(200).json({
        success: true,
        action,
        refreshResult: {
          refreshed: refreshResult.refreshed,
          expiresIn: refreshResult.expiresIn,
          reason: refreshResult.reason,
        },
      });
    }

    const topic = getTopicFromRequest(req);
    const variant = getVariantFromRequest(req);
    const trackingUrl = buildTrackingUrl(topic, variant);
    const generatedText = await generatePost({
      topic,
      variant,
      trackingUrl,
    });

    if (action === "preview") {
      return res.status(200).json({
        success: true,
        mode: "preview",
        topic,
        variant,
        trackingUrl,
        generatedText,
      });
    }

    const today = getTaipeiDateString();
    const lastPostDate = await redisGet(REDIS_KEYS.lastPostDate);

    if (lastPostDate === today && action !== "force-publish") {
      return res.status(200).json({
        success: true,
        skipped: true,
        reason: "Already published today.",
        lastPostDate,
        lastPostText: await redisGet(REDIS_KEYS.lastPostText),
      });
    }

    const refreshResult = await refreshThreadsTokenIfNeeded(false);
    const token = refreshResult.token;

    const publishResult = await publishToThreads({
      text: generatedText,
      token,
    });

    if (!publishResult.ok) {
      return res.status(500).json({
        error: "Failed to publish Threads post.",
        step: publishResult.step,
        detail: publishResult.detail,
        generatedText,
      });
    }

    const record = {
      id: publishResult.publishResult?.id || publishResult.containerId,
      date: today,
      topic: topic.name,
      topicKey: topic.key,
      variant,
      trackingUrl,
      generatedText,
      containerId: publishResult.containerId,
      createdAt: new Date().toISOString(),
      status: "published",
    };

    await redisSet(REDIS_KEYS.lastPostDate, today);
    await redisSet(REDIS_KEYS.lastPostText, generatedText);
    await redisSet(REDIS_KEYS.lastPostTopic, topic.name);
    await redisSet(REDIS_KEYS.lastPostVariant, variant);
    await savePostRecord(record);

    return res.status(200).json({
      success: true,
      mode: action,
      taipeiDate: today,
      topic,
      variant,
      trackingUrl,
      tokenRefresh: {
        refreshed: refreshResult.refreshed,
        reason: refreshResult.reason,
        expiresIn: refreshResult.expiresIn,
      },
      generatedText,
      postRecord: record,
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
