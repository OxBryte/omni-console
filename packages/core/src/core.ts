import { OmniConsoleOptions } from './types';
import { startConsoleInterception, stopConsoleInterception } from './console';
import { startNetworkInterception, stopNetworkInterception, setBlacklistedUrls } from './network';
import { startStorageInterception, stopStorageInterception } from './storage';
import { initUI } from './ui';

let isInitialized = false;

export function initOmniConsole(options: OmniConsoleOptions = {}) {
  // Check Node environment safely without Node typings
  const isNodeProd =
    typeof (globalThis as any).process !== 'undefined' &&
    (globalThis as any).process.env &&
    (globalThis as any).process.env.NODE_ENV === 'production';
  
  // Check Vite/ESM environment safely
  let isViteProd = false;
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env.PROD) {
      isViteProd = true;
    }
  } catch (e) {}

  const isProduction = isNodeProd || isViteProd;
  
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.endsWith('.local'));

  const disableInProd = isProduction && !options.forceProd && !isLocalhost;

  if (disableInProd || options.enabled === false) {
    // Return no-op stubs for production safety
    return {
      destroy: () => {},
      isNoop: true,
    };
  }

  if (isInitialized) {
    return {
      destroy: () => {},
      isNoop: false,
    };
  }
  isInitialized = true;

  if (options.blacklistedUrls) {
    setBlacklistedUrls(options.blacklistedUrls);
  }

  // Hook standard client-side APIs
  startConsoleInterception();
  startNetworkInterception();
  startStorageInterception();

  // Draw developer panel when DOM is ready
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initUI(options));
    } else {
      initUI(options);
    }
  }

  return {
    destroy: () => {
      stopConsoleInterception();
      stopNetworkInterception();
      stopStorageInterception();
      isInitialized = false;
      const root = document.querySelector('.omniconsole-root');
      root?.remove();
    },
    isNoop: false,
  };
}
