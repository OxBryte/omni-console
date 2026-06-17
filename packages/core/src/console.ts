import { ConsoleLog } from './types';

let logs: ConsoleLog[] = [];
let listeners: (() => void)[] = [];
const MAX_LOGS = 2000;

export const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

let isIntercepting = false;

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function safeSerialize(val: any): any {
  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(val, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }
    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }
    if (typeof value === 'symbol') {
      return value.toString();
    }
    if (typeof value === 'bigint') {
      return value.toString() + 'n';
    }
    if (value === undefined) {
      return '__oc_undefined__';
    }
    return value;
  }));
}

export function parseStack(error?: Error): string | undefined {
  const stack = error?.stack || new Error().stack;
  if (!stack) return undefined;
  const lines = stack.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.includes('omniconsole') ||
      line.includes('console.ts') ||
      line.includes('Error') ||
      line.includes('captureLog') ||
      line.includes('window.addEventListener')
    ) {
      continue;
    }
    const match = line.match(/\((http[s]?:\/\/.*?)\)/) || line.match(/at\s+(http[s]?:\/\/.*?)$/) || line.match(/(http[s]?:\/\/.*?)$/);
    if (match) {
      try {
        const urlObj = new URL(match[1]);
        return urlObj.pathname + urlObj.search + (urlObj.hash || '');
      } catch (e) {
        return match[1];
      }
    }
  }
  return undefined;
}

export function captureLog(level: 'log' | 'info' | 'warn' | 'error', args: any[]) {
  const stack = parseStack();
  const serializedArgs = args.map((arg) => {
    try {
      if (arg === undefined) return '__oc_undefined__';
      if (typeof arg !== 'object') return arg;
      return safeSerialize(arg);
    } catch (e) {
      return `[Serialization Error: ${e}]`;
    }
  });

  const logEntry: ConsoleLog = {
    id: generateId(),
    level,
    timestamp: new Date(),
    args: serializedArgs,
    stack,
  };

  logs.push(logEntry);
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
  notifyListeners();
}

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

export function subscribeToLogs(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((x) => x !== cb);
  };
}

export function getLogs(): ConsoleLog[] {
  return logs;
}

export function clearLogs() {
  logs = [];
  notifyListeners();
}

export function startConsoleInterception() {
  if (isIntercepting) return;
  isIntercepting = true;

  console.log = function (...args) {
    captureLog('log', args);
    originalConsole.log.apply(console, args);
  };

  console.info = function (...args) {
    captureLog('info', args);
    originalConsole.info.apply(console, args);
  };

  console.warn = function (...args) {
    captureLog('warn', args);
    originalConsole.warn.apply(console, args);
  };

  console.error = function (...args) {
    captureLog('error', args);
    originalConsole.error.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    captureLog('error', [event.error || event.message]);
  });

  window.addEventListener('unhandledrejection', (event) => {
    captureLog('error', ['Unhandled promise rejection:', event.reason]);
  });
}

export function stopConsoleInterception() {
  if (!isIntercepting) return;
  isIntercepting = false;
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
}
