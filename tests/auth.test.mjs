import test from 'node:test';
import assert from 'node:assert/strict';
import { isAuthorized, isReadOnlyAction } from '../api/threads-auto-post.js';

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

test('recent-posts is the only read-only action routed outside protected publishing logic', () => {
  assert.equal(isReadOnlyAction('recent-posts'), true);
  assert.equal(isReadOnlyAction('publish'), false);
  assert.equal(isReadOnlyAction('force-publish'), false);
  assert.equal(isReadOnlyAction('preview'), false);
  assert.equal(isReadOnlyAction('refresh-token'), false);
  assert.equal(isReadOnlyAction('redis-health'), false);
});
