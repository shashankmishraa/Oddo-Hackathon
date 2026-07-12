type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
  }

  info(message: string, meta?: any) {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: any) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, error?: any, meta?: any) {
    const errorDetails = error instanceof Error ? error.stack || error.message : JSON.stringify(error);
    console.error(this.formatMessage('error', `${message} - Details: ${errorDetails}`, meta));
  }

  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatMessage('debug', message, meta));
    }
  }
}

export const logger = new Logger();
export default logger;
