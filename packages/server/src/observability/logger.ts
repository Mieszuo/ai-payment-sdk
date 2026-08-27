export interface LoggerOptions {
  sink?: (message: string) => void;
}

export class PlatformLogger {
  private sink: (message: string) => void;
  private sensitiveKeys = new Set([
    "inputs",
    "input",
    "rawoutput",
    "prompt",
    "systemprompt",
    "cvtext",
    "secret",
    "authorization",
    "token",
    "password",
    "apikey"
  ]);

  constructor(options?: LoggerOptions) {
    this.sink = options?.sink || ((msg) => console.log(msg));
  }

  private isSensitiveKey(key: string): boolean {
    return this.sensitiveKeys.has(key.toLowerCase());
  }

  private sanitizeValue(value: unknown, seen: WeakSet<object>): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack
      };
    }

    if (typeof value === "object") {
      if (seen.has(value)) {
        return "[CIRCULAR]";
      }
      seen.add(value);

      if (Array.isArray(value)) {
        return value.map((item) => this.sanitizeValue(item, seen));
      }

      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (this.isSensitiveKey(k)) {
          cleaned[k] = "[REDACTED]";
        } else {
          cleaned[k] = this.sanitizeValue(v, seen);
        }
      }
      return cleaned;
    }

    return value;
  }

  private sanitize(data: Record<string, unknown>): Record<string, unknown> {
    const seen = new WeakSet<object>();
    const sanitized = this.sanitizeValue(data, seen);
    if (sanitized && typeof sanitized === "object" && !Array.isArray(sanitized)) {
      return sanitized as Record<string, unknown>;
    }
    return { data: sanitized };
  }

  info(message: string, meta: Record<string, unknown> = {}) {
    this.log("INFO", message, meta);
  }

  warn(message: string, meta: Record<string, unknown> = {}) {
    this.log("WARN", message, meta);
  }

  error(message: string, meta: Record<string, unknown> = {}) {
    this.log("ERROR", message, meta);
  }

  debug(message: string, meta: Record<string, unknown> = {}) {
    this.log("DEBUG", message, meta);
  }

  private log(level: string, message: string, meta: Record<string, unknown>) {
    const entry = {
      ...this.sanitize(meta),
      timestamp: new Date().toISOString(),
      level,
      message
    };
    this.sink(JSON.stringify(entry));
  }
}
