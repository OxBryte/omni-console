import { OmniConsoleTheme } from './types';

export const DEFAULT_DARK_THEME: Required<OmniConsoleTheme> = {
  primaryColor: '#e4e4e7', // Light zinc grey
  backgroundColor: 'rgba(24, 24, 27, 0.95)', // Off-black dark grey
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  textColor: '#eaeaea', // Off-white
  textColorDim: '#a1a1aa', // Muted zinc grey
  borderColor: 'rgba(228, 228, 231, 0.08)', // Subtle grey border
  logColor: '#eaeaea',
  infoColor: '#38bdf8',
  warnColor: '#fbbf24',
  errorColor: '#f87171',
  networkColor: '#34d399',
  applicationColor: '#a78bfa',
};

export const DEFAULT_LIGHT_THEME: Required<OmniConsoleTheme> = {
  primaryColor: '#18181b', // Off-black charcoal
  backgroundColor: 'rgba(244, 244, 245, 0.98)', // Off-white light grey
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  textColor: '#27272a', // Dark grey
  textColorDim: '#71717a', // Muted grey
  borderColor: '#e4e4e7', // Neutral grey border
  logColor: '#27272a',
  infoColor: '#3182ce',
  warnColor: '#dd6b20',
  errorColor: '#e53e3e',
  networkColor: '#38a169',
  applicationColor: '#805ad5',
};

export function injectTheme(theme: OmniConsoleTheme = {}, themeMode: 'dark' | 'light' = 'dark') {
  const defaults = themeMode === 'light' ? DEFAULT_LIGHT_THEME : DEFAULT_DARK_THEME;
  const merged = { ...defaults, ...theme };

  const css = `
    :root {
      --oc-primary-color: ${merged.primaryColor};
      --oc-bg-color: ${merged.backgroundColor};
      --oc-font-family: ${merged.fontFamily};
      --oc-text-color: ${merged.textColor};
      --oc-text-color-dim: ${merged.textColorDim};
      --oc-border-color: ${merged.borderColor};
      --oc-log-color: ${merged.logColor};
      --oc-info-color: ${merged.infoColor};
      --oc-warn-color: ${merged.warnColor};
      --oc-error-color: ${merged.errorColor};
      --oc-network-color: ${merged.networkColor};
      --oc-app-color: ${merged.applicationColor};
      --oc-header-bg: ${themeMode === 'light' ? 'rgba(228, 228, 231, 0.9)' : 'rgba(39, 39, 42, 0.9)'};
      --oc-tab-active-bg: ${themeMode === 'light' ? 'rgba(244, 244, 245, 0.8)' : 'rgba(63, 63, 70, 0.8)'};
      --oc-input-bg: ${themeMode === 'light' ? '#f4f4f5' : '#27272a'};
      --oc-row-alt-bg: ${themeMode === 'light' ? 'rgba(24, 24, 27, 0.015)' : 'rgba(244, 244, 245, 0.015)'};
      --oc-hover-bg: ${themeMode === 'light' ? 'rgba(24, 24, 27, 0.04)' : 'rgba(244, 244, 245, 0.04)'};
      --oc-badge-bg: ${themeMode === 'light' ? 'rgba(244, 244, 245, 0.9)' : 'rgba(39, 39, 42, 0.9)'};
      --oc-scrollbar-thumb: ${themeMode === 'light' ? '#d4d4d8' : '#3f3f46'};
    }
  `;

  let styleEl = document.getElementById('omniconsole-theme-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'omniconsole-theme-styles';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}
