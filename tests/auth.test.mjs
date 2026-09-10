import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { isAuthorized } from '../api/threads-auto-post.js';

const secret = 'test-cron-secret';

test('authorization fails when the configured secret is missing', () => {
  assert.equal(isAuthorized({ headers: {}, query: {}, body: {} }, ''), false);
});

test('authorization accepts the Vercel cron bearer token', () => {
  const req = {
    headers: { authorization: `Bearer ${secret}` },
    query: {},
    body: {},
  };

  assert.equal(isAuthorized(req, secret), true);
});

test('authorization accepts the existing manual query-secret flow', () => {
  const req = { headers: {}, query: { secret }, body: {} };

  assert.equal(isAuthorized(req, secret), true);
});

test('authorization rejects an incorrect secret', () => {
  const req = {
    headers: { authorization: 'Bearer wrong-secret' },
    query: { secret: 'wrong-secret' },
    body: { secret: 'wrong-secret' },
  };

  assert.equal(isAuthorized(req, secret), false);
});

test('recent-posts uses a dedicated read-only route while write actions stay protected', async () => {
  const config = JSON.parse(await fs.readFile('vercel.json', 'utf8'));
  const rule = config.rewrites?.find((item) =>
    item.source === '/api/threads-auto-post' &&
    item.has?.some((condition) =>
      condition.type === 'query' && condition.key === 'action' && condition.value === 'recent-posts'
    )
  );

  assert.ok(rule, 'recent-posts rewrite is required');
  assert.equal(rule.destination, '/api/threads-recent-posts');
  await fs.access('api/threads-recent-posts.js');
});
