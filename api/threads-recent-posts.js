const POSTS_KEY = 'threads:posts';

async function getRecentPosts() {
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;

  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Recent posts storage is not configured.');
  }

  const baseUrl = UPSTASH_REDIS_REST_URL.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([['LRANGE', POSTS_KEY, '0', '9']]),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error('Unable to read recent posts.');
  }

  const items = data?.[0]?.result || [];
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      try {
        const post = JSON.parse(item);
        return {
          id: post.id,
          date: post.date,
          topic: post.topic,
          topicKey: post.topicKey,
          variant: post.variant,
          format: post.format,
          formatKey: post.formatKey,
          trackingUrl: post.trackingUrl,
          generatedText: post.generatedText,
          createdAt: post.createdAt,
          status: post.status,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const posts = await getRecentPosts();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ success: true, posts });
  } catch (error) {
    return res.status(500).json({
      error: 'Unable to load recent posts.',
      detail: error.message,
    });
  }
}
