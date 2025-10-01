/**
 * Project Types for Lovable.dev Clone
 */

export interface Project {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  pages: Page[];
  assets: Asset[];
  settings: ProjectSettings;
}

export interface Page {
  id: string;
  name: string;
  path: string;
  html: string;
  css: string;
  js: string;
  isHomePage: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'icon' | 'font' | 'other';
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface ProjectSettings {
  viewport: 'mobile' | 'tablet' | 'desktop';
  theme: 'light' | 'dark';
  includeIndexedDB: boolean;
  sampleData?: any;
}

