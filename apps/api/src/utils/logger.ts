
const getTimestamp = (): string => new Date().toISOString();

const info = (...args: any[]) => {
  console.log(`[${getTimestamp()}] [INFO]`, ...args);
};

const warn = (...args: any[]) => {
  console.warn(`[${getTimestamp()}] [WARN]`, ...args);
};

const error = (...args: any[]) => {
  console.error(`[${getTimestamp()}] [ERROR]`, ...args);
};

const debug = (...args: any[]) => {
  // Only log debug messages in a development environment.
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[${getTimestamp()}] [DEBUG]`, ...args);
  }
};

export const logger = {
  info,
  warn,
  error,
  debug,
};
