-- Add BA Mode columns to projects table

-- Add type column (default to 'prototype' for existing projects)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'prototype';

-- Add requirements column for BA mode
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS requirements TEXT;

-- Add comment
COMMENT ON COLUMN projects.type IS 'Project type: prototype or requirements';
COMMENT ON COLUMN projects.requirements IS 'Requirements document content for BA mode';
