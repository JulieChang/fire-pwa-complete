export default async function handler(req, res) {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).send("Missing code");
    }

    const response = await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.THREADS_APP_ID,
        client_secret: process.env.THREADS_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: "https://finops-planner.vercel.app/api/threads-token",
        code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Failed to exchange token",
        detail: data,
      });
    }

    return res.status(200).json({
      access_token: data.access_token,
      user_id: data.user_id,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected error",
      detail: error.message,
    });
  }
}
