import winston from 'winston';
import { config } from '../config';

/**
 * Safe JSON stringifier that handles circular references
 */
function safeStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0) {
            try {
              msg += ` ${safeStringify(meta)}`;
            } catch (e) {
              msg += ` [Error stringifying meta: ${e instanceof Error ? e.message : String(e)}]`;
            }
          }
          return msg;
        })
      )
    })
  ]
});

export default logger;

