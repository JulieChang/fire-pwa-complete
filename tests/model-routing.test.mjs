import test from 'node:test';
import assert from 'node:assert/strict';
import { routeModel } from '../src/model-routing.js';

test('simple verifiable tasks use the stable default', () => {
  assert.equal(routeModel({ complexity: 'low', risk: 'low', uncertainty: 'low' }).model, 'gpt-4.1-mini');
});
test('complexity needs explicitly configured stronger model', () => {
  assert.equal(routeModel({ complexity: 'high' }).requiresReview, true);
  assert.equal(routeModel({ complexity: 'high' }).model, null);
  assert.equal(routeModel({ complexity: 'high' }, { strongModel: 'configured-model' }).model, 'configured-model');
});
test('risk and uncertainty require explicit high-end configuration and human review', () => {
  for (const task of [{ risk: 'high' }, { uncertainty: 'high' }]) {
    assert.equal(routeModel(task).model, null);
    const route = routeModel(task, { highEndModel: 'configured-high' });
    assert.equal(route.model, 'configured-high');
    assert.equal(route.requiresReview, true);
  }
});
test('invalid routing dimensions are rejected instead of silently routing low', () => {
  assert.throws(() => routeModel({ risk: 'unknown' }), /risk/);
});
