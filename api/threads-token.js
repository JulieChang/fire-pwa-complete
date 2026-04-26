export default async function handler(req, res) {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).send("Missing code");
    }

    const {
      THREADS_APP_ID,
      THREADS_APP_SECRET,
    } = process.env;

    const redirectUri = "https://finops-planner.vercel.app/api/threads-token";

    if (!THREADS_APP_ID || !THREADS_APP_SECRET) {
      return res.status(500).json({
        error: "Missing THREADS_APP_ID or THREADS_APP_SECRET.",
      });
    }

    // Step 1: authorization code → short-lived token
    const shortTokenResponse = await fetch(
      "https://graph.threads.net/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: THREADS_APP_ID,
          client_secret: THREADS_APP_SECRET,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code,
        }),
      }
    );

    const shortTokenData = await shortTokenResponse.json();

    if (!shortTokenResponse.ok || !shortTokenData.access_token) {
      return res.status(500).json({
        error: "Failed to exchange authorization code for short-lived token.",
        detail: shortTokenData,
      });
    }

    const shortLivedToken = shortTokenData.access_token;
    const userId = shortTokenData.user_id;

    // Step 2: short-lived token → long-lived token
    const longTokenUrl = new URL("https://graph.threads.net/access_token");
    longTokenUrl.searchParams.set("grant_type", "th_exchange_token");
    longTokenUrl.searchParams.set("client_secret", THREADS_APP_SECRET);
    longTokenUrl.searchParams.set("access_token", shortLivedToken);

    const longTokenResponse = await fetch(longTokenUrl.toString(), {
      method: "GET",
    });

    const longTokenData = await longTokenResponse.json();

    if (!longTokenResponse.ok || !longTokenData.access_token) {
      return res.status(500).json({
        error: "Failed to exchange short-lived token for long-lived token.",
        shortLivedTokenData: {
          user_id: userId,
        },
        detail: longTokenData,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Long-lived Threads token generated successfully.",
      user_id: userId,
      access_token: longTokenData.access_token,
      token_type: longTokenData.token_type,
      expires_in_seconds: longTokenData.expires_in,
      expires_in_days: Math.floor(longTokenData.expires_in / 86400),
      next_step: {
        THREADS_USER_ID: userId,
        THREADS_ACCESS_TOKEN: longTokenData.access_token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected error.",
      detail: error.message,
    });
  }
}
