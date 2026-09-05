import express, { Request, Response } from 'express';

export const BASE_URL = 'http://localhost:3000';

/**
 * Creates an isolated mock Express app with the identical routes and validation logic
 * as server.ts, allowing controlled injection of Gemini and network failures for unit/resilience tests.
 */
export function createMockApp(options: {
  mockGeminiResponse?: string;
  mockGeminiError?: Error | null;
  mockModelUsed?: string;
} = {}) {
  const app = express();
  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'journal-gemini-server',
    });
  });

  // Reflection endpoint
  app.post('/api/reflect', async (req: Request, res: Response) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { prompt, entryContent = '' } = body;

    if (!prompt && !entryContent) {
      return res.status(400).json({
        error: 'A prompt or journal entry content is required.',
      });
    }

    if (options.mockGeminiError) {
      return res.status(500).json({
        success: false,
        error: options.mockGeminiError.message || 'Gemini service unavailable',
      });
    }

    return res.status(200).json({
      success: true,
      reply: options.mockGeminiResponse || 'This is a reflective response.',
      modelUsed: options.mockModelUsed || 'gemini-3.6-flash',
    });
  });

  // Evolution endpoint
  app.post('/api/evolution', async (req: Request, res: Response) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { entries = [] } = body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one journal reflection is required to calculate Personal Evolution.',
      });
    }

    if (options.mockGeminiError) {
      return res.status(500).json({
        success: false,
        error: options.mockGeminiError.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        timeRange: body.timeRange || '30d',
        calculatedAt: Date.now(),
        entryCount: entries.length,
        recurringThemes: [{ theme: 'Growth', frequency: 'High', description: 'Continuous self development' }],
        goals: [{ title: 'Mindfulness', status: 'progressing', details: 'Daily meditation' }],
        personalPatterns: [{ pattern: 'Evening writing', category: 'behavioral', observation: 'Writes at night', recurrence: 'Frequent' }],
        growthAreas: [{ area: 'Focus', type: 'progress', description: 'Deep focus improved', constructivePerspective: 'Keep steady' }],
        recentReflectionSynthesis: 'Consistent growth across reflections.',
        keyEvolutionInsight: 'Deep reflective clarity achieved.',
      },
      modelUsed: options.mockModelUsed || 'gemini-3.6-flash',
    });
  });

  // Past Self endpoint
  app.post('/api/past-self', async (req: Request, res: Response) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { question } = body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Question is required to converse with your Past Self.',
      });
    }

    if (options.mockGeminiError) {
      return res.status(500).json({
        success: false,
        error: options.mockGeminiError.message,
      });
    }

    return res.status(200).json({
      success: true,
      reply: 'Looking back at your past reflections, you valued resilience.',
      referencedEntries: [{ id: 'entry-1', title: 'Beginning', dateStr: 'Jan 1, 2026' }],
      modelUsed: options.mockModelUsed || 'gemini-3.6-flash',
    });
  });

  // Suggest Memories endpoint
  app.post('/api/suggest-memories', async (req: Request, res: Response) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { entryContent = '', priorEntries = [] } = body;

    if (!entryContent.trim() && (!Array.isArray(priorEntries) || priorEntries.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Journal entry content or historical entries are required to identify memory suggestions.',
      });
    }

    if (options.mockGeminiError) {
      return res.status(500).json({
        success: false,
        error: options.mockGeminiError.message,
      });
    }

    return res.status(200).json({
      success: true,
      suggestions: [
        {
          id: 'mem-sug-1',
          title: 'Career Shift Milestone',
          content: 'Decided to embark on a new learning curve.',
          category: 'Important Decision',
          reasoning: 'Represents a core directional shift.',
        },
      ],
      modelUsed: options.mockModelUsed || 'gemini-3.6-flash',
    });
  });

  // Reflection Insight endpoint
  app.post('/api/reflection-insight', async (req: Request, res: Response) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { entryContent = '', recentMessages = [] } = body;

    if (!entryContent.trim() && (!Array.isArray(recentMessages) || recentMessages.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Entry content or recent conversation interaction is required for reflection intelligence.',
      });
    }

    if (options.mockGeminiError) {
      return res.status(500).json({
        success: false,
        error: options.mockGeminiError.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        insight: {
          theme: 'Inner Peace',
          keyInsight: 'Calmness precedes effective problem-solving.',
          goalDetected: 'Maintain emotional balance under pressure',
          recurringPattern: 'Taking deep breaths before responding',
          suggestedMemory: 'Learned the value of composure',
          suggestedMemoryCategory: 'Personal Insight',
          generatedAt: Date.now(),
        },
      },
      modelUsed: options.mockModelUsed || 'gemini-3.6-flash',
    });
  });

  return app;
}
