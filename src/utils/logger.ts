/**
 * Logger utility class for consistent logging throughout the application.
 * Provides different log levels with timestamp and optional file prefixes.
 */
export class Log {
  /**
   * Formats the current timestamp in the required format [DD-MM-YYYY HH:MM:SS]
   * @returns {string} Formatted timestamp string
   */
  private static formatTimestamp(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `[${day}-${month}-${year} ${hours}:${minutes}:${seconds}]`;
  }

  /**
   * Formats the message with timestamp and optional prefix
   * @param message The message to log
   * @param prefix Optional file or context prefix
   * @returns {string} Formatted message string
   */
  private static formatMessage(message: string, prefix?: string): string {
    const timestamp = this.formatTimestamp();
    const prefixPart = prefix ? ` [${prefix}]` : '';
    const messagePart = ` ${message}`;

    return `${timestamp}${prefixPart}${messagePart}`;
  }

  /**
   * Formats arguments for logging, handling JSON objects beautifully
   * @param args Arguments to format
   * @returns {unknown[]} Formatted arguments array
   */
  private static formatArgs(...args: unknown[]): unknown[] {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return arg;
        }
      }
      return arg;
    });
  }

  /**
   * Logs an info message
   * @param message Message to log
   * @param prefix Optional file or context prefix
   * @param args Additional arguments to log
   */
  static info(message: string, prefix?: string, ...args: unknown[]): void {
    const formattedMessage = this.formatMessage(message, prefix);
    const formattedArgs = this.formatArgs(...args);

    if (formattedArgs.length > 0) {
      console.info(formattedMessage, ...formattedArgs);
    } else {
      console.info(formattedMessage);
    }
  }

  /**
   * Logs a warning message
   * @param message Message to log
   * @param prefix Optional file or context prefix
   * @param args Additional arguments to log
   */
  static warn(message: string, prefix?: string, ...args: unknown[]): void {
    const formattedMessage = this.formatMessage(message, prefix);
    const formattedArgs = this.formatArgs(...args);

    if (formattedArgs.length > 0) {
      console.warn(formattedMessage, ...formattedArgs);
    } else {
      console.warn(formattedMessage);
    }
  }

  /**
   * Logs an error message
   * @param message Message to log
   * @param prefix Optional file or context prefix
   * @param args Additional arguments to log
   */
  static error(message: string, prefix?: string, ...args: unknown[]): void {
    const formattedMessage = this.formatMessage(message, prefix);
    const formattedArgs = this.formatArgs(...args);

    if (formattedArgs.length > 0) {
      console.error(formattedMessage, ...formattedArgs);
    } else {
      console.error(formattedMessage);
    }
  }

  /**
   * Logs a debug message
   * @param message Message to log
   * @param prefix Optional file or context prefix
   * @param args Additional arguments to log
   */
  static debug(message: string, prefix?: string, ...args: unknown[]): void {
    const formattedMessage = this.formatMessage(message, prefix);
    const formattedArgs = this.formatArgs(...args);

    if (formattedArgs.length > 0) {
      console.debug(formattedMessage, ...formattedArgs);
    } else {
      console.debug(formattedMessage);
    }
  }

  /**
   * Logs a trace message
   * @param message Message to log
   * @param prefix Optional file or context prefix
   * @param args Additional arguments to log
   */
  static trace(message: string, prefix?: string, ...args: unknown[]): void {
    const formattedMessage = this.formatMessage(message, prefix);
    const formattedArgs = this.formatArgs(...args);

    if (formattedArgs.length > 0) {
      console.trace(formattedMessage, ...formattedArgs);
    } else {
      console.trace(formattedMessage);
    }
  }

  /**
   * Logs a regular log message
   * @param message Message to log
   * @param prefix Optional file or context prefix
   * @param args Additional arguments to log
   */
  static log(message: string, prefix?: string, ...args: unknown[]): void {
    const formattedMessage = this.formatMessage(message, prefix);
    const formattedArgs = this.formatArgs(...args);

    if (formattedArgs.length > 0) {
      console.log(formattedMessage, ...formattedArgs);
    } else {
      console.log(formattedMessage);
    }
  }
}
