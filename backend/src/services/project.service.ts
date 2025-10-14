/**
 * Project Service
 * Handles all project-related database operations
 */

import pool from '../config/database';
import logger from '../utils/logger';
import {
  Project,
  ProjectVersion,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateVersionRequest
} from '../types/project.types';

export class ProjectService {
  /**
   * Get all projects
   */
  async getAllProjects(): Promise<Project[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM projects ORDER BY updated_at DESC'
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get projects', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM projects WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Update last_opened_at
      await pool.query(
        'UPDATE projects SET last_opened_at = NOW() WHERE id = $1',
        [id]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get project', {
        id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Create new project
   */
  async createProject(data: CreateProjectRequest): Promise<Project> {
    try {
      const name = data.name || `Untitled Project - ${new Date().toLocaleDateString()}`;
      const type = data.type || 'prototype';
      const html = data.html || '';
      const css = data.css || '';
      const js = data.js || '';
      const requirements = data.requirements || null;
      
      const result = await pool.query(
        `INSERT INTO projects (name, description, type, html, css, js, requirements, template)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [name, data.description, type, html, css, js, requirements, data.template]
      );
      
      logger.info('Project created', { id: result.rows[0].id, name, type });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create project', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Update project
   */
  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project | null> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      if (data.html !== undefined) {
        updates.push(`html = $${paramIndex++}`);
        values.push(data.html);
      }
      if (data.css !== undefined) {
        updates.push(`css = $${paramIndex++}`);
        values.push(data.css);
      }
      if (data.js !== undefined) {
        updates.push(`js = $${paramIndex++}`);
        values.push(data.js);
      }
      if (data.type !== undefined) {
        updates.push(`type = $${paramIndex++}`);
        values.push(data.type);
      }
      if (data.requirements !== undefined) {
        updates.push(`requirements = $${paramIndex++}`);
        values.push(data.requirements);
      }
      if (data.thumbnail !== undefined) {
        updates.push(`thumbnail = $${paramIndex++}`);
        values.push(data.thumbnail);
      }
      if (data.tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(data.tags);
      }

      if (updates.length === 0) {
        return this.getProjectById(id);
      }

      values.push(id);
      const result = await pool.query(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Project updated', { id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update project', {
        id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM projects WHERE id = $1 RETURNING id',
        [id]
      );
      
      const deleted = result.rows.length > 0;
      if (deleted) {
        logger.info('Project deleted', { id });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Failed to delete project', {
        id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Duplicate project
   */
  async duplicateProject(id: string): Promise<Project | null> {
    try {
      const original = await this.getProjectById(id);
      if (!original) {
        return null;
      }

      const result = await pool.query(
        `INSERT INTO projects (name, description, html, css, js, template, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          `${original.name} (Copy)`,
          original.description,
          original.html,
          original.css,
          original.js,
          original.template,
          original.tags
        ]
      );

      logger.info('Project duplicated', { originalId: id, newId: result.rows[0].id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to duplicate project', {
        id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Create project version
   */
  async createVersion(projectId: string, data: CreateVersionRequest): Promise<ProjectVersion> {
    try {
      // Get current project state
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Create version
      const result = await pool.query(
        `INSERT INTO project_versions (project_id, html, css, js, description, generation_prompt)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [projectId, project.html, project.css, project.js, data.description, data.generation_prompt]
      );

      // Keep only last 10 versions
      await pool.query(
        `DELETE FROM project_versions
         WHERE project_id = $1
         AND id NOT IN (
           SELECT id FROM project_versions
           WHERE project_id = $1
           ORDER BY created_at DESC
           LIMIT 10
         )`,
        [projectId]
      );

      logger.info('Version created', { projectId, versionId: result.rows[0].id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create version', {
        projectId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get project versions
   */
  async getVersions(projectId: string): Promise<ProjectVersion[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM project_versions WHERE project_id = $1 ORDER BY created_at DESC LIMIT 10',
        [projectId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get versions', {
        projectId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Restore version
   */
  async restoreVersion(versionId: string): Promise<Project | null> {
    try {
      // Get version
      const versionResult = await pool.query(
        'SELECT * FROM project_versions WHERE id = $1',
        [versionId]
      );

      if (versionResult.rows.length === 0) {
        return null;
      }

      const version = versionResult.rows[0];

      // Create new version from current state before restoring
      await this.createVersion(version.project_id, {
        description: 'Before restore'
      });

      // Update project with version data
      const result = await pool.query(
        `UPDATE projects SET html = $1, css = $2, js = $3 WHERE id = $4 RETURNING *`,
        [version.html, version.css, version.js, version.project_id]
      );

      logger.info('Version restored', { versionId, projectId: version.project_id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to restore version', {
        versionId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

export const projectService = new ProjectService();
