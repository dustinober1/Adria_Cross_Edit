// Client-side logger utility
// Provides console output control (useful for development)

const logger = {
  log: (...args) => {
    if (typeof console !== 'undefined') {
      console.log(...args);
    }
  },
  error: (...args) => {
    if (typeof console !== 'undefined') {
      console.error(...args);
    }
  },
  warn: (...args) => {
    if (typeof console !== 'undefined') {
      console.warn(...args);
    }
  },
  info: (...args) => {
    if (typeof console !== 'undefined') {
      console.info(...args);
    }
  },
  debug: (...args) => {
    if (typeof console !== 'undefined') {
      console.debug(...args);
    }
  }
};

// Export for use in other scripts
window.logger = logger;
