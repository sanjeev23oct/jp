/**
 * Project Routes
 */

import { Router } from 'express';
import * as projectController from '../controllers/project.controller';

const router = Router();

// Project CRUD - mounted at /api/projects
router.get('/projects', projectController.getAllProjects);
router.post('/projects', projectController.createProject);
router.get('/projects/:id', projectController.getProject);
router.put('/projects/:id', projectController.updateProject);
router.delete('/projects/:id', projectController.deleteProject);

// Project actions
router.post('/projects/:id/duplicate', projectController.duplicateProject);

// Version management
router.get('/projects/:id/versions', projectController.getVersions);
router.post('/projects/:id/versions', projectController.createVersion);
router.post('/versions/:id/restore', projectController.restoreVersion);

export default router;
