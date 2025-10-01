/**
 * Streaming Chat Routes - AG-UI Protocol Compatible
 * Uses Server-Sent Events (SSE) for streaming responses
 */

import { Router, Request, Response } from 'express';
import { ChatStreamService } from '../services/chat-stream.service';
import logger from '../utils/logger';

const router = Router();
const chatStreamService = new ChatStreamService();

/**
 * POST /api/chat/stream
 * Streaming chat endpoint using SSE
 */
router.post('/stream', async (req: Request, res: Response) => {
  try {
    logger.info('Streaming chat request received', {
      mode: req.body.mode,
      hasProjectId: !!req.body.projectId,
      historyLength: req.body.conversationHistory?.length || 0
    });

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Process the streaming request
    await chatStreamService.processStreamingMessage(req.body, res);

  } catch (error) {
    logger.error('Error in streaming chat', { error });
    
    // Send error event
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ message: 'Internal server error' })}\n\n`);
    res.end();
  }
});

export default router;

