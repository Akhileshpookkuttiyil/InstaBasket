const isProduction = process.env.NODE_ENV === "production";

const writeLog = (level, message, meta = {}) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  if (isProduction) {
    const line = `${JSON.stringify(payload)}\n`;
    if (level === "error") {
      process.stderr.write(line);
    } else {
      process.stdout.write(line);
    }
    return;
  }

  if (level === "error") {
    console.error(`[${level.toUpperCase()}] ${message}`, meta);
    return;
  }

  if (level === "warn") {
    console.warn(`[${level.toUpperCase()}] ${message}`, meta);
    return;
  }

  console.log(`[${level.toUpperCase()}] ${message}`, meta);
};

const logger = {
  info: (message, meta) => writeLog("info", message, meta),
  warn: (message, meta) => writeLog("warn", message, meta),
  error: (message, meta) => writeLog("error", message, meta),
};

export default logger;
