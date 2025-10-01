/**
 * Mock Chat Routes - For testing without using LLM tokens
 */

import { Router, Request, Response } from 'express';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { responseCacheService } from '../services/response-cache.service';

const router = Router();

// Mock HTML/CSS/JS responses
const mockResponses = {
  button: {
    html: '<button class="cta-button">Click Me!</button>',
    css: `.cta-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.cta-button:active {
  transform: translateY(0);
}`,
    js: `document.querySelector('.cta-button').addEventListener('click', () => {
  alert('Button clicked!');
});`,
    explanation: 'Created a beautiful gradient button with hover effects and click handler.',
    suggestions: ['Add more button variants', 'Add loading state', 'Add icon support']
  },
  
  landing: {
    html: `<div class="landing-page">
  <header class="hero">
    <h1 class="hero-title">Build Amazing Products</h1>
    <p class="hero-subtitle">The fastest way to create beautiful prototypes</p>
    <button class="cta-button">Get Started Free</button>
  </header>
  
  <section class="features">
    <div class="feature-card">
      <div class="feature-icon">🚀</div>
      <h3>Fast</h3>
      <p>Build prototypes in minutes, not hours</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">🎨</div>
      <h3>Beautiful</h3>
      <p>Modern designs that look professional</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">⚡</div>
      <h3>Easy</h3>
      <p>No coding required, just describe what you want</p>
    </div>
  </section>
</div>`,
    css: `:root {
  --primary: #667eea;
  --secondary: #764ba2;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.landing-page {
  min-height: 100vh;
}

.hero {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
  padding: 120px 20px;
  text-align: center;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 24px;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 48px;
  opacity: 0.9;
}

.cta-button {
  background: white;
  color: var(--primary);
  border: none;
  padding: 16px 48px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.cta-button:hover {
  transform: translateY(-2px);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  padding: 80px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  text-align: center;
  padding: 32px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 12px;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}`,
    js: `console.log('Landing page loaded!');

document.querySelector('.cta-button').addEventListener('click', () => {
  alert('Ready to get started!');
});`,
    explanation: 'Created a modern landing page with hero section and feature cards.',
    suggestions: ['Add pricing section', 'Add testimonials', 'Add footer', 'Add animations']
  }
};

/**
 * POST /api/chat/mock
 * Mock streaming endpoint for testing
 */
router.post('/mock', async (req: Request, res: Response) => {
  try {
    logger.info('Mock streaming chat request', { mode: req.body.mode });

    const runId = uuidv4();
    const threadId = uuidv4();
    const messageId = uuidv4();

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const sendEvent = (eventType: string, data: any) => {
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send RunStarted
    sendEvent('RunStarted', {
      type: 'RunStarted',
      threadId,
      runId,
      timestamp: new Date().toISOString()
    });

    // Try to find cached response first
    const message = req.body.message;
    let mockData = responseCacheService.findBestMatch(message);

    // Fallback to hardcoded mocks if no cache found
    if (!mockData) {
      logger.info('No cached response found, using fallback', { message: message.substring(0, 50) });
      const messageLower = message.toLowerCase();
      mockData = mockResponses.button; // default

      if (messageLower.includes('landing') || messageLower.includes('page')) {
        mockData = mockResponses.landing;
      }
    } else {
      logger.info('Using cached response', { message: message.substring(0, 50) });
    }

    // Send TextMessageStart
    sendEvent('TextMessageStart', {
      type: 'TextMessageStart',
      messageId,
      role: 'assistant',
      timestamp: new Date().toISOString()
    });

    // Stream explanation in chunks
    const explanation = mockData.explanation;
    const chunkSize = 20;
    for (let i = 0; i < explanation.length; i += chunkSize) {
      const chunk = explanation.substring(i, Math.min(i + chunkSize, explanation.length));
      
      sendEvent('TextMessageContent', {
        type: 'TextMessageContent',
        messageId,
        delta: chunk,
        timestamp: new Date().toISOString()
      });

      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Send TextMessageEnd
    sendEvent('TextMessageEnd', {
      type: 'TextMessageEnd',
      messageId,
      timestamp: new Date().toISOString()
    });

    // Send code_generated event
    sendEvent('Custom', {
      type: 'Custom',
      name: 'code_generated',
      value: mockData,
      timestamp: new Date().toISOString()
    });

    // Send RunFinished
    sendEvent('RunFinished', {
      type: 'RunFinished',
      threadId,
      runId,
      timestamp: new Date().toISOString()
    });

    res.end();

  } catch (error) {
    logger.error('Error in mock streaming chat', { error });
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ message: 'Internal server error' })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/chat/cached-responses
 * List all cached LLM responses
 */
router.get('/cached-responses', (req: Request, res: Response) => {
  try {
    const responses = responseCacheService.getAllResponses();
    res.json({
      count: responses.length,
      responses: responses.map(r => ({
        prompt: r.prompt,
        timestamp: r.timestamp,
        metadata: r.metadata
      }))
    });
  } catch (error) {
    logger.error('Error listing cached responses', { error });
    res.status(500).json({ error: 'Failed to list cached responses' });
  }
});

/**
 * DELETE /api/chat/cache
 * Clear all cached responses
 */
router.delete('/cache', (req: Request, res: Response) => {
  try {
    responseCacheService.clearCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    logger.error('Error clearing cache', { error });
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export default router;

