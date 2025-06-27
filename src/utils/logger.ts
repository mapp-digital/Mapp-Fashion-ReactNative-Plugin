/**
 * Logger utility class for consistent logging throughout the application.
 * Provides different log levels with timestamp and optional file prefixes.
 * Logging is controlled via EXPO_PUBLIC_DRESSIPI_DEBUG environment variable.
 */
export class Log {
  /**
   * Singleton instance of the Log class
   */
  private static instance: Log;

  /**
   * Flag to determine if logging is enabled.
   */
  private isLoggingEnabled: boolean;

  /**
   * Private constructor to enforce singleton pattern.
   *
   * @param isLoggingEnabled Whether logging is enabled or not.
   */
  private constructor(isLoggingEnabled: boolean) {
    this.isLoggingEnabled = isLoggingEnabled;
  }

  /**
   * Initializes the Log class as a singleton.
   *
   * @param {boolean} isLoggingEnabled Whether logging is enabled or not.
   * @returns {Log} Singleton instance of Log.
   */
  public static init(isLoggingEnabled = false): Log {
    /**
     * Check if the Log instance already exists.
     * If it does not exist, create a new instance with
     * the provided logging flag.
     */
    if (!Log.instance) {
      Log.instance = new Log(isLoggingEnabled);
    }

    /**
     * Return the singleton instance of Log.
     * This ensures that all logging calls use the same instance,
     */
    return Log.instance;
  }

  /**
   * Formats the current timestamp in the required format [DD-MM-YYYY HH:MM:SS]
   * @returns {string} Formatted timestamp string
   */
  private formatTimestamp(): string {
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
  private formatMessage(message: string, prefix?: string): string {
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
  private formatArgs(...args: unknown[]): unknown[] {
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
   * Logs an info message using the instance configuration.
   * Private method that is not exposed publicly. Use the static method
   * Log.info instead.
   *
   * @param message Message to log
   * @param prefix Optional file or context prefix
   * @param args Additional arguments to log
   */
  private logInfoMessage(
    message: string,
    prefix?: string,
    ...args: unknown[]
  ): void {
    if (!this.isLoggingEnabled) return;

    const formattedMessage = this.formatMessage(message, prefix);
    const formattedArgs = this.formatArgs(...args);

    if (formattedArgs.length > 0) {
      console.info(formattedMessage, ...formattedArgs);
    } else {
      console.info(formattedMessage);
    }
  }

  /**
   * Logs an info message.
   *
   * @param message Message to log
   * @param prefix Optional file or context prefix
   * @param args Additional arguments to log
   */
  public static info(
    message: string,
    prefix?: string,
    ...args: unknown[]
  ): void {
    return Log.init().logInfoMessage(message, prefix, ...args);
  }

  /**
   * Logs a warning message using the instance configuration.
   * Private method that is not exposed publicly. Use the static method
   * Log.warn instead.
   *
   * @param message Message to log
   * @param prefix Optional file or context prefix
   * @param args Additional arguments to log
   */
  private logWarningMessage(
    message: string,
    prefix?: string,
    ...args: unknown[]
  ): void {
    if (!this.isLoggingEnabled) return;

    const formattedMessage = this.formatMessage(message, prefix);
    const formattedArgs = this.formatArgs(...args);

    if (formattedArgs.length > 0) {
      console.warn(formattedMessage, ...formattedArgs);
    } else {
      console.warn(formattedMessage);
    }
  }

  /**
   * Logs a warning message.
   *
   * @param message Message to log
   * @param prefix Optional file or context prefix
   * @param args Additional arguments to log
   */
  public static warn(
    message: string,
    prefix?: string,
    ...args: unknown[]
  ): void {
    return Log.init().logWarningMessage(message, prefix, ...args);
  }

  /**
   * Logs an error message using the instance configuration.
   * Private method that is not exposed publicly. Use the static method
   * Log.error instead.
   *
   * @param message Message to log
   * @param prefix Optional file or context prefix
   * @param args Additional arguments to log
   */
  private logErrorMessage(
    message: string,
    prefix?: string,
    ...args: unknown[]
  ): void {
    if (!this.isLoggingEnabled) return;

    const formattedMessage = this.formatMessage(message, prefix);
    const formattedArgs = this.formatArgs(...args);

    if (formattedArgs.length > 0) {
      console.error(formattedMessage, ...formattedArgs);
    } else {
      console.error(formattedMessage);
    }
  }

  /**
   * Logs an error message.
   *
   * @param message Message to log
   * @param prefix Optional file or context prefix
   * @param args Additional arguments to log
   */
  public static error(
    message: string,
    prefix?: string,
    ...args: unknown[]
  ): void {
    return Log.init().logErrorMessage(message, prefix, ...args);
  }
}
