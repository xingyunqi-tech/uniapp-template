/**
 * 统一日志工具
 * 支持多种日志级别，可配置输出方式
 */

/** 日志级别 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/** 日志配置 */
interface LoggerConfig {
  /** 最小日志级别 */
  level: LogLevel;
  /** 是否输出到控制台 */
  console: boolean;
  /** 是否保存到本地存储 */
  storage: boolean;
  /** 日志前缀 */
  prefix: string;
  /** 最大存储日志数量 */
  maxStorageLogs: number;
}

/** 日志条目 */
interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  data?: unknown;
}

/** 默认配置 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.DEBUG,
  console: true,
  storage: false,
  prefix: '[App]',
  maxStorageLogs: 100,
};

/**
 * Logger 类
 */
class Logger {
  private config: LoggerConfig;
  private readonly STORAGE_KEY = 'app_logs';

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 更新配置
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `${this.config.prefix} [${timestamp}] [${level}] ${message}`;
  }

  /**
   * 保存日志到本地存储
   */
  private saveToStorage(entry: LogEntry): void {
    if (!this.config.storage) return;

    try {
      const logsRaw = uni.getStorageSync(this.STORAGE_KEY);
      const logs: LogEntry[] = logsRaw ? JSON.parse(logsRaw) : [];

      logs.push(entry);

      // 限制日志数量
      while (logs.length > this.config.maxStorageLogs) {
        logs.shift();
      }

      uni.setStorageSync(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save log to storage:', error);
    }
  }

  /**
   * 通用日志方法
   */
  private log(level: LogLevel, levelName: string, message: string, ...data: unknown[]): void {
    if (level < this.config.level) return;

    const formattedMessage = this.formatMessage(levelName, message);

    // 控制台输出
    if (this.config.console) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, ...data);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, ...data);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, ...data);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, ...data);
          break;
      }
    }

    // 保存到存储
    this.saveToStorage({
      level: levelName,
      message,
      timestamp: new Date().toISOString(),
      data: data.length > 0 ? data : undefined,
    });
  }

  /**
   * Debug 级别日志
   */
  debug(message: string, ...data: unknown[]): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, ...data);
  }

  /**
   * Info 级别日志
   */
  info(message: string, ...data: unknown[]): void {
    this.log(LogLevel.INFO, 'INFO', message, ...data);
  }

  /**
   * Warn 级别日志
   */
  warn(message: string, ...data: unknown[]): void {
    this.log(LogLevel.WARN, 'WARN', message, ...data);
  }

  /**
   * Error 级别日志
   */
  error(message: string, ...data: unknown[]): void {
    this.log(LogLevel.ERROR, 'ERROR', message, ...data);
  }

  /**
   * 获取存储的日志
   */
  getLogs(): LogEntry[] {
    try {
      const logsRaw = uni.getStorageSync(this.STORAGE_KEY);
      return logsRaw ? JSON.parse(logsRaw) : [];
    } catch {
      return [];
    }
  }

  /**
   * 清空存储的日志
   */
  clearLogs(): void {
    try {
      uni.removeStorageSync(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}

// 根据环境设置默认日志级别
const isDev = import.meta.env.DEV;

// 导出默认实例
export const logger = new Logger({
  level: isDev ? LogLevel.DEBUG : LogLevel.WARN,
  console: true,
  storage: !isDev, // 生产环境保存日志
});

export default logger;
