export interface OmniConsoleTheme {
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  textColor?: string;
  textColorDim?: string;
  borderColor?: string;
  logColor?: string;
  infoColor?: string;
  warnColor?: string;
  errorColor?: string;
  networkColor?: string;
  applicationColor?: string;
}

export interface OmniConsoleOptions {
  enabled?: boolean;
  defaultDock?: 'bottom' | 'left' | 'right' | 'free';
  theme?: OmniConsoleTheme;
  blacklistedUrls?: string[];
  forceProd?: boolean;
}

export interface ConsoleLog {
  id: string;
  level: 'log' | 'info' | 'warn' | 'error';
  timestamp: Date;
  args: any[];
  stack?: string;
}

export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  type: 'fetch' | 'xhr';
  status: 'pending' | number;
  timestamp: Date;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  duration?: number;
  error?: string;
}

export interface StorageItem {
  key: string;
  value: string;
}
