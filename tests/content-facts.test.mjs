import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFactDraft, buildPublicFacts, renderPublicDraft, selectIntro } from '../src/content-facts.js';
import { generatePost } from '../api/threads-auto-post-protected.js';

test('public facts reproduce the default diagnosis and identify assumptions', () => {
  const facts = buildPublicFacts();
  assert.equal(facts.results.available, 15000);
  assert.equal(facts.results.fixedExpense, 33000);
  const text = renderPublicDraft(facts);
  for (const part of ['48,000', '33,000', '15,000', '96,000', '/diagnosis', '合成範例', '獎金不攤入']) assert.ok(text.includes(part), part);
});
test('local draft uses supplied input without implying public source reproducibility', () => {
  const text = buildFactDraft({ monthlyIncome: 1000 });
  assert.ok(text.includes('-32,000'));
  assert.ok(text.includes('本機輸入'));
  assert.ok(!text.includes('公開預設'));
});
test('unapproved claims, numbers and prototype keys cannot become an introduction', () => {
  for (const text of ['收益保證 20%', 'cash\n收益保證', '__proto__', 'constructor']) assert.equal(selectIntro(text).accepted, false);
  assert.equal(selectIntro('cash').accepted, true);
});
test('model output is only an intro key and usage/version metadata is captured', async () => {
  let request;
  const result = await generatePost({ trackingUrl: 'https://finops-planner.vercel.app/?utm_source=threads', fetchImpl: async (url, options) => {
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ output_text: 'cash', usage: { input_tokens: 17, output_tokens: 2, total_tokens: 19, secret: 'not-recorded' } }) };
  }});
  assert.equal(request.model, 'gpt-4.1-mini');
  assert.ok(!request.input.includes('48000'));
  assert.equal(result.generation.validation, 'allowlisted-intro');
  assert.equal(result.generation.usage.total_tokens, 19);
  assert.equal(result.generation.usage.secret, undefined);
  assert.ok(result.generation.sourceVersion);
});
test('untrusted or failed model response falls back to deterministic facts', async () => {
  for (const fetchImpl of [async () => ({ ok: true, json: async () => ({ output_text: '穩賺 100 萬' }) }), async () => { throw new Error('secret'); }]) {
    const result = await generatePost({ fetchImpl });
    assert.ok(!result.generatedText.includes('穩賺'));
    assert.ok(!JSON.stringify(result).includes('secret'));
    assert.ok(result.generatedText.includes('15,000'));
    assert.equal(result.generation.validation, 'deterministic-fallback');
  }
});
