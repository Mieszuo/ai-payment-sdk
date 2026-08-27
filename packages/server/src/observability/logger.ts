export interface LoggerOptions {
  sink?: (message: string) => void;
}

export class PlatformLogger {
  private sink: (message: string) => void;

  constructor(options?: LoggerOptions) {
    this.sink = options?.sink || ((msg) => console.log(msg));
  }

  private sanitize(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = new Set(["inputs", "input", "rawOutput", "prompt", "systemPrompt", "cvText", "secret"]);
    const cleaned: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.has(key)) {
        cleaned[key] = "[REDACTED]";
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map((item) =>
          item && typeof item === "object" && !Array.isArray(item)
            ? this.sanitize(item as Record<string, unknown>)
            : item
        );
      } else if (value && typeof value === "object") {
        cleaned[key] = this.sanitize(value as Record<string, unknown>);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
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
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.sanitize(meta)
    };
    this.sink(JSON.stringify(entry));
  }
}
