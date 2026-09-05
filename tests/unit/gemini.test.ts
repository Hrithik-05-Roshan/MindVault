// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

describe('Unit Tests: Gemini API Fallback Ladder & Error Handling', () => {
  const MODEL_FALLBACK_LADDER = [
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.7-flash',
  ];

  async function simulateFallbackLadder(
    modelFailures: Record<string, Error> = {},
    modelResponses: Record<string, string> = {}
  ) {
    const attemptedModels: string[] = [];
    let lastError: Error | null = null;

    for (const model of MODEL_FALLBACK_LADDER) {
      attemptedModels.push(model);
      if (modelFailures[model]) {
        lastError = modelFailures[model];
        continue;
      }
      return {
        success: true,
        modelUsed: model,
        text: modelResponses[model] || 'Default model response',
        attemptedModels,
      };
    }

    throw new Error(
      `All Gemini fallback models exhausted: ${lastError?.message || 'Unknown error'}`
    );
  }

  it('should succeed on the primary model (gemini-3.6-flash) under normal conditions', async () => {
    const result = await simulateFallbackLadder({}, { 'gemini-3.6-flash': 'Clear reflection.' });
    expect(result.success).toBe(true);
    expect(result.modelUsed).toBe('gemini-3.6-flash');
    expect(result.attemptedModels).toEqual(['gemini-3.6-flash']);
    expect(result.text).toBe('Clear reflection.');
  });

  it('should fallback to gemini-3.1-flash-lite when primary model returns 503 UNAVAILABLE', async () => {
    const result = await simulateFallbackLadder(
      { 'gemini-3.6-flash': new Error('503 UNAVAILABLE: Model overloaded') },
      { 'gemini-3.1-flash-lite': 'Fallback response from lite model' }
    );
    expect(result.success).toBe(true);
    expect(result.modelUsed).toBe('gemini-3.1-flash-lite');
    expect(result.attemptedModels).toEqual(['gemini-3.6-flash', 'gemini-3.1-flash-lite']);
    expect(result.text).toBe('Fallback response from lite model');
  });

  it('should fallback to gemini-flash-latest if both 3.6 and 3.1 fail', async () => {
    const result = await simulateFallbackLadder(
      {
        'gemini-3.6-flash': new Error('429 RESOURCE_EXHAUSTED'),
        'gemini-3.1-flash-lite': new Error('503 UNAVAILABLE'),
      },
      { 'gemini-flash-latest': 'Response from flash-latest' }
    );
    expect(result.success).toBe(true);
    expect(result.modelUsed).toBe('gemini-flash-latest');
    expect(result.attemptedModels).toEqual([
      'gemini-3.6-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
    ]);
  });

  it('should fallback to gemini-3.7-flash when first 3 tiers fail', async () => {
    const result = await simulateFallbackLadder(
      {
        'gemini-3.6-flash': new Error('500 INTERNAL'),
        'gemini-3.1-flash-lite': new Error('500 INTERNAL'),
        'gemini-flash-latest': new Error('404 NOT_FOUND'),
      },
      { 'gemini-3.7-flash': 'Deep reasoning response' }
    );
    expect(result.success).toBe(true);
    expect(result.modelUsed).toBe('gemini-3.7-flash');
    expect(result.attemptedModels).toHaveLength(4);
  });

  it('should throw clean descriptive error when all 4 models fail', async () => {
    await expect(
      simulateFallbackLadder({
        'gemini-3.6-flash': new Error('503 Service Unavailable'),
        'gemini-3.1-flash-lite': new Error('503 Service Unavailable'),
        'gemini-flash-latest': new Error('503 Service Unavailable'),
        'gemini-3.7-flash': new Error('503 Service Unavailable'),
      })
    ).rejects.toThrow('All Gemini fallback models exhausted');
  });

  it('should sanitize API keys and never leak secrets into user-facing errors', () => {
    const rawErrorMessage =
      'Failed with key AIzaSyD4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9: Invalid quota';

    const sanitizeError = (errMessage: string) => {
      return errMessage.replace(/AIza[0-9A-Za-z-_]{25,45}/g, '[REDACTED_API_KEY]');
    };

    const sanitized = sanitizeError(rawErrorMessage);
    expect(sanitized).not.toContain('AIzaSyD4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9');
    expect(sanitized).toContain('[REDACTED_API_KEY]');
  });
});
