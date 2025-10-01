/**
 * Surgical Edit Routes - API endpoints for targeted code modifications
 */

import { Router, Request, Response } from 'express';
import { SurgicalEditService } from '../services/surgical-edit.service';
import { getLLMProvider } from '../llm';

const router = Router();

/**
 * POST /api/surgical-edit
 * Generate and apply surgical edits to code
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { description, currentCode, selectedElement } = req.body;

    if (!description || !currentCode) {
      return res.status(400).json({
        error: 'Missing required fields: description and currentCode'
      });
    }

    // Get LLM provider
    const llm = getLLMProvider();
    const service = new SurgicalEditService(llm);

    // Generate surgical edits
    const editResponse = await service.generateSurgicalEdit({
      description,
      currentCode,
      selectedElement
    });

    // Apply edits
    const updatedCode = service.applyEdits(currentCode, editResponse.edits);

    res.json({
      success: true,
      updatedCode,
      edits: editResponse.edits,
      explanation: editResponse.explanation,
      editType: editResponse.editType
    });

  } catch (error: any) {
    console.error('Surgical edit error:', error);
    res.status(500).json({
      error: 'Failed to generate surgical edit',
      message: error.message
    });
  }
});

/**
 * POST /api/surgical-edit/stream
 * Stream surgical edits with real-time updates
 */
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const { description, currentCode, selectedElement } = req.body;

    if (!description || !currentCode) {
      return res.status(400).json({
        error: 'Missing required fields: description and currentCode'
      });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendEvent('start', { message: 'Analyzing edit request...' });

      const llm = getLLMProvider();
      const service = new SurgicalEditService(llm);

      sendEvent('progress', { message: 'Generating surgical edits...' });

      const editResponse = await service.generateSurgicalEdit({
        description,
        currentCode,
        selectedElement
      });

      sendEvent('edits', {
        edits: editResponse.edits,
        editType: editResponse.editType
      });

      sendEvent('progress', { message: 'Applying edits...' });

      const updatedCode = service.applyEdits(currentCode, editResponse.edits);

      sendEvent('complete', {
        updatedCode,
        explanation: editResponse.explanation,
        editType: editResponse.editType
      });

      res.end();

    } catch (error: any) {
      sendEvent('error', {
        message: error.message || 'Failed to generate surgical edit'
      });
      res.end();
    }

  } catch (error: any) {
    console.error('Surgical edit stream error:', error);
    res.status(500).json({
      error: 'Failed to start surgical edit stream',
      message: error.message
    });
  }
});

export default router;

