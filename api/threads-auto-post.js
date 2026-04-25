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

    if (!OPENAI_API_KEY || !THREADS_USER_ID || !THREADS_ACCESS_TOKEN) {
      return res.status(500).json({
        error: "Missing required environment variables.",
      });
    }

    const authHeader = req.headers.authorization;
    const querySecret = req.query.secret;

    if (
      CRON_SECRET &&
      authHeader !== `Bearer ${CRON_SECRET}` &&
      querySecret !== CRON_SECRET
    ) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const websiteUrl = "https://finops-planner.vercel.app";

    const prompt = `
你是 FinOps Planner Growth Agent。

請產出一篇適合發在 Threads 的繁體中文貼文，用來推廣網站：
${websiteUrl}

目標受眾：
台灣上班族、想財務自由、想投資、想旅行、想管理現金流的人。

貼文要求：
1. 繁體中文
2. 口吻自然，不要太像廣告
3. 300 字以內
4. 主題每天要有變化
5. 必須自然帶入「個人 FinOps」、「投資分配」、「旅遊基金」或「現金水位」其中至少兩個概念
6. 最後放上網站連結
7. 不要使用 Markdown 標題格式
8. 不要使用過多 emoji
`;

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      return res.status(500).json({
        error: "OpenAI API failed",
        detail: errorText,
      });
    }

    const aiData = await aiResponse.json();

    const postText =
      aiData.output_text ||
      aiData.output?.[0]?.content?.[0]?.text ||
      "";

    if (!postText) {
      return res.status(500).json({
        error: "No text generated from OpenAI.",
        aiData,
      });
    }

    const createContainerUrl = `https://graph.threads.net/v1.0/me/threads`;
    
    const containerParams = new URLSearchParams();
    containerParams.append("media_type", "TEXT");
    containerParams.append("text", postText);
    containerParams.append("access_token", THREADS_ACCESS_TOKEN);

    const containerResponse = await fetch(createContainerUrl, {
      method: "POST",
      body: containerParams,
    });

    const containerData = await containerResponse.json();

    if (!containerResponse.ok || !containerData.id) {
      return res.status(500).json({
        error: "Failed to create Threads media container.",
        detail: containerData,
        generatedText: postText,
      });
    }

    const publishUrl = `https://graph.threads.net/v1.0/me/threads_publish`;
    
    const publishParams = new URLSearchParams();
    publishParams.append("creation_id", containerData.id);
    publishParams.append("access_token", THREADS_ACCESS_TOKEN);

    const publishResponse = await fetch(publishUrl, {
      method: "POST",
      body: publishParams,
    });

    const publishData = await publishResponse.json();

    if (!publishResponse.ok) {
      return res.status(500).json({
        error: "Failed to publish Threads post.",
        detail: publishData,
        generatedText: postText,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Threads post published successfully.",
      generatedText: postText,
      containerId: containerData.id,
      publishResult: publishData,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected server error.",
      detail: error.message,
    });
  }
}
