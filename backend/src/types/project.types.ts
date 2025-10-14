/**
 * Project Types
 */

export type ProjectType = 'prototype' | 'requirements';

export interface Project {
  id: string;
  name: string;
  description?: string;
  type: ProjectType;
  html: string;
  css: string;
  js: string;
  requirements?: string;
  thumbnail?: string;
  template?: string;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
  last_opened_at?: Date;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  html: string;
  css: string;
  js: string;
  description?: string;
  generation_prompt?: string;
  created_at: Date;
}

export interface CreateProjectRequest {
  name?: string;
  description?: string;
  type?: ProjectType;
  html?: string;
  css?: string;
  js?: string;
  requirements?: string;
  template?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  type?: ProjectType;
  html?: string;
  css?: string;
  js?: string;
  requirements?: string;
  thumbnail?: string;
  tags?: string[];
}

export interface CreateVersionRequest {
  description?: string;
  generation_prompt?: string;
}
