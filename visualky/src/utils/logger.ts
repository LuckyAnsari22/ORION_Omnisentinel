/**
 * LocalLens Logger Utility
 * Provides structured logging for debugging and monitoring
 */

const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
} as const;

type LogLevel = typeof LogLevel[keyof typeof LogLevel];

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  component: string;
  message: string;
  data?: Record<string, any>;
}

class Logger {
  private logs: LogEntry[] = [];
  private isDevelopment = import.meta.env.DEV;
  private maxLogs = 1000;

  private log(level: LogLevel, component: string, message: string, data?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      component,
      message,
      data,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    if (this.isDevelopment) {
      const style = this.getConsoleStyle(level);
      console.log(
        `%c[${level}] ${component}`,
        style,
        message,
        data ? { ...data } : ''
      );
    }

    // Store in localStorage for debugging
    try {
      const allLogs = this.getAllLogs();
      localStorage.setItem('locallens-logs', JSON.stringify(allLogs));
    } catch (e) {
      // Storage full or disabled, ignore
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: 'color: #888; font-weight: normal;',
      [LogLevel.INFO]: 'color: #0066cc; font-weight: normal;',
      [LogLevel.WARN]: 'color: #ff9900; font-weight: bold;',
      [LogLevel.ERROR]: 'color: #ff0000; font-weight: bold;',
      [LogLevel.SUCCESS]: 'color: #00aa00; font-weight: bold;',
    };
    return styles[level];
  }

  debug(component: string, message: string, data?: Record<string, any>) {
    this.log(LogLevel.DEBUG, component, message, data);
  }

  info(component: string, message: string, data?: Record<string, any>) {
    this.log(LogLevel.INFO, component, message, data);
  }

  warn(component: string, message: string, data?: Record<string, any>) {
    this.log(LogLevel.WARN, component, message, data);
  }

  error(component: string, message: string, error?: Error, data?: Record<string, any>) {
    this.log(LogLevel.ERROR, component, message, {
      ...data,
      errorMessage: error?.message,
      errorStack: error?.stack,
    });
  }

  success(component: string, message: string, data?: Record<string, any>) {
    this.log(LogLevel.SUCCESS, component, message, data);
  }

  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('locallens-logs');
    } catch (e) {
      // Ignore
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  getPerformanceMetrics() {
    const componentMetrics: Record<string, { count: number; levels: Record<LogLevel, number> }> = {};

    for (const log of this.logs) {
      if (!componentMetrics[log.component]) {
        componentMetrics[log.component] = {
          count: 0,
          levels: {
            [LogLevel.DEBUG]: 0,
            [LogLevel.INFO]: 0,
            [LogLevel.WARN]: 0,
            [LogLevel.ERROR]: 0,
            [LogLevel.SUCCESS]: 0,
          },
        };
      }
      componentMetrics[log.component].count++;
      componentMetrics[log.component].levels[log.level]++;
    }

    return componentMetrics;
  }
}

export const logger = new Logger();

export type { LogLevel };
export { LogLevel as LogLevelEnum };
export default logger;
