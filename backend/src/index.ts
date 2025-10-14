import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware';
import logger from './utils/logger';
import chatRoutes from './routes/chat.routes';
import chatStreamRoutes from './routes/chat-stream.routes';
import chatMockRoutes from './routes/chat-mock.routes';
import surgicalEditRoutes from './routes/surgical-edit.routes';
import projectRoutes from './routes/project.routes';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Lovable.dev Clone - Backend Ready',
    llmProvider: config.llm.provider,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/chat', chatMockRoutes); // Mock endpoint for testing (no LLM tokens)
app.use('/api/chat', chatStreamRoutes); // AG-UI streaming endpoint
app.use('/api/chat', chatRoutes); // Legacy non-streaming endpoint
app.use('/api/surgical-edit', surgicalEditRoutes); // Surgical edit endpoint
app.use('/api', projectRoutes); // Project management routes

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    nodeEnv: config.nodeEnv,
    llmProvider: config.llm.provider
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;

