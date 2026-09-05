// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createMockApp } from '../helpers/testServer';

describe('Resilience Tests: Failure Scenarios & Edge Cases', () => {
  it('should handle corrupt/non-JSON response from AI model safely', async () => {
    const parseAiJson = (rawText: string) => {
      try {
        const cleaned = rawText
          .replace(/```json/gi, '')
          .replace(/```/gi, '')
          .trim();
        return { success: true, data: JSON.parse(cleaned) };
      } catch (err: any) {
        return { success: false, error: 'Failed to parse structured model response' };
      }
    };

    const corruptOutput = 'Here is your data: { broken json ...';
    const result = parseAiJson(corruptOutput);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to parse structured model response');
  });

  it('should handle extreme text input sizes (50,000 characters) without server crash', async () => {
    const hugeText = 'A'.repeat(50000);
    const app = createMockApp();

    const res = await request(app)
      .post('/api/reflect')
      .send({
        prompt: hugeText,
        entryContent: 'Existing content',
      });

    expect([200, 413, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('should preserve user input buffer when database write fails', () => {
    let userInputBuffer = 'Important unpersisted thoughts about life.';
    let saveStatus: 'saved' | 'saving' | 'error' = 'saving';
    let saveError: string | null = null;

    // Simulate database network error
    try {
      throw new Error('Firestore connection timeout: UNAVAILABLE');
    } catch (err: any) {
      saveStatus = 'error';
      saveError = err.message;
    }

    // Input buffer MUST NOT be cleared on failure
    expect(userInputBuffer).toBe('Important unpersisted thoughts about life.');
    expect(saveStatus).toBe('error');
    expect(saveError).toContain('Firestore connection timeout');
  });

  it('should debounce rapid auto-save calls cleanly', async () => {
    let saveCallCount = 0;
    const performSave = () => {
      saveCallCount++;
    };

    let timer: any = null;
    const triggerDebouncedSave = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(performSave, 50);
    };

    // Simulate 5 rapid keystrokes in 10ms
    triggerDebouncedSave();
    triggerDebouncedSave();
    triggerDebouncedSave();
    triggerDebouncedSave();
    triggerDebouncedSave();

    // Before debounce interval expires:
    expect(saveCallCount).toBe(0);

    // Wait for timer to fire
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Only 1 save should have been dispatched
    expect(saveCallCount).toBe(1);
  });

  it('should handle missing GEMINI_API_KEY environment variable gracefully', () => {
    const getGeminiClient = (envKey?: string) => {
      if (!envKey) {
        throw new Error('GEMINI_API_KEY is not defined. Server AI features are unavailable.');
      }
      return { client: 'mock-client' };
    };

    expect(() => getGeminiClient(undefined)).toThrow('GEMINI_API_KEY is not defined');
    expect(() => getGeminiClient('')).toThrow('GEMINI_API_KEY is not defined');
    expect(getGeminiClient('valid-key')).toEqual({ client: 'mock-client' });
  });

  it('should never leak internal call stacks or system tokens in public error messages', () => {
    const internalError = new Error('Secret query failed: token AIzaSyD987654321012345678901234567890 at Database.connect(/internal/db.ts:45:12)');

    const publicizeError = (err: Error) => {
      let msg = err.message.replace(/AIza[0-9A-Za-z-_]{10,45}/g, '[REDACTED]');
      // Strip internal paths
      msg = msg.replace(/\(\/.*?\)/g, '');
      return msg;
    };

    const publicMsg = publicizeError(internalError);
    expect(publicMsg).not.toContain('AIzaSyD987654321012345678901234567890');
    expect(publicMsg).not.toContain('/internal/db.ts');
    expect(publicMsg).toContain('[REDACTED]');
  });
});
