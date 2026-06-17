import { NetworkRequest } from './types';

let requests: NetworkRequest[] = [];
let listeners: (() => void)[] = [];
let blacklist: string[] = [];

const originalFetch = window.fetch;
const originalXhrOpen = XMLHttpRequest.prototype.open;
const originalXhrSend = XMLHttpRequest.prototype.send;
const originalXhrSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

let isIntercepting = false;

// Extend XHR properties internally
declare global {
  interface XMLHttpRequest {
    _method?: string;
    _url?: string;
    _reqHeaders?: Record<string, string>;
  }
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function setBlacklistedUrls(urls: string[]) {
  blacklist = urls;
}

function isBlacklisted(url: string): boolean {
  return blacklist.some((pattern) => url.includes(pattern));
}

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

export function subscribeToNetwork(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((x) => x !== cb);
  };
}

export function getNetworkRequests(): NetworkRequest[] {
  return requests;
}

export function clearNetworkRequests() {
  requests = [];
  notifyListeners();
}

function addRequest(req: NetworkRequest) {
  requests.push(req);
  notifyListeners();
}

function updateRequest(id: string, updates: Partial<NetworkRequest>) {
  const req = requests.find((r) => r.id === id);
  if (req) {
    Object.assign(req, updates);
    notifyListeners();
  }
}

function getHeadersObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

function parseXhrResponseHeaders(xhr: XMLHttpRequest): Record<string, string> {
  const headersString = xhr.getAllResponseHeaders();
  const headers: Record<string, string> = {};
  if (!headersString) return headers;
  const lines = headersString.split('\r\n');
  for (const line of lines) {
    const parts = line.split(': ');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join(': ').trim();
      headers[key] = value;
    }
  }
  return headers;
}

function parseBody(body: any): any {
  if (!body) return undefined;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (e) {
      return body;
    }
  }
  if (body instanceof URLSearchParams) {
    const obj: Record<string, string> = {};
    body.forEach((val, key) => {
      obj[key] = val;
    });
    return obj;
  }
  if (body instanceof FormData) {
    const obj: Record<string, any> = {};
    body.forEach((val, key) => {
      obj[key] = val;
    });
    return obj;
  }
  if (body instanceof Blob) {
    return `[Blob: ${body.size} bytes, type=${body.type}]`;
  }
  return body;
}

export function startNetworkInterception() {
  if (isIntercepting) return;
  isIntercepting = true;

  window.fetch = async function (input, init) {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      url = (input as Request).url || '';
    }

    if (isBlacklisted(url)) {
      return originalFetch.apply(this, [input, init]);
    }

    let method = 'GET';
    if (typeof input === 'string' || input instanceof URL) {
      method = init?.method || 'GET';
    } else {
      method = (input as Request).method || init?.method || 'GET';
    }

    const reqId = generateId();
    const startTime = performance.now();

    const reqHeaders: Record<string, string> = {};
    if (typeof input !== 'string' && !(input instanceof URL) && (input as Request).headers) {
      (input as Request).headers.forEach((val, key) => {
        reqHeaders[key] = val;
      });
    }
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((val, key) => {
          reqHeaders[key] = val;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, val]) => {
          reqHeaders[key] = val;
        });
      } else {
        Object.assign(reqHeaders, init.headers);
      }
    }

    let reqBody: any = undefined;
    if (init?.body) {
      reqBody = parseBody(init.body);
    }

    const requestItem: NetworkRequest = {
      id: reqId,
      url,
      method: method.toUpperCase(),
      type: 'fetch',
      status: 'pending',
      timestamp: new Date(),
      requestHeaders: reqHeaders,
      requestBody: reqBody,
    };

    addRequest(requestItem);

    try {
      const response = await originalFetch.apply(this, [input, init]);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      const clonedResponse = response.clone();
      let respBody: any = '';
      try {
        respBody = await clonedResponse.text();
        try {
          respBody = JSON.parse(respBody);
        } catch (e) {}
      } catch (e) {
        respBody = '[Failed to parse response body]';
      }

      updateRequest(reqId, {
        status: response.status,
        duration,
        responseHeaders: getHeadersObject(response.headers),
        responseBody: respBody,
      });

      return response;
    } catch (error: any) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      updateRequest(reqId, {
        status: 0,
        duration,
        error: error.message || String(error),
        responseBody: error.message || String(error),
      });
      throw error;
    }
  };

  // XMLHttpRequest Interception
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...args: any[]) {
    this._method = method;
    this._url = typeof url === 'string' ? url : url.toString();
    this._reqHeaders = {};
    return (originalXhrOpen as any).apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (header: string, value: string) {
    if (this._reqHeaders) {
      this._reqHeaders[header] = value;
    }
    return originalXhrSetRequestHeader.apply(this, [header, value]);
  };

  XMLHttpRequest.prototype.send = function (body?: any) {
    const xhr = this;
    const url = xhr._url || '';

    if (isBlacklisted(url)) {
      return originalXhrSend.apply(this, [body]);
    }

    const reqId = generateId();
    const startTime = performance.now();

    const requestItem: NetworkRequest = {
      id: reqId,
      url,
      method: (xhr._method || 'GET').toUpperCase(),
      type: 'xhr',
      status: 'pending',
      timestamp: new Date(),
      requestHeaders: xhr._reqHeaders || {},
      requestBody: parseBody(body),
    };

    addRequest(requestItem);

    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === 4) {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        let respBody: any = '';
        try {
          if (xhr.responseType === '' || xhr.responseType === 'text') {
            respBody = xhr.responseText;
            try {
              respBody = JSON.parse(respBody);
            } catch (e) {}
          } else if (xhr.responseType === 'json') {
            respBody = xhr.response;
          } else {
            respBody = `[Binary Data: ${xhr.responseType}]`;
          }
        } catch (e) {
          respBody = '[Failed to parse response body]';
        }

        updateRequest(reqId, {
          status: xhr.status,
          duration,
          responseHeaders: parseXhrResponseHeaders(xhr),
          responseBody: respBody,
        });
      }
    });

    return originalXhrSend.apply(this, [body]);
  };
}

export function stopNetworkInterception() {
  if (!isIntercepting) return;
  isIntercepting = false;
  window.fetch = originalFetch;
  XMLHttpRequest.prototype.open = originalXhrOpen;
  XMLHttpRequest.prototype.send = originalXhrSend;
  XMLHttpRequest.prototype.setRequestHeader = originalXhrSetRequestHeader;
}
