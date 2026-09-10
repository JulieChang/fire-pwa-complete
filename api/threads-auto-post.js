import protectedHandler, { isAuthorized } from './threads-auto-post-protected.js';
import recentPostsHandler from './threads-recent-posts.js';

export { isAuthorized };

export function isReadOnlyAction(action) {
  return action === 'recent-posts';
}

export default async function handler(req, res) {
  const action = req.body?.action || req.query?.action || 'publish';

  if (isReadOnlyAction(action)) {
    return recentPostsHandler(req, res);
  }

  return protectedHandler(req, res);
}
