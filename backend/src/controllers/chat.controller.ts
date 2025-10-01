/**
 * Chat Controller - Handles HTTP requests for chat functionality
 */

import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
import { ChatRequest } from '../types/chat.types';
import logger from '../utils/logger';

const chatService = new ChatService();

/**
 * POST /api/chat
 * Process a chat message
 */
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const chatRequest: ChatRequest = req.body;

    // Validate request
    if (!chatRequest.message || !chatRequest.mode) {
      return res.status(400).json({
        error: 'Missing required fields: message and mode'
      });
    }

    logger.info('Chat request received', {
      mode: chatRequest.mode,
      hasProjectId: !!chatRequest.projectId,
      historyLength: chatRequest.conversationHistory?.length || 0
    });

    const response = await chatService.processMessage(chatRequest);

    res.json(response);
  } catch (error) {
    logger.error('Error in chat controller', { error });
    next(error);
  }
};

/**
 * POST /api/chat/summarize
 * Summarize a conversation
 */
export const summarizeConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Missing or invalid messages array'
      });
    }

    const summary = await chatService.summarizeConversation(messages);

    res.json({ summary });
  } catch (error) {
    logger.error('Error summarizing conversation', { error });
    next(error);
  }
};

