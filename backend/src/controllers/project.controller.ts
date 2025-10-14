/**
 * Project Controller
 * Handles HTTP requests for project management
 */

import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';
import logger from '../utils/logger';

/**
 * GET /api/projects
 * Get all projects
 */
export const getAllProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projects = await projectService.getAllProjects();
    res.json({ projects });
  } catch (error) {
    logger.error('Error in getAllProjects', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
};

/**
 * GET /api/projects/:id
 * Get project by ID
 */
export const getProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const project = await projectService.getProjectById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ project });
  } catch (error) {
    logger.error('Error in getProject', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
};

/**
 * POST /api/projects
 * Create new project
 */
export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = await projectService.createProject(req.body);
    res.status(201).json({ project });
  } catch (error) {
    logger.error('Error in createProject', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
};

/**
 * PUT /api/projects/:id
 * Update project
 */
export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const project = await projectService.updateProject(id, req.body);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ project });
  } catch (error) {
    logger.error('Error in updateProject', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
};

/**
 * DELETE /api/projects/:id
 * Delete project
 */
export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deleted = await projectService.deleteProject(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error in deleteProject', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
};

/**
 * POST /api/projects/:id/duplicate
 * Duplicate project
 */
export const duplicateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const project = await projectService.duplicateProject(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.status(201).json({ project });
  } catch (error) {
    logger.error('Error in duplicateProject', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
};

/**
 * GET /api/projects/:id/versions
 * Get project versions
 */
export const getVersions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const versions = await projectService.getVersions(id);
    res.json({ versions });
  } catch (error) {
    logger.error('Error in getVersions', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
};

/**
 * POST /api/projects/:id/versions
 * Create project version
 */
export const createVersion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const version = await projectService.createVersion(id, req.body);
    res.status(201).json({ version });
  } catch (error) {
    logger.error('Error in createVersion', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
};

/**
 * POST /api/versions/:id/restore
 * Restore version
 */
export const restoreVersion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const project = await projectService.restoreVersion(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    res.json({ project });
  } catch (error) {
    logger.error('Error in restoreVersion', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
};
