/**
 * Chat Routes
 */

import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';

const router = Router();

// POST /api/chat - Send a chat message
router.post('/', chatController.sendMessage);

// POST /api/chat/summarize - Summarize conversation
router.post('/summarize', chatController.summarizeConversation);

export default router;

