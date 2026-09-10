import test from 'node:test';
import assert from 'node:assert/strict';
import { isAuthorized, requiresAuthorization } from '../api/threads-auto-post.js';

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

test('recent-posts is the only action that does not require authorization', () => {
  assert.equal(requiresAuthorization('recent-posts'), false);
  assert.equal(requiresAuthorization('publish'), true);
  assert.equal(requiresAuthorization('force-publish'), true);
  assert.equal(requiresAuthorization('preview'), true);
  assert.equal(requiresAuthorization('refresh-token'), true);
  assert.equal(requiresAuthorization('redis-health'), true);
});
