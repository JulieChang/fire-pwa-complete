export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Missing code");
  }

  const {
    THREADS_APP_ID,
    THREADS_APP_SECRET,
    THREADS_REDIRECT_URI
  } = process.env;

  const params = new URLSearchParams();
  params.append("client_id", THREADS_APP_ID);
  params.append("client_secret", THREADS_APP_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("redirect_uri", THREADS_REDIRECT_URI);
  params.append("code", code);

  const response = await fetch("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    body: params
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(500).json({
      error: "Token exchange failed",
      detail: data
    });
  }

  return res.status(200).send(`
    <h2>Threads Token 取得成功</h2>

    <p>請複製以下內容到 Vercel Environment Variables：</p>

    <h3>THREADS_USER_ID</h3>
    <textarea style="width:100%;height:60px;">${data.user_id}</textarea>

    <h3>THREADS_ACCESS_TOKEN</h3>
    <textarea style="width:100%;height:160px;">${data.access_token}</textarea>

    <p style="color:red;">
      請不要截圖、不要分享這個頁面。
    </p>
  `);
}
