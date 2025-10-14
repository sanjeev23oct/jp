/**
 * Create Database Script
 * Creates the 'jp' database if it doesn't exist
 */

import { Pool } from 'pg';
import logger from '../utils/logger';

const createDatabase = async () => {
  // Connect to postgres database to create jp database
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres', // Connect to default postgres database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    logger.info('Checking if database exists...');
    
    // Check if database exists
    const result = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'jp'"
    );
    
    if (result.rows.length === 0) {
      logger.info('Creating database jp...');
      await pool.query('CREATE DATABASE jp');
      logger.info('Database jp created successfully!');
    } else {
      logger.info('Database jp already exists');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    logger.error('Failed to create database', {
      error: error instanceof Error ? error.message : String(error)
    });
    await pool.end();
    process.exit(1);
  }
};

createDatabase();
