export const ROUTING_VERSION = 'risk-complexity-v1';
export function routeModel(task = {}, config = {}) {
  const dimensions = Object.fromEntries(['complexity', 'risk', 'uncertainty'].map(key => {
    const value = task[key] ?? 'low';
    if (!['low', 'medium', 'high'].includes(value)) throw new Error(`Invalid ${key}`);
    return [key, value];
  }));
  const high = dimensions.risk === 'high' || dimensions.uncertainty === 'high';
  const complex = dimensions.complexity !== 'low' || dimensions.risk === 'medium' || dimensions.uncertainty === 'medium';
  const tier = high ? 'high-end' : complex ? 'strong' : 'stable';
  const configured = high ? config.highEndModel : complex ? config.strongModel : config.stableModel || 'gpt-4.1-mini';
  const model = typeof configured === 'string' && configured.trim() ? configured.trim() : null;
  return { version: ROUTING_VERSION, ...dimensions, tier, model, requiresReview: high || !model,
    reason: !model ? 'Explicit model configuration required; no automatic escalation.' : high ? 'High risk or uncertainty requires human review.' : complex ? 'Configured stronger model for complex verification.' : 'Allowlisted text selection is simple and deterministically verifiable.' };
}
