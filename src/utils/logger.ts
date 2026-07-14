import winston from 'winston';
import 'winston-daily-rotate-file';

import { getConfig } from '../config/index.js';

const { combine, timestamp, errors, printf, colorize, json } = winston.format;

/** ─── Custom log format for console ───────────────────────── */
const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${String(ts)} [${level.toUpperCase()}] ${String(message)}${stack ? `\n${String(stack)}` : ''}${metaStr}`;
});

function buildLogger(): winston.Logger {
  const config = getConfig();
  const isDev = config.app.env === 'development';

  const transports: winston.transport[] = [
    /** Console — pretty in dev, JSON in production */
    new winston.transports.Console({
      level: config.log.level,
      format: isDev
        ? combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), consoleFormat)
        : combine(timestamp(), errors({ stack: true }), json()),
    }),
  ];

  /** Rotating file transports in non-test environments */
  if (config.app.env !== 'test') {
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: `${config.log.dir}/error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxFiles: config.log.maxFiles,
        maxSize: config.log.maxSize,
        format: combine(timestamp(), errors({ stack: true }), json()),
      }),
      new winston.transports.DailyRotateFile({
        filename: `${config.log.dir}/combined-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxFiles: config.log.maxFiles,
        maxSize: config.log.maxSize,
        format: combine(timestamp(), errors({ stack: true }), json()),
      }),
    );
  }

  return winston.createLogger({
    level: config.log.level,
    defaultMeta: { service: config.app.serviceName },
    transports,
    exceptionHandlers: [
      new winston.transports.Console({ format: combine(colorize(), timestamp(), consoleFormat) }),
    ],
    rejectionHandlers: [
      new winston.transports.Console({ format: combine(colorize(), timestamp(), consoleFormat) }),
    ],
    exitOnError: false,
  });
}

export const logger = buildLogger();

/** Context-aware child logger factory */
export function createLogger(context: string): winston.Logger {
  return logger.child({ context });
}
