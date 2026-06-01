import { VERSION } from './_version.js';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

function resolveLevel(logLevel?: string): number {
  if (logLevel && logLevel.toUpperCase() in LOG_LEVELS) {
    return LOG_LEVELS[logLevel.toUpperCase() as LogLevel];
  }
  const env = typeof process !== 'undefined' && process.env?.RODIUMAI_LOG_LEVEL;
  if (env && env.toUpperCase() in LOG_LEVELS) {
    return LOG_LEVELS[env.toUpperCase() as LogLevel];
  }
  return LOG_LEVELS.WARNING;
}

export class RodiumAILogger {
  private level: number;

  constructor(logLevel?: string) {
    this.level = resolveLevel(logLevel);
  }

  private log(level: LogLevel, message: string, props: Record<string, unknown> = {}): void {
    if (LOG_LEVELS[level] < this.level) return;
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      logger: 'rodiumai',
      message,
      ...props,
    };
    if (typeof process !== 'undefined' && process.stderr) {
      process.stderr.write(JSON.stringify(entry) + '\n');
    }
  }

  debug(message: string, props?: Record<string, unknown>): void {
    this.log('DEBUG', message, props);
  }

  info(message: string, props?: Record<string, unknown>): void {
    this.log('INFO', message, props);
  }

  warning(message: string, props?: Record<string, unknown>): void {
    this.log('WARNING', message, props);
  }

  error(message: string, props?: Record<string, unknown>): void {
    this.log('ERROR', message, props);
  }

  logRequest(props: {
    requestId: string;
    model: string;
    endpoint: string;
    method: string;
    latencyMs: number;
    status: string;
    httpStatus: number;
    tokens?: { prompt: number; completion: number; total: number };
    retryCount?: number;
    streaming?: boolean;
    errorCode?: string | null;
  }): void {
    this.info(`${props.method} ${props.endpoint} -> ${props.httpStatus}`, {
      sdkVersion: VERSION,
      ...props,
      latencyMs: Math.round(props.latencyMs * 100) / 100,
    });
  }

  logAlert(alertType: string, message: string, props?: Record<string, unknown>): void {
    this.warning(`ALERT [${alertType}]: ${message}`, { alertType, ...props });
  }
}
