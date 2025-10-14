/**
 * Database Migration Script
 * Run this to set up the database schema
 */

import pool from '../config/database';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

const runMigration = async () => {
  try {
    logger.info('Starting database migration...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Execute schema
    await pool.query(schema);
    
    logger.info('Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Database migration failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
};

runMigration();
