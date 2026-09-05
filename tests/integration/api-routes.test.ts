// @vitest-environment node
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createMockApp } from '../helpers/testServer';

describe('Integration Tests: Express API Endpoints with Test Doubles', () => {
  const app = createMockApp();

  // Test 1: Health Check Endpoint
  describe('GET /api/health', () => {
    it('should return 200 with status ok and service metadata', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('journal-gemini-server');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  // Test 2: Reflection Endpoint (/api/reflect)
  describe('POST /api/reflect', () => {
    it('should reject requests with empty body (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/reflect')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('A prompt or journal entry content is required.');
    });

    it('should reject requests with missing prompt and empty entryContent (400)', async () => {
      const res = await request(app)
        .post('/api/reflect')
        .send({ prompt: '', entryContent: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should handle successful reflection query with valid prompt', async () => {
      const res = await request(app)
        .post('/api/reflect')
        .send({
          prompt: 'I completed all my focus goals for today.',
          entryTitle: 'Focused Afternoon',
          entryContent: 'Spent 3 hours coding without distractions.',
          mode: 'conversation',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reply).toBeDefined();
      expect(res.body.modelUsed).toBeDefined();
    });

    it('should simulate Gemini service failure gracefully (500)', async () => {
      const failingApp = createMockApp({
        mockGeminiError: new Error('Gemini API quota exceeded (429)'),
      });

      const res = await request(failingApp)
        .post('/api/reflect')
        .send({ prompt: 'Hello', entryContent: 'Some content' });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Gemini API quota exceeded');
    });
  });

  // Test 3: Personal Evolution Endpoint (/api/evolution)
  describe('POST /api/evolution', () => {
    it('should reject empty entries list (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/evolution')
        .send({ entries: [], timeRange: '30d' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('At least one journal reflection is required');
    });

    it('should reject missing entries field (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/evolution')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should calculate personal evolution with valid entries', async () => {
      const res = await request(app)
        .post('/api/evolution')
        .send({
          timeRange: '30d',
          entries: [
            {
              id: 'e1',
              title: 'Consistency',
              content: 'Practiced coding and walked 10,000 steps.',
              createdAt: Date.now() - 86400000,
            },
            {
              id: 'e2',
              title: 'Overcoming Obstacle',
              content: 'Debugged complex edge case and documented learning.',
              createdAt: Date.now(),
            },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.recurringThemes).toBeInstanceOf(Array);
      expect(res.body.data.goals).toBeInstanceOf(Array);
      expect(res.body.data.personalPatterns).toBeInstanceOf(Array);
      expect(res.body.data.growthAreas).toBeInstanceOf(Array);
      expect(res.body.data.keyEvolutionInsight).toBeDefined();
    });
  });

  // Test 4: Past Self Endpoint (/api/past-self)
  describe('POST /api/past-self', () => {
    it('should reject empty question (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/past-self')
        .send({ question: '' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Question is required to converse with your Past Self.');
    });

    it('should answer questions grounded in past entries', async () => {
      const res = await request(app)
        .post('/api/past-self')
        .send({
          question: 'What was my mindset when I started this project?',
          entries: [
            {
              id: 'init-1',
              title: 'Project Kickoff',
              content: 'Feeling both nervous and determined to see this through.',
              createdAt: Date.now() - 100000,
            },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reply).toBeDefined();
      expect(res.body.referencedEntries).toBeInstanceOf(Array);
    });
  });

  // Test 5: Suggest Memories Endpoint (/api/suggest-memories)
  describe('POST /api/suggest-memories', () => {
    it('should reject requests with neither entry content nor prior entries (400)', async () => {
      const res = await request(app)
        .post('/api/suggest-memories')
        .send({ entryContent: '', priorEntries: [] });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Journal entry content or historical entries are required');
    });

    it('should identify memory candidates from reflective journal content', async () => {
      const res = await request(app)
        .post('/api/suggest-memories')
        .send({
          entryTitle: 'Decisive Career Shift',
          entryContent:
            'Today I firmly committed to building my own product. This is a foundational milestone for me.',
          priorEntries: [],
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.suggestions).toBeInstanceOf(Array);
      if (res.body.suggestions.length > 0) {
        expect(res.body.suggestions[0].title).toBeDefined();
        expect(res.body.suggestions[0].category).toBeDefined();
      }
    });
  });

  // Test 6: Reflection Insight Endpoint (/api/reflection-insight)
  describe('POST /api/reflection-insight', () => {
    it('should reject requests without entry content or conversation history (400)', async () => {
      const res = await request(app)
        .post('/api/reflection-insight')
        .send({ entryContent: '', recentMessages: [] });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Entry content or recent conversation interaction is required');
    });

    it('should extract structured reflection intelligence', async () => {
      const res = await request(app)
        .post('/api/reflection-insight')
        .send({
          entryTitle: 'Evening Review',
          entryContent:
            'I realized that taking short walks between coding sessions drastically boosts clarity.',
          recentMessages: [
            { sender: 'user', text: 'How do I avoid afternoon brain fog?' },
            { sender: 'gemini', text: 'Physical movement and hydration help reset focus.' },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.insight).toBeDefined();
      expect(res.body.data.insight.theme).toBeDefined();
      expect(res.body.data.insight.keyInsight).toBeDefined();
    });
  });

  // Test 7: Non-existent Routes & Header Hygiene
  describe('Security & Sensitive Data Leakage Prevention', () => {
    it('should return 404 for unknown endpoints', async () => {
      const res = await request(app).get('/api/unimplemented-route');
      expect(res.status).toBe(404);
    });

    it('should never expose secret API keys in response headers or body', async () => {
      const res = await request(app).get('/api/health');
      const serialized = JSON.stringify({ headers: res.headers, body: res.body }).toLowerCase();
      expect(serialized).not.toContain('aizasy');
      expect(serialized).not.toContain('gemini_api_key');
    });
  });
});
