import { ConsoleLog, NetworkRequest, OmniConsoleOptions, StorageItem } from './types';
import { getLogs, subscribeToLogs, clearLogs } from './console';
import { getNetworkRequests, subscribeToNetwork, clearNetworkRequests } from './network';
import {
  getStorageData,
  setStorageItem,
  deleteStorageItem,
  clearStorage,
  getCookies,
  setCookie,
  deleteCookie,
  clearCookies,
  subscribeToStorage,
} from './storage';
import { injectTheme } from './theme';
import { VirtualList } from './virtual-list';

let rootEl: HTMLDivElement | null = null;
let badgeEl: HTMLDivElement | null = null;
let panelEl: HTMLDivElement | null = null;

let currentTab = 'console';
let currentStorageType: 'local' | 'session' | 'cookies' = 'local';
let selectedRequest: NetworkRequest | null = null;

let isPanelOpen = false;
let currentDock: 'bottom' | 'left' | 'right' | 'free' = 'bottom';
let currentThemeMode: 'dark' | 'light' = 'dark';
let activeOptions: OmniConsoleOptions = {};

// Virtualizer instances
let logVirtualList: VirtualList<ConsoleLog> | null = null;
let netVirtualList: VirtualList<NetworkRequest> | null = null;

export function initUI(options: OmniConsoleOptions) {
  activeOptions = options;
  currentDock = options.defaultDock || 'bottom';
  
  // Load settings from localStorage
  const savedDock = localStorage.getItem('oc-dock-mode');
  if (savedDock === 'bottom' || savedDock === 'left' || savedDock === 'right' || savedDock === 'free') {
    currentDock = savedDock;
  }
  
  const savedTheme = localStorage.getItem('oc-theme-mode');
  if (savedTheme === 'dark' || savedTheme === 'light') {
    currentThemeMode = savedTheme;
  }

  injectTheme(options.theme, currentThemeMode);
  injectUIStyles();
  createDOM();
  setupInteractions();
  updateBadgePosition();
  updatePanelStyles();
  renderCurrentTab();

  // Subscriptions
  subscribeToLogs(() => {
    if (isPanelOpen && currentTab === 'console') {
      refreshLogs();
    }
  });

  subscribeToNetwork(() => {
    if (isPanelOpen && currentTab === 'network') {
      refreshNetwork();
    }
  });

  subscribeToStorage(() => {
    if (isPanelOpen && currentTab === 'application') {
      refreshStorage();
    }
  });
}

function injectUIStyles() {
  if (document.getElementById('omniconsole-ui-styles')) return;

  const style = document.createElement('style');
  style.id = 'omniconsole-ui-styles';
  style.textContent = `
    /* ── Reset & Root ── */
    .omniconsole-root {
      all: initial;
      font-family: var(--oc-font-family);
      font-size: 12.5px;
      color: var(--oc-text-color);
      z-index: 999999;
      position: fixed;
      left: 0; top: 0;
      width: 0; height: 0;
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
    }
    .omniconsole-root *, .omniconsole-root *::before, .omniconsole-root *::after {
      box-sizing: border-box;
      margin: 0; padding: 0;
    }

    /* ── Floating Pill Badge ── */
    .oc-badge {
      position: fixed;
      height: 36px;
      padding: 0 14px 0 10px;
      border-radius: 100px;
      background: var(--oc-badge-bg);
      border: 1px solid var(--oc-border-color);
      box-shadow:
        0 2px 12px rgba(0,0,0,0.25),
        0 0 0 0.5px rgba(244,244,245,0.04) inset;
      cursor: grab;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--oc-text-color-dim);
      user-select: none;
      transition:
        background 0.2s,
        border-color 0.2s,
        box-shadow 0.2s,
        transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
      z-index: 1000000;
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      white-space: nowrap;
    }
    .oc-badge:active { cursor: grabbing; transform: scale(0.95); }
    .oc-badge:hover {
      background: var(--oc-hover-bg);
      border-color: var(--oc-primary-color);
      color: var(--oc-text-color);
      box-shadow: 0 4px 20px rgba(228,228,231,0.15), 0 2px 12px rgba(0,0,0,0.3);
    }
    .oc-badge-icon {
      display: flex; align-items: center; justify-content: center;
      color: var(--oc-primary-color);
      flex-shrink: 0;
    }
    .oc-badge-label {
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.01em;
      color: var(--oc-text-color);
    }
    .oc-badge-pulse {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #10b981;
      flex-shrink: 0;
      box-shadow: 0 0 6px #10b981;
      animation: oc-pulse 2s ease-in-out infinite;
    }
    @keyframes oc-pulse {
      0%, 100% { opacity: 0.6; transform: scale(0.9); }
      50% { opacity: 1; transform: scale(1.2); }
    }

    /* ── Main Panel ── */
    .oc-panel {
      position: fixed;
      background: var(--oc-bg-color);
      backdrop-filter: blur(28px) saturate(200%);
      -webkit-backdrop-filter: blur(28px) saturate(200%);
      border: 1px solid var(--oc-border-color);
      display: flex;
      flex-direction: column;
      transition: transform 0.28s cubic-bezier(0.16,1,0.3,1), opacity 0.2s;
      opacity: 0;
      pointer-events: none;
      box-sizing: border-box;
      z-index: 999999;
      font-family: var(--oc-font-family);
    }
    .oc-panel.open { opacity: 1; pointer-events: auto; }

    /* Dock positions */
    .oc-panel.dock-bottom {
      left: 0; right: 0; bottom: 0;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
      border-bottom: none;
       box-shadow: 0 -8px 40px rgba(0,0,0,0.4), 0 -1px 0 rgba(228,228,231,0.05);
      transform: translateY(100%);
    }
    .oc-panel.dock-bottom.open { transform: translateY(0); }

    .oc-panel.dock-left {
      left: 0; top: 0; bottom: 0;
      border-right: 1px solid var(--oc-border-color);
      border-left: none; border-top: none; border-bottom: none;
      box-shadow: 4px 0 30px rgba(0,0,0,0.5);
      transform: translateX(-100%);
    }
    .oc-panel.dock-left.open { transform: translateX(0); }

    .oc-panel.dock-right {
      right: 0; top: 0; bottom: 0;
      border-left: 1px solid var(--oc-border-color);
      border-right: none; border-top: none; border-bottom: none;
      box-shadow: -4px 0 30px rgba(0,0,0,0.5);
      transform: translateX(100%);
    }
    .oc-panel.dock-right.open { transform: translateX(0); }

    .oc-panel.dock-free {
      border-radius: 14px;
       box-shadow: 0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(228,228,231,0.06) inset;
      transform: scale(0.95) translateY(8px);
    }
    .oc-panel.dock-free.open { transform: scale(1) translateY(0); }

    /* Resize handles */
    .oc-resize-handle {
      position: absolute;
      background: transparent;
      z-index: 10000;
    }
    .oc-panel.dock-bottom .oc-resize-handle {
      top: -4px; left: 0; right: 0; height: 8px; cursor: ns-resize;
    }
    .oc-panel.dock-left .oc-resize-handle {
      top: 0; bottom: 0; right: -4px; width: 8px; cursor: ew-resize;
    }
    .oc-panel.dock-right .oc-resize-handle {
      top: 0; bottom: 0; left: -4px; width: 8px; cursor: ew-resize;
    }
    .oc-panel.dock-free .oc-resize-handle-se {
      position: absolute; bottom: 4px; right: 4px;
      width: 16px; height: 16px; cursor: nwse-resize;
      opacity: 0.3;
      background: radial-gradient(circle at 80% 80%, var(--oc-text-color-dim) 1.5px, transparent 1.5px),
                  radial-gradient(circle at 50% 80%, var(--oc-text-color-dim) 1.5px, transparent 1.5px),
                  radial-gradient(circle at 80% 50%, var(--oc-text-color-dim) 1.5px, transparent 1.5px);
    }
    .oc-panel.dock-free .oc-resize-handle-se:hover { opacity: 0.8; }

    /* ── Header ── */
    .oc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px 10px 16px;
      background: var(--oc-header-bg);
      border-bottom: 1px solid var(--oc-border-color);
      user-select: none;
      flex-shrink: 0;
    }
    .oc-panel.dock-free .oc-header {
      cursor: move;
      border-top-left-radius: 14px;
      border-top-right-radius: 14px;
    }
    .oc-panel.dock-bottom .oc-header {
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
    }

    /* Traffic-light window controls (left side) */
    .oc-traffic-lights {
      display: flex;
      align-items: center;
      gap: 7px;
      flex-shrink: 0;
    }
    .oc-tl {
      width: 12px; height: 12px;
      border-radius: 50%;
      cursor: pointer;
      transition: opacity 0.15s, filter 0.15s;
      border: 0.5px solid rgba(0,0,0,0.18);
      display: flex; align-items: center; justify-content: center;
    }
    .oc-tl:hover { filter: brightness(0.88); }
    .oc-tl-close { background: #ff5f57; }
    .oc-tl-min   { background: #febc2e; }
    .oc-tl-max   { background: #28c840; }
    .oc-tl-close svg, .oc-tl-min svg, .oc-tl-max svg {
      opacity: 0;
      transition: opacity 0.15s;
    }
    .oc-traffic-lights:hover .oc-tl svg { opacity: 0.7; }

    /* Header title (center) */
    .oc-header-title {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 12px;
      font-weight: 600;
      color: var(--oc-text-color-dim);
      letter-spacing: 0.01em;
      flex: 1;
      justify-content: center;
    }
    .oc-header-title-icon { color: var(--oc-primary-color); display: flex; }

    /* Header controls (right side — dock switcher) */
    .oc-header-controls {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
    }
    .oc-btn {
      background: transparent;
      border: none;
      color: var(--oc-text-color-dim);
      font-size: 13px;
      width: 28px; height: 28px;
      cursor: pointer;
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
      font-family: var(--oc-font-family);
    }
    .oc-btn:hover {
      background: var(--oc-hover-bg);
      color: var(--oc-text-color);
    }
     .oc-btn.dock-active {
      color: var(--oc-primary-color);
      background: var(--oc-hover-bg);
     }
    .oc-btn-divider {
      width: 1px; height: 16px;
      background: var(--oc-border-color);
      margin: 0 2px;
      flex-shrink: 0;
    }

    /* ── Segmented Tab Bar ── */
    .oc-nav {
      display: flex;
      background: var(--oc-header-bg);
      border-bottom: 1px solid var(--oc-border-color);
      overflow-x: auto;
      flex-shrink: 0;
      padding: 0 12px;
      gap: 2px;
      scrollbar-width: none;
    }
    .oc-nav::-webkit-scrollbar { display: none; }
    .oc-tab {
      padding: 9px 14px 8px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      color: var(--oc-text-color-dim);
      border-bottom: 2px solid transparent;
      transition: color 0.15s, border-color 0.15s;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.01em;
    }
    .oc-tab:hover { color: var(--oc-text-color); }
    .oc-tab.active {
      color: var(--oc-primary-color);
      border-bottom-color: var(--oc-primary-color);
    }
    .oc-tab-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.6;
    }
    .oc-tab.active .oc-tab-dot { opacity: 1; }

    /* ── Content Area ── */
    .oc-content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }
    .oc-tab-content {
      display: none;
      flex: 1;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }
    .oc-tab-content.active { display: flex; }

    /* ── Toolbar ── */
    .oc-toolbar {
      display: flex;
      gap: 6px;
      padding: 7px 12px;
      background: var(--oc-header-bg);
      border-bottom: 1px solid var(--oc-border-color);
      align-items: center;
      flex-shrink: 0;
    }

    /* ── Inputs ── */
    .oc-input {
      background: var(--oc-input-bg);
      border: 1px solid var(--oc-border-color);
      color: var(--oc-text-color);
      padding: 5px 10px;
      border-radius: 7px;
      outline: none;
      font-family: var(--oc-font-family);
      font-size: 12px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
     .oc-input:focus {
      border-color: var(--oc-primary-color);
      box-shadow: 0 0 0 2.5px rgba(228, 228, 231, 0.15);
     }
    .oc-input::placeholder { color: var(--oc-text-color-dim); opacity: 0.6; }
    .oc-search {
      flex: 1;
      min-width: 120px;
      padding-left: 30px;
      background-image: url("data:image/svg+xml,%3Csvg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: 9px center;
      background-size: 13px;
    }
    .oc-select {
      background: var(--oc-input-bg);
      border: 1px solid var(--oc-border-color);
      color: var(--oc-text-color);
      padding: 5px 8px;
      border-radius: 7px;
      outline: none;
      font-family: var(--oc-font-family);
      font-size: 12px;
      cursor: pointer;
    }

    /* ── Icon Buttons ── */
    .oc-icon-btn {
      background: transparent;
      border: none;
      color: var(--oc-text-color-dim);
      cursor: pointer;
      padding: 5px;
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
    }
    .oc-icon-btn:hover { background: var(--oc-hover-bg); color: var(--oc-text-color); }
    .oc-icon-btn.danger:hover { color: var(--oc-error-color); background: rgba(248,113,113,0.08); }
    .oc-icon-btn.primary:hover { color: var(--oc-primary-color); background: rgba(228, 228, 231, 0.08); }

    /* ── Scrollbars ── */
    .oc-scrollable {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }
    .oc-scrollable::-webkit-scrollbar { width: 5px; height: 5px; }
    .oc-scrollable::-webkit-scrollbar-track { background: transparent; }
    .oc-scrollable::-webkit-scrollbar-thumb {
      background: var(--oc-scrollbar-thumb);
      border-radius: 10px;
    }
    .oc-scrollable::-webkit-scrollbar-thumb:hover { background: var(--oc-primary-color); }

    /* ── Console Log Rows ── */
    .oc-logs-container { padding: 0; }
    .oc-log-row {
      display: grid;
      grid-template-columns: 52px 1fr auto;
      padding: 4px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.035);
      align-items: baseline;
      gap: 8px;
      word-break: break-word;
      min-height: 26px;
      transition: background 0.1s;
    }
    .oc-log-row:hover { background: var(--oc-hover-bg); }
    .oc-log-row.log   { border-left: 2px solid transparent; }
    .oc-log-row.info  { border-left: 2px solid var(--oc-info-color);  }
    .oc-log-row.warn  { border-left: 2px solid var(--oc-warn-color);  background: rgba(251,191,36,0.025); }
    .oc-log-row.error { border-left: 2px solid var(--oc-error-color); background: rgba(248,113,113,0.04); }
    .oc-log-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 1px;
      color: var(--oc-text-color-dim);
      font-size: 10px;
      font-variant-numeric: tabular-nums;
      padding-top: 1px;
      opacity: 0.7;
    }
    .oc-log-body {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-family: 'SF Mono', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      min-width: 0;
    }
    .oc-log-level-badge {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
      flex-shrink: 0;
      align-self: flex-start;
      margin-top: 2px;
    }
    .oc-log-row.warn  .oc-log-level-badge { background: rgba(251,191,36,0.15); color: var(--oc-warn-color); }
    .oc-log-row.error .oc-log-level-badge { background: rgba(248,113,113,0.15); color: var(--oc-error-color); }
    .oc-log-row.info  .oc-log-level-badge { background: rgba(56,189,248,0.12); color: var(--oc-info-color); }
    .oc-log-caller {
      font-size: 10px;
      color: var(--oc-text-color-dim);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      opacity: 0.55;
      padding-top: 2px;
    }

    /* Empty state */
    .oc-empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--oc-text-color-dim);
      opacity: 0.45;
      font-size: 12px;
    }
    .oc-empty-state svg { opacity: 0.5; }
    .oc-empty-state p { margin: 0; }

    /* ── JSON Tree ── */
    .oc-json-tree {
      display: inline-block;
      font-family: 'SF Mono', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
    }
    .oc-json-summary { user-select: none; }
    .oc-json-content {
      font-family: 'SF Mono', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
    }

    /* ── Network Tab ── */
    .oc-network-split {
      display: flex; flex: 1; overflow: hidden; min-height: 0;
    }
    .oc-network-list-panel {
      flex: 1; display: flex; flex-direction: column;
      border-right: 1px solid var(--oc-border-color);
      min-height: 0; min-width: 220px;
    }
    .oc-network-details-panel {
      flex: 1.1; display: flex; flex-direction: column;
      overflow-y: auto; min-height: 0; padding: 10px;
      gap: 8px;
    }
    .oc-net-details-empty {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 10px; color: var(--oc-text-color-dim); opacity: 0.45;
      font-size: 12px;
    }
    .oc-net-row {
      display: grid;
      grid-template-columns: 1fr auto;
      padding: 7px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      cursor: pointer;
      gap: 8px;
      transition: background 0.1s;
    }
    .oc-net-row:hover { background: var(--oc-hover-bg); }
     .oc-net-row.active {
      background: rgba(228, 228, 231, 0.06);
      border-left: 2px solid var(--oc-primary-color);
     }
    .oc-net-row.failed .oc-net-url  { color: var(--oc-error-color); }
    .oc-net-row.pending .oc-net-url { color: var(--oc-warn-color); }
    .oc-net-url {
      font-size: 11.5px; font-weight: 500;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .oc-net-meta-row {
      display: flex; gap: 6px; align-items: center; margin-top: 3px;
      font-size: 10px; color: var(--oc-text-color-dim);
    }
    .oc-net-method {
      font-weight: 700; font-size: 10px;
      letter-spacing: 0.04em;
      padding: 1px 5px; border-radius: 4px;
    }
    .oc-net-method.get    { color: var(--oc-network-color); background: rgba(52,211,153,0.1); }
    .oc-net-method.post   { color: #f59e0b; background: rgba(245,158,11,0.1); }
    .oc-net-method.put    { color: #818cf8; background: rgba(129,140,248,0.1); }
    .oc-net-method.delete { color: var(--oc-error-color); background: rgba(248,113,113,0.1); }
    .oc-net-method.patch  { color: #22d3ee; background: rgba(34,211,238,0.1); }
    .oc-net-badge {
      font-size: 9.5px; padding: 1.5px 5px; border-radius: 4px;
      font-weight: 700; letter-spacing: 0.04em;
    }
    .oc-net-badge.fetch { background: rgba(52,211,153,0.12); color: var(--oc-network-color); }
    .oc-net-badge.xhr   { background: rgba(167,139,250,0.12); color: var(--oc-app-color); }
    .oc-net-status {
      font-size: 11px; font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .oc-net-status.ok   { color: var(--oc-network-color); }
    .oc-net-status.err  { color: var(--oc-error-color); }
    .oc-net-status.pend { color: var(--oc-warn-color); }
    /* Timing bar */
    .oc-net-timing {
      height: 2px; border-radius: 1px;
      background: var(--oc-border-color);
      margin-top: 4px; overflow: hidden;
    }
    .oc-net-timing-fill {
      height: 100%; border-radius: 1px;
      background: var(--oc-primary-color);
      transition: width 0.3s;
    }

    /* ── Network Details Cards ── */
    .oc-detail-section {
      background: var(--oc-header-bg);
      border: 1px solid var(--oc-border-color);
      border-radius: 9px;
      overflow: hidden;
      flex-shrink: 0;
    }
    .oc-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid var(--oc-border-color);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.03em;
      color: var(--oc-text-color-dim);
      text-transform: uppercase;
      cursor: pointer;
      user-select: none;
      transition: background 0.15s, color 0.15s;
    }
    .oc-detail-header:hover {
      background: var(--oc-hover-bg);
      color: var(--oc-text-color);
    }
    .oc-detail-section.collapsed .oc-detail-header {
      border-bottom-color: transparent;
    }
    .oc-detail-section.collapsed .oc-detail-body {
      display: none;
    }
    .oc-detail-header-chevron {
      transition: transform 0.2s ease-in-out;
      color: var(--oc-text-color-dim);
    }
    .oc-detail-section.collapsed .oc-detail-header-chevron {
      transform: rotate(-90deg);
    }
    .oc-detail-body {
      padding: 10px 12px;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 240px;
      overflow-y: auto;
      font-size: 11.5px;
    }
    .oc-kv-row {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 8px;
      padding: 3px 0;
      font-size: 11.5px;
      border-bottom: 1px solid rgba(255,255,255,0.035);
    }
    .oc-kv-row:last-child { border-bottom: none; }
    .oc-kv-key { font-weight: 600; color: var(--oc-primary-color); }
    .oc-kv-val { color: var(--oc-text-color); word-break: break-all; }

    /* ── Application / Storage Tab ── */
    .oc-app-tab-container {
      display: flex; flex: 1; overflow: hidden; min-height: 0;
    }
    .oc-app-sidebar {
      width: 148px; flex-shrink: 0;
      background: var(--oc-header-bg);
      border-right: 1px solid var(--oc-border-color);
      display: flex; flex-direction: column;
      padding: 8px 0;
      gap: 1px;
    }
    .oc-app-sidebar-label {
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--oc-text-color-dim);
      opacity: 0.55;
      padding: 8px 12px 4px;
    }
    .oc-app-sidebar-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      cursor: pointer;
      color: var(--oc-text-color-dim);
      border-left: 2px solid transparent;
      font-size: 12px;
      transition: all 0.12s;
      border-radius: 0 6px 6px 0;
      margin-right: 6px;
    }
    .oc-app-sidebar-item:hover {
      background: var(--oc-hover-bg);
      color: var(--oc-text-color);
    }
     .oc-app-sidebar-item.active {
      color: var(--oc-primary-color);
      background: rgba(228, 228, 231, 0.08);
      border-left-color: var(--oc-primary-color);
      font-weight: 600;
     }
    .oc-app-sidebar-item svg { flex-shrink: 0; }
    .oc-app-body {
      flex: 1; display: flex; flex-direction: column;
      overflow: hidden; min-height: 0;
    }
    .oc-app-table-container {
      flex: 1; overflow-y: auto; padding: 8px;
    }

    /* Storage table */
    .oc-table {
      width: 100%; border-collapse: collapse; font-size: 11.5px;
    }
    .oc-table th {
      background: var(--oc-header-bg);
      padding: 7px 12px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--oc-text-color-dim);
      border-bottom: 1px solid var(--oc-border-color);
    }
    .oc-table td {
      padding: 7px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      vertical-align: top;
      word-break: break-all;
    }
    .oc-table tr:hover td { background: var(--oc-hover-bg); }
    .oc-table .oc-key-cell { font-weight: 600; color: var(--oc-primary-color); }
    .oc-table .oc-val-cell { color: var(--oc-text-color); cursor: text; }
    .oc-table .oc-act-cell { text-align: center; width: 42px; }

    /* Danger button */
    .oc-danger-btn {
      background: transparent; border: none;
      color: var(--oc-text-color-dim);
      cursor: pointer; border-radius: 5px;
      width: 24px; height: 24px;
      display: inline-flex; align-items: center; justify-content: center;
      transition: color 0.15s, background 0.15s;
      font-size: 16px; line-height: 1;
      font-family: var(--oc-font-family);
    }
    .oc-danger-btn:hover { color: var(--oc-error-color); background: rgba(248,113,113,0.1); }

    /* ── Settings Tab ── */
    .oc-settings-panel {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      flex: 1;
    }
    .oc-settings-group-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--oc-text-color-dim);
      opacity: 0.55;
      padding-bottom: 6px;
      margin-bottom: -2px;
    }
    .oc-settings-card {
      background: var(--oc-header-bg);
      border: 1px solid var(--oc-border-color);
      border-radius: 11px;
      overflow: hidden;
    }
    .oc-settings-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 11px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .oc-settings-row:last-child { border-bottom: none; }
    .oc-settings-row-left {
      display: flex; flex-direction: column; gap: 2px;
    }
    .oc-settings-row-label {
      font-size: 12.5px;
      font-weight: 500;
      color: var(--oc-text-color);
    }
    .oc-settings-row-desc {
      font-size: 10.5px;
      color: var(--oc-text-color-dim);
      opacity: 0.7;
    }

    /* iOS-style toggle */
    .oc-toggle {
      position: relative;
      display: inline-block;
      width: 40px; height: 22px;
      flex-shrink: 0;
    }
    .oc-toggle input { opacity: 0; width: 0; height: 0; }
    .oc-toggle-track {
      position: absolute;
      inset: 0;
      background: var(--oc-border-color);
      border-radius: 100px;
      transition: background 0.2s;
      cursor: pointer;
    }
    .oc-toggle input:checked + .oc-toggle-track {
      background: var(--oc-primary-color);
    }
    .oc-toggle-track::after {
      content: '';
      position: absolute;
      top: 3px; left: 3px;
      width: 16px; height: 16px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .oc-toggle input:checked + .oc-toggle-track::after {
      transform: translateX(18px);
    }

    /* Environment badge */
    .oc-env-badge {
      font-size: 10.5px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .oc-env-badge.dev  { color: #10b981; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); }
    .oc-env-badge.prod { color: #f87171; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.2); }
    .oc-env-badge.stag { color: #fbbf24; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.2); }

    /* ── Utility ── */
    .oc-text-error { color: var(--oc-error-color) !important; }
    .oc-text-warn  { color: var(--oc-warn-color)  !important; }
    .oc-text-success { color: var(--oc-network-color) !important; }
    .oc-mono {
      font-family: 'SF Mono', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
    }

    /* ── Mobile Responsive Overrides ── */
    @media (max-width: 600px) {
      .oc-panel.dock-left,
      .oc-panel.dock-right {
        width: 100% !important;
        height: 100% !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        border: none !important;
        border-radius: 0 !important;
      }
      .oc-panel.dock-left {
        transform: translateX(-100%) !important;
      }
      .oc-panel.dock-left.open {
        transform: translateX(0) !important;
      }
      .oc-panel.dock-right {
        transform: translateX(100%) !important;
      }
      .oc-panel.dock-right.open {
        transform: translateX(0) !important;
      }
      .oc-panel.dock-bottom {
        height: 70vh !important;
        max-height: 100% !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        border-radius: 12px 12px 0 0 !important;
      }
      .oc-panel.dock-free {
        width: calc(100% - 16px) !important;
        height: 70vh !important;
        max-height: calc(100% - 70px) !important;
        left: 8px !important;
        top: auto !important;
        bottom: 8px !important;
        border-radius: 12px !important;
        transform: translateY(120%) scale(1) !important;
      }
      .oc-panel.dock-free.open {
        transform: translateY(0) scale(1) !important;
      }
      .oc-resize-handle,
      .oc-resize-handle-se {
        display: none !important;
      }
      .oc-header-controls {
        display: none !important;
      }
      .oc-badge {
        height: 32px !important;
        padding: 0 10px 0 8px !important;
        gap: 6px !important;
      }
      .oc-badge-label {
        font-size: 10.5px !important;
      }
      .oc-badge-icon svg {
        width: 44px !important;
        height: 13px !important;
      }

      /* Console Logs */
      .oc-log-row {
        grid-template-columns: 46px 1fr !important;
        gap: 4px 6px !important;
        padding: 6px 10px !important;
      }
      .oc-log-meta {
        grid-column: 2 !important;
        grid-row: 2 !important;
        flex-direction: row !important;
        justify-content: flex-start !important;
        align-items: center !important;
        gap: 8px !important;
        opacity: 0.55 !important;
        padding-top: 1px !important;
      }
      .oc-log-caller {
        max-width: 160px !important;
      }

      /* Network Tab */
      .oc-network-split {
        flex-direction: column !important;
      }
      .oc-network-list-panel {
        border-right: none !important;
        border-bottom: 1px solid var(--oc-border-color) !important;
        flex: 1 !important;
        height: 50% !important;
        min-height: 180px !important;
      }
      .oc-network-details-panel {
        flex: 1 !important;
        height: 50% !important;
      }

      /* Application Tab */
      .oc-app-tab-container {
        flex-direction: column !important;
      }
      .oc-app-sidebar {
        width: 100% !important;
        height: auto !important;
        flex-direction: row !important;
        border-right: none !important;
        border-bottom: 1px solid var(--oc-border-color) !important;
        padding: 4px 8px !important;
        gap: 4px !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
      }
      .oc-app-sidebar::-webkit-scrollbar {
        display: none !important;
      }
      .oc-app-sidebar-label {
        display: none !important;
      }
      .oc-app-sidebar-item {
        border-left: none !important;
        border-bottom: 2px solid transparent !important;
        border-radius: 4px !important;
        margin-right: 0 !important;
        padding: 6px 10px !important;
      }
      .oc-app-sidebar-item.active {
        border-bottom-color: var(--oc-primary-color) !important;
        background: rgba(228, 228, 231, 0.04) !important;
      }
      .oc-app-body {
        flex: 1 !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function createDOM() {
  rootEl = document.createElement('div');
  rootEl.className = 'omniconsole-root';

  // Badge trigger
  badgeEl = document.createElement('div');
  badgeEl.className = 'oc-badge';
  badgeEl.title = 'Open OmniConsole';
  badgeEl.innerHTML = `
    <div class="oc-badge-pulse"></div>
    <span class="oc-badge-icon" style="display: flex; align-items: center;">
      <svg width="17" height="16" viewBox="0 0 95 88" fill="currentColor">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M48.5353 18.8311C45.2345 17.5761 45.0086 21.5754 44.389 24.078C43.756 26.6341 43.1523 29.15 42.495 31.7486L31.084 78.3077C28.9069 86.8019 30.4206 87.5077 20.9363 87.5029C16.9613 87.5017 5.08861 88.0338 2.01504 87.4081C-1.2942 86.7339 0.313041 83.1841 0.989712 80.4786C1.61293 77.9894 2.29567 75.4163 2.92497 72.9101C4.17383 67.9341 5.56362 62.7212 6.89874 57.7889C9.65766 47.5939 12.2453 37.4001 14.7819 27.1492C17.6222 15.6664 22.5108 9.08799 30.6612 4.5153C49.6213 -6.12435 74.2318 2.77685 79.5625 23.4742C82.8183 36.1147 71.4546 42.8474 65.8542 47.7676C62.4963 50.7172 58.5736 53.843 55.9373 57.309C52.2758 62.1222 55.975 68.0228 61.3969 59.825C68.1842 49.5631 79.65 50.7172 86.2114 58.6417C88.9132 61.9036 90.3054 67.9086 91.6466 72.6574C96.8486 91.0842 97.7257 87.4409 74.1285 87.4482C64.9175 87.4506 65.9064 87.0485 63.7415 78.9151C63.0393 76.2765 62.9786 72.5663 59.9063 72.9672C58.3014 73.1762 55.5316 75.4965 53.7652 76.4077C42.9202 82.0008 31.3731 71.5847 41.4928 60.826C49.0904 52.7472 53.617 46.4531 52.7156 33.7373C52.5102 30.8399 51.1581 19.8309 48.5353 18.8335V18.8311Z" />
      </svg>
    </span>
  `;
  
  // Panel Dashboard
  panelEl = document.createElement('div');
  panelEl.className = `oc-panel dock-${currentDock}`;
  
  panelEl.innerHTML = `
    <div class="oc-resize-handle"></div>
    ${currentDock === 'free' ? '<div class="oc-resize-handle-se"></div>' : ''}

    <!-- Header -->
    <div class="oc-header">
      <!-- Traffic lights (close + dock controls) -->
      <div class="oc-traffic-lights">
        <div class="oc-tl oc-tl-close oc-btn-close" title="Close">
          <svg width="6" height="6" viewBox="0 0 8 8"><path d="M1.5 1.5 L6.5 6.5 M6.5 1.5 L1.5 6.5" stroke="rgba(80,0,0,0.6)" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <div class="oc-tl oc-tl-min" title="Minimise" style="cursor:default;">
          <svg width="6" height="6" viewBox="0 0 8 8"><line x1="1.5" y1="4" x2="6.5" y2="4" stroke="rgba(80,50,0,0.6)" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <div class="oc-tl oc-tl-max" title="Maximise" style="cursor:default;">
          <svg width="6" height="6" viewBox="0 0 8 8"><rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="rgba(0,50,0,0.6)" stroke-width="1.2" fill="none"/></svg>
        </div>
      </div>

      <!-- Center title -->
      <div class="oc-header-title">
        <svg width="54" height="16" viewBox="0 0 298 88" fill="currentColor">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M48.5353 18.8311C45.2345 17.5761 45.0086 21.5754 44.389 24.078C43.756 26.6341 43.1523 29.15 42.495 31.7486L31.084 78.3077C28.9069 86.8019 30.4206 87.5077 20.9363 87.5029C16.9613 87.5017 5.08861 88.0338 2.01504 87.4081C-1.2942 86.7339 0.313041 83.1841 0.989712 80.4786C1.61293 77.9894 2.29567 75.4163 2.92497 72.9101C4.17383 67.9341 5.56362 62.7212 6.89874 57.7889C9.65766 47.5939 12.2453 37.4001 14.7819 27.1492C17.6222 15.6664 22.5108 9.08799 30.6612 4.5153C49.6213 -6.12435 74.2318 2.77685 79.5625 23.4742C82.8183 36.1147 71.4546 42.8474 65.8542 47.7676C62.4963 50.7172 58.5736 53.843 55.9373 57.309C52.2758 62.1222 55.975 68.0228 61.3969 59.825C68.1842 49.5631 79.65 50.7172 86.2114 58.6417C88.9132 61.9036 90.3054 67.9086 91.6466 72.6574C96.8486 91.0842 97.7257 87.4409 74.1285 87.4482C64.9175 87.4506 65.9064 87.0485 63.7415 78.9151C63.0393 76.2765 62.9786 72.5663 59.9063 72.9672C58.3014 73.1762 55.5316 75.4965 53.7652 76.4077C42.9202 82.0008 31.3731 71.5847 41.4928 60.826C49.0904 52.7472 53.617 46.4531 52.7156 33.7373C52.5102 30.8399 51.1581 19.8309 48.5353 18.8335V18.8311Z"/>
          <path d="M131.885 83.6002C126.989 83.6002 122.669 82.4962 118.925 80.2882C115.181 78.0802 112.229 75.0322 110.069 71.1442C107.957 67.2082 106.901 62.6722 106.901 57.5362C106.901 52.4002 107.957 47.8882 110.069 44.0002C112.229 40.0642 115.181 36.9922 118.925 34.7842C122.669 32.5762 126.989 31.4722 131.885 31.4722C136.829 31.4722 141.173 32.5762 144.917 34.7842C148.709 36.9922 151.637 40.0642 153.701 44.0002C155.813 47.8882 156.869 52.4002 156.869 57.5362C156.869 62.6722 155.813 67.2082 153.701 71.1442C151.637 75.0322 148.709 78.0802 144.917 80.2882C141.173 82.4962 136.829 83.6002 131.885 83.6002ZM131.885 74.5282C134.909 74.5282 137.525 73.8322 139.733 72.4402C141.941 71.0482 143.645 69.1042 144.845 66.6082C146.045 64.0642 146.645 61.0402 146.645 57.5362C146.645 54.0322 146.045 51.0322 144.845 48.5362C143.645 45.9922 141.941 44.0242 139.733 42.6322C137.525 41.2402 134.909 40.5442 131.885 40.5442C128.909 40.5442 126.317 41.2402 124.109 42.6322C121.949 44.0242 120.245 45.9922 118.997 48.5362C117.797 51.0322 117.197 54.0322 117.197 57.5362C117.197 61.0402 117.797 64.0642 118.997 66.6082C120.245 69.1042 121.949 71.0482 124.109 72.4402C126.317 73.8322 128.909 74.5282 131.885 74.5282ZM165.088 82.7362V32.3362H177.184L192.376 63.3682L207.352 32.3362H219.376V82.7362H209.296V49.4002L196.264 75.6802H188.272L175.168 49.4002V82.7362H165.088ZM229.143 82.7362V32.3362H239.223L262.047 66.5362V32.3362H272.127V82.7362H262.047L239.223 48.6082V82.7362H229.143ZM281.948 82.7362V32.3362H292.028V82.7362H281.948Z" />
        </svg>
      </div>

      <!-- Right controls: dock switchers -->
      <div class="oc-header-controls">
        <button class="oc-btn oc-btn-dock" data-dock="bottom" title="Dock Bottom">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="9" width="14" height="6" rx="1.5"/><rect x="1" y="1" width="14" height="5" rx="1.5" opacity="0.3"/></svg>
        </button>
        <button class="oc-btn oc-btn-dock" data-dock="left" title="Dock Left">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="14" rx="1.5"/><rect x="10" y="1" width="5" height="14" rx="1.5" opacity="0.3"/></svg>
        </button>
        <button class="oc-btn oc-btn-dock" data-dock="right" title="Dock Right">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><rect x="9" y="1" width="6" height="14" rx="1.5"/><rect x="1" y="1" width="5" height="14" rx="1.5" opacity="0.3"/></svg>
        </button>
        <div class="oc-btn-divider"></div>
        <button class="oc-btn oc-btn-dock" data-dock="free" title="Floating Window">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="2"/><line x1="2" y1="6" x2="14" y2="6"/></svg>
        </button>
      </div>
    </div>

    <!-- Nav Tabs -->
    <div class="oc-nav">
      <div class="oc-tab active" data-tab="console">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
        Console
      </div>
      <div class="oc-tab" data-tab="network">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        Network
      </div>
      <div class="oc-tab" data-tab="application">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
        Application
      </div>
      <div class="oc-tab" data-tab="settings">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Settings
      </div>
    </div>

    <div class="oc-content-area">
      <!-- ── Console Tab ── -->
      <div class="oc-tab-content oc-console-tab active">
        <div class="oc-toolbar">
          <input type="text" class="oc-input oc-search oc-log-search-input" placeholder="Search logs…">
          <select class="oc-select oc-log-filter-select">
            <option value="all">All</option>
            <option value="log">Log</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
          <button class="oc-icon-btn danger oc-console-clear-btn" title="Clear console">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
        <div class="oc-scrollable oc-console-scroll">
          <div class="oc-logs-container"></div>
        </div>
      </div>

      <!-- ── Network Tab ── -->
      <div class="oc-tab-content oc-network-tab">
        <div class="oc-network-split">
          <div class="oc-network-list-panel">
            <div class="oc-toolbar">
              <input type="text" class="oc-input oc-search oc-net-search-input" placeholder="Filter by URL or method…">
              <button class="oc-icon-btn danger oc-net-clear-btn" title="Clear requests">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
            <div class="oc-scrollable oc-network-scroll">
              <div class="oc-network-requests-list"></div>
            </div>
          </div>
          <div class="oc-network-details-panel">
            <div class="oc-net-details-empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/></svg>
              <p>Select a request to inspect</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Application Tab ── -->
      <div class="oc-tab-content oc-application-tab">
        <div class="oc-app-tab-container">
          <div class="oc-app-sidebar">
            <div class="oc-app-sidebar-label">Storage</div>
            <div class="oc-app-sidebar-item active" data-storage="local">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
              Local
            </div>
            <div class="oc-app-sidebar-item" data-storage="session">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Session
            </div>
            <div class="oc-app-sidebar-item" data-storage="cookies">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="8" cy="10" r="1" fill="currentColor"/><circle cx="14" cy="8" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/><circle cx="10" cy="15" r="1" fill="currentColor"/></svg>
              Cookies
            </div>
          </div>
          <div class="oc-app-body">
            <div class="oc-toolbar">
              <input type="text" class="oc-input oc-search oc-app-search-input" placeholder="Filter keys…">
              <button class="oc-icon-btn primary oc-app-add-btn" title="Add key">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <button class="oc-icon-btn danger oc-app-clear-btn" title="Clear all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
            <div class="oc-scrollable oc-app-table-container"></div>
          </div>
        </div>
      </div>

      <!-- ── Settings Tab ── -->
      <div class="oc-tab-content oc-settings-tab">
        <div class="oc-settings-panel">

          <div class="oc-settings-group-label">Appearance</div>
          <div class="oc-settings-card">
            <div class="oc-settings-row">
              <div class="oc-settings-row-left">
                <span class="oc-settings-row-label">Dark Mode</span>
                <span class="oc-settings-row-desc">Switch between dark and light themes</span>
              </div>
              <label class="oc-toggle">
                <input type="checkbox" class="oc-settings-theme-toggle" ${currentThemeMode === 'dark' ? 'checked' : ''}>
                <span class="oc-toggle-track"></span>
              </label>
            </div>
          </div>

          <div class="oc-settings-group-label">Environment</div>
          <div class="oc-settings-card">
            <div class="oc-settings-row">
              <div class="oc-settings-row-left">
                <span class="oc-settings-row-label">Environment</span>
                <span class="oc-settings-row-desc">Current execution context</span>
              </div>
              <span class="oc-env-badge ${activeOptions.forceProd ? 'stag' : 'dev'}">
                ${activeOptions.forceProd ? 'Staging' : 'Development'}
              </span>
            </div>
            <div class="oc-settings-row">
              <div class="oc-settings-row-left">
                <span class="oc-settings-row-label">Force Production Mode</span>
                <span class="oc-settings-row-desc">Active: forceProd is ${activeOptions.forceProd ? 'enabled' : 'disabled'}</span>
              </div>
              <span class="oc-env-badge ${activeOptions.forceProd ? 'prod' : 'dev'}">
                ${activeOptions.forceProd ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          <div class="oc-settings-group-label">Panel Layout</div>
          <div class="oc-settings-card">
            <div class="oc-settings-row">
              <div class="oc-settings-row-left">
                <span class="oc-settings-row-label">Dock Position</span>
                <span class="oc-settings-row-desc">Current: <strong>${currentDock}</strong></span>
              </div>
              <select class="oc-select oc-settings-dock-select">
                <option value="bottom" ${currentDock === 'bottom' ? 'selected' : ''}>Bottom</option>
                <option value="left"   ${currentDock === 'left'   ? 'selected' : ''}>Left</option>
                <option value="right"  ${currentDock === 'right'  ? 'selected' : ''}>Right</option>
                <option value="free"   ${currentDock === 'free'   ? 'selected' : ''}>Floating</option>
              </select>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  rootEl.appendChild(badgeEl);
  rootEl.appendChild(panelEl);
  document.body.appendChild(rootEl);
}

function updateBadgePosition() {
  if (!badgeEl) return;
  const savedX = localStorage.getItem('oc-badge-x');
  const savedY = localStorage.getItem('oc-badge-y');
  
  if (savedX && savedY) {
    badgeEl.style.left = `${savedX}px`;
    badgeEl.style.top = `${savedY}px`;
  } else {
    // Top right default
    badgeEl.style.right = '20px';
    badgeEl.style.top = '20px';
  }
}

function updatePanelStyles() {
  if (!panelEl) return;

  // Clear styles
  panelEl.style.width = '';
  panelEl.style.height = '';
  panelEl.style.top = '';
  panelEl.style.bottom = '';
  panelEl.style.left = '';
  panelEl.style.right = '';

  const w = window.innerWidth;
  const h = window.innerHeight;

  if (currentDock === 'bottom') {
    const savedH = localStorage.getItem('oc-dock-bottom-height') || `${h * 0.4}px`;
    panelEl.style.height = savedH;
  } else if (currentDock === 'left') {
    const savedW = localStorage.getItem('oc-dock-left-width') || `${w * 0.35}px`;
    panelEl.style.width = savedW;
  } else if (currentDock === 'right') {
    const savedW = localStorage.getItem('oc-dock-right-width') || `${w * 0.35}px`;
    panelEl.style.width = savedW;
  } else if (currentDock === 'free') {
    const savedW = localStorage.getItem('oc-dock-free-width') || '600px';
    const savedH = localStorage.getItem('oc-dock-free-height') || '450px';
    const savedX = localStorage.getItem('oc-dock-free-x') || `${(w - 600) / 2}px`;
    const savedY = localStorage.getItem('oc-dock-free-y') || `${(h - 450) / 2}px`;

    panelEl.style.width = savedW;
    panelEl.style.height = savedH;
    panelEl.style.left = savedX;
    panelEl.style.top = savedY;
  }

  // Update active status on dock controls
  panelEl.querySelectorAll('.oc-btn-dock').forEach((btn) => {
    const dockType = btn.getAttribute('data-dock');
    const htmlBtn = btn as HTMLElement;
    if (dockType === currentDock) {
      htmlBtn.style.color = 'var(--oc-primary-color)';
    } else {
      htmlBtn.style.color = '';
    }
  });
}

function toggleConsole() {
  if (!panelEl) return;
  isPanelOpen = !isPanelOpen;
  if (isPanelOpen) {
    panelEl.classList.add('open');
    renderCurrentTab();
  } else {
    panelEl.classList.remove('open');
    // Destroy virtual lists to free memory
    if (logVirtualList) {
      logVirtualList.destroy();
      logVirtualList = null;
    }
    if (netVirtualList) {
      netVirtualList.destroy();
      netVirtualList = null;
    }
  }
}

function setupInteractions() {
  if (!badgeEl || !panelEl) return;

  // Toggle open
  badgeEl.addEventListener('click', (e) => {
    // If was dragging, don't trigger click
    if (badgeEl!.hasAttribute('data-was-dragging')) {
      badgeEl!.removeAttribute('data-was-dragging');
      return;
    }
    toggleConsole();
  });

  // Close btn
  panelEl.querySelector('.oc-btn-close')?.addEventListener('click', () => {
    toggleConsole();
  });

  // Tabs navigation
  panelEl.querySelectorAll('.oc-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab') || 'console';
      switchTab(targetTab);
    });
  });

  // Change dock modes
  panelEl.querySelectorAll('.oc-btn-dock').forEach((btn) => {
    btn.addEventListener('click', () => {
      const newDock = btn.getAttribute('data-dock') as any;
      setDockMode(newDock);
    });
  });

  // Draggable Badge setup
  setupBadgeDragging();

  // Resizable Panel setup
  setupPanelResizing();

  // Free-Floating header dragging setup
  setupHeaderDragging();

  // Console Tab events
  const searchInput = panelEl.querySelector('.oc-log-search-input') as HTMLInputElement;
  const filterSelect = panelEl.querySelector('.oc-log-filter-select') as HTMLSelectElement;
  
  searchInput?.addEventListener('input', () => refreshLogs());
  filterSelect?.addEventListener('change', () => refreshLogs());
  
  panelEl.querySelector('.oc-console-clear-btn')?.addEventListener('click', () => {
    clearLogs();
  });

  // Network Tab events
  const netSearchInput = panelEl.querySelector('.oc-net-search-input') as HTMLInputElement;
  netSearchInput?.addEventListener('input', () => refreshNetwork());
  
  panelEl.querySelector('.oc-net-clear-btn')?.addEventListener('click', () => {
    clearNetworkRequests();
    selectedRequest = null;
    refreshNetwork();
  });

  // Network details collapsibility
  panelEl.querySelector('.oc-network-details-panel')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const header = target.closest('.oc-detail-header');
    if (header) {
      const section = header.closest('.oc-detail-section');
      section?.classList.toggle('collapsed');
    }
  });

  // Application Tab Sidebar Navigation
  panelEl.querySelectorAll('.oc-app-sidebar-item').forEach((item) => {
    item.addEventListener('click', () => {
      panelEl!.querySelectorAll('.oc-app-sidebar-item').forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      currentStorageType = item.getAttribute('data-storage') as any;
      refreshStorage();
    });
  });

  const appSearchInput = panelEl.querySelector('.oc-app-search-input') as HTMLInputElement;
  appSearchInput?.addEventListener('input', () => refreshStorage());

  panelEl.querySelector('.oc-app-add-btn')?.addEventListener('click', () => {
    promptAddStorageKey();
  });

  panelEl.querySelector('.oc-app-clear-btn')?.addEventListener('click', () => {
    if (confirm(`Are you sure you want to clear all ${currentStorageType}?`)) {
      if (currentStorageType === 'local') clearStorage('local');
      else if (currentStorageType === 'session') clearStorage('session');
      else clearCookies();
      refreshStorage();
    }
  });

  // Settings Tab events
  const themeToggle = panelEl.querySelector('.oc-settings-theme-toggle') as HTMLInputElement;
  if (themeToggle) {
    themeToggle.addEventListener('change', () => {
      currentThemeMode = themeToggle.checked ? 'dark' : 'light';
      localStorage.setItem('oc-theme-mode', currentThemeMode);
      injectTheme(activeOptions.theme, currentThemeMode);
      injectUIStyles();
    });
  }

  const dockSelect = panelEl.querySelector('.oc-settings-dock-select') as HTMLSelectElement;
  if (dockSelect) {
    dockSelect.addEventListener('change', () => {
      const newDock = dockSelect.value as any;
      setDockMode(newDock);
    });
  }
}

function switchTab(tab: string) {
  currentTab = tab;
  if (!panelEl) return;

  panelEl.querySelectorAll('.oc-tab').forEach((el) => {
    if (el.getAttribute('data-tab') === tab) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  panelEl.querySelectorAll('.oc-tab-content').forEach((content) => {
    content.classList.remove('active');
  });

  panelEl.querySelector(`.oc-${tab}-tab`)?.classList.add('active');
  
  // Clean up unused virtual lists to save performance/renders
  if (tab !== 'console' && logVirtualList) {
    logVirtualList.destroy();
    logVirtualList = null;
  }
  if (tab !== 'network' && netVirtualList) {
    netVirtualList.destroy();
    netVirtualList = null;
  }

  renderCurrentTab();
}

function setDockMode(newDock: 'bottom' | 'left' | 'right' | 'free') {
  if (!panelEl) return;
  panelEl.classList.remove(`dock-${currentDock}`);
  currentDock = newDock;
  localStorage.setItem('oc-dock-mode', currentDock);
  
  // Re-generate resize handle
  const existingHandleSe = panelEl.querySelector('.oc-resize-handle-se');
  if (currentDock === 'free') {
    if (!existingHandleSe) {
      const handle = document.createElement('div');
      handle.className = 'oc-resize-handle-se';
      panelEl.appendChild(handle);
    }
  } else {
    existingHandleSe?.remove();
  }

  panelEl.classList.add(`dock-${currentDock}`);
  
  // Sync settings dropdown if it exists
  const dockSelect = panelEl.querySelector('.oc-settings-dock-select') as HTMLSelectElement;
  if (dockSelect) {
    dockSelect.value = currentDock;
  }

  updatePanelStyles();
  setupPanelResizing();
  
  // Re-render
  renderCurrentTab();
}

// Badge Dragging
function setupBadgeDragging() {
  if (!badgeEl) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialX = 0;
  let initialY = 0;
  let hasMoved = false;

  const dragStart = (e: MouseEvent | TouchEvent) => {
    isDragging = true;
    hasMoved = false;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    startX = clientX;
    startY = clientY;
    
    const rect = badgeEl!.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;

    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('touchend', dragEnd);
  };

  const dragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - startX;
    const dy = clientY - startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved = true;
      badgeEl!.setAttribute('data-was-dragging', 'true');
    }

    let newX = initialX + dx;
    let newY = initialY + dy;

    newX = Math.max(0, Math.min(window.innerWidth - badgeEl!.offsetWidth, newX));
    newY = Math.max(0, Math.min(window.innerHeight - badgeEl!.offsetHeight, newY));

    badgeEl!.style.left = `${newX}px`;
    badgeEl!.style.top = `${newY}px`;
    badgeEl!.style.bottom = 'auto';
    badgeEl!.style.right = 'auto';
  };

  const dragEnd = () => {
    if (!isDragging) return;
    isDragging = false;

    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('touchend', dragEnd);

    if (hasMoved) {
      const rect = badgeEl!.getBoundingClientRect();
      localStorage.setItem('oc-badge-x', String(rect.left));
      localStorage.setItem('oc-badge-y', String(rect.top));
    } else {
      badgeEl!.removeAttribute('data-was-dragging');
    }
  };

  badgeEl.addEventListener('mousedown', dragStart);
  badgeEl.addEventListener('touchstart', dragStart, { passive: true });
}

// Panel Header Dragging (for floating mode)
function setupHeaderDragging() {
  if (!panelEl) return;
  const header = panelEl.querySelector('.oc-header') as HTMLElement;
  if (!header) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialX = 0;
  let initialY = 0;

  const dragStart = (e: MouseEvent | TouchEvent) => {
    if (currentDock !== 'free') return;
    const target = e.target as HTMLElement;
    if (target.closest('.oc-header-controls')) return;

    isDragging = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    startX = clientX;
    startY = clientY;

    const rect = panelEl!.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;

    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('touchend', dragEnd);
  };

  const dragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    let newX = initialX + dx;
    let newY = initialY + dy;

    newX = Math.max(0, Math.min(window.innerWidth - panelEl!.offsetWidth, newX));
    newY = Math.max(0, Math.min(window.innerHeight - panelEl!.offsetHeight, newY));

    panelEl!.style.left = `${newX}px`;
    panelEl!.style.top = `${newY}px`;
  };

  const dragEnd = () => {
    if (!isDragging) return;
    isDragging = false;

    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('touchend', dragEnd);

    localStorage.setItem('oc-dock-free-x', panelEl!.style.left);
    localStorage.setItem('oc-dock-free-y', panelEl!.style.top);
  };

  header.addEventListener('mousedown', dragStart);
  header.addEventListener('touchstart', dragStart, { passive: true });
}

// Resizing Panel
function setupPanelResizing() {
  if (!panelEl) return;
  const handle = panelEl.querySelector('.oc-resize-handle') as HTMLElement;
  const handleSe = panelEl.querySelector('.oc-resize-handle-se') as HTMLElement;

  if (handle) {
    // Remove old listeners by replacing handle node
    const newHandle = handle.cloneNode(true) as HTMLElement;
    handle.parentNode!.replaceChild(newHandle, handle);

    let isResizing = false;
    let startSize = 0;
    let startMouse = 0;

    const resizeStart = (e: MouseEvent | TouchEvent) => {
      isResizing = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (currentDock === 'bottom') {
        startSize = panelEl!.offsetHeight;
        startMouse = clientY;
      } else if (currentDock === 'left') {
        startSize = panelEl!.offsetWidth;
        startMouse = clientX;
      } else if (currentDock === 'right') {
        startSize = panelEl!.offsetWidth;
        startMouse = clientX;
      }

      document.addEventListener('mousemove', resizeMove);
      document.addEventListener('mouseup', resizeEnd);
      document.addEventListener('touchmove', resizeMove, { passive: false });
      document.addEventListener('touchend', resizeEnd);
    };

    const resizeMove = (e: MouseEvent | TouchEvent) => {
      if (!isResizing) return;
      if (e.cancelable) e.preventDefault();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (currentDock === 'bottom') {
        const dy = clientY - startMouse;
        const newH = Math.max(150, Math.min(window.innerHeight - 50, startSize - dy));
        panelEl!.style.height = `${newH}px`;
      } else if (currentDock === 'left') {
        const dx = clientX - startMouse;
        const newW = Math.max(200, Math.min(window.innerWidth - 50, startSize + dx));
        panelEl!.style.width = `${newW}px`;
      } else if (currentDock === 'right') {
        const dx = clientX - startMouse;
        const newW = Math.max(200, Math.min(window.innerWidth - 50, startSize - dx));
        panelEl!.style.width = `${newW}px`;
      }
    };

    const resizeEnd = () => {
      if (!isResizing) return;
      isResizing = false;

      document.removeEventListener('mousemove', resizeMove);
      document.removeEventListener('mouseup', resizeEnd);
      document.removeEventListener('touchmove', resizeMove);
      document.removeEventListener('touchend', resizeEnd);

      if (currentDock === 'bottom') {
        localStorage.setItem('oc-dock-bottom-height', panelEl!.style.height);
      } else if (currentDock === 'left') {
        localStorage.setItem('oc-dock-left-width', panelEl!.style.width);
      } else if (currentDock === 'right') {
        localStorage.setItem('oc-dock-right-width', panelEl!.style.width);
      }
    };

    newHandle.addEventListener('mousedown', resizeStart as any);
    newHandle.addEventListener('touchstart', resizeStart as any, { passive: true });
  }

  // SE corner resizing (only for free float mode)
  if (handleSe && currentDock === 'free') {
    let isResizing = false;
    let startW = 0;
    let startH = 0;
    let startX = 0;
    let startY = 0;

    const resizeSeStart = (e: MouseEvent | TouchEvent) => {
      isResizing = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      startW = panelEl!.offsetWidth;
      startH = panelEl!.offsetHeight;
      startX = clientX;
      startY = clientY;

      document.addEventListener('mousemove', resizeSeMove);
      document.addEventListener('mouseup', resizeSeEnd);
      document.addEventListener('touchmove', resizeSeMove, { passive: false });
      document.addEventListener('touchend', resizeSeEnd);
    };

    const resizeSeMove = (e: MouseEvent | TouchEvent) => {
      if (!isResizing) return;
      if (e.cancelable) e.preventDefault();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const dx = clientX - startX;
      const dy = clientY - startY;

      const newW = Math.max(300, Math.min(window.innerWidth - panelEl!.offsetLeft, startW + dx));
      const newH = Math.max(250, Math.min(window.innerHeight - panelEl!.offsetTop, startH + dy));

      panelEl!.style.width = `${newW}px`;
      panelEl!.style.height = `${newH}px`;
    };

    const resizeSeEnd = () => {
      if (!isResizing) return;
      isResizing = false;

      document.removeEventListener('mousemove', resizeSeMove);
      document.removeEventListener('mouseup', resizeSeEnd);
      document.removeEventListener('touchmove', resizeSeMove);
      document.removeEventListener('touchend', resizeSeEnd);

      localStorage.setItem('oc-dock-free-width', panelEl!.style.width);
      localStorage.setItem('oc-dock-free-height', panelEl!.style.height);
    };

    handleSe.addEventListener('mousedown', resizeSeStart as any);
    handleSe.addEventListener('touchstart', resizeSeStart as any, { passive: true });
  }
}

// ----------------- TAB RENDERING -----------------

function renderCurrentTab() {
  if (currentTab === 'console') {
    refreshLogs();
  } else if (currentTab === 'network') {
    refreshNetwork();
  } else if (currentTab === 'application') {
    refreshStorage();
  }
}

// 1. CONSOLE TAB
function refreshLogs() {
  if (!panelEl || currentTab !== 'console') return;
  const container = panelEl.querySelector('.oc-logs-container') as HTMLElement;
  const scrollEl = panelEl.querySelector('.oc-console-scroll') as HTMLElement;
  if (!container || !scrollEl) return;

  const searchInput = panelEl.querySelector('.oc-log-search-input') as HTMLInputElement;
  const filterSelect = panelEl.querySelector('.oc-log-filter-select') as HTMLSelectElement;

  const query = searchInput?.value.toLowerCase() || '';
  const filter = filterSelect?.value || 'all';

  const rawLogs = getLogs();

  const filteredLogs = rawLogs.filter((log) => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (query) {
      const matchQuery = log.args.some((arg) => {
        try {
          return String(arg).toLowerCase().includes(query);
        } catch (e) {
          return false;
        }
      });
      return matchQuery || (log.stack && log.stack.toLowerCase().includes(query));
    }
    return true;
  });

  const shouldVirtualize = filteredLogs.length > 500;

  if (shouldVirtualize) {
    if (!logVirtualList) {
      container.innerHTML = '';
      logVirtualList = new VirtualList({
        container: scrollEl,
        items: filteredLogs,
        itemHeight: 28,
        renderItem: (log, idx) => createLogElement(log, true),
      });
    } else {
      logVirtualList.updateItems(filteredLogs);
    }
  } else {
    // Normal render
    if (logVirtualList) {
      logVirtualList.destroy();
      logVirtualList = null;
      // Re-create simple DOM
      container.innerHTML = '';
      scrollEl.style.position = '';
      scrollEl.style.overflowY = 'auto';
      // Append logs spacer container back
      const c = document.createElement('div');
      c.className = 'oc-logs-container';
      scrollEl.appendChild(c);
    }
    
    const logsWrap = scrollEl.querySelector('.oc-logs-container') as HTMLElement;
    if (logsWrap) {
      logsWrap.innerHTML = '';
      const fragment = document.createDocumentFragment();
      filteredLogs.forEach((log) => {
        fragment.appendChild(createLogElement(log, false));
      });
      logsWrap.appendChild(fragment);
    }
  }

  // Scroll to bottom if we are near bottom
  if (!shouldVirtualize) {
    scrollEl.scrollTop = scrollEl.scrollHeight;
  } else if (logVirtualList) {
    logVirtualList.scrollToBottom();
  }
}

function createLogElement(log: ConsoleLog, fixedHeight: boolean): HTMLDivElement {
  const row = document.createElement('div');
  row.className = `oc-log-row ${log.level}`;
  if (fixedHeight) {
    row.style.height = '28px';
    row.style.lineHeight = '20px';
  }

  const meta = document.createElement('div');
  meta.className = 'oc-log-meta';
  
  const timeStr = log.timestamp.toTimeString().split(' ')[0];
  const time = document.createElement('span');
  time.textContent = timeStr;
  meta.appendChild(time);
  
  if (log.level !== 'log') {
    const levelBadge = document.createElement('span');
    levelBadge.className = 'oc-log-level-badge';
    levelBadge.textContent = log.level;
    meta.appendChild(levelBadge);
  }
  
  row.appendChild(meta);

  const body = document.createElement('div');
  body.className = 'oc-log-body';

  log.args.forEach((arg) => {
    const parsedNode = renderJsonTree(arg);
    body.appendChild(parsedNode);
  });

  row.appendChild(body);

  if (log.stack) {
    const caller = document.createElement('div');
    caller.className = 'oc-log-caller';
    caller.textContent = log.stack;
    caller.title = log.stack;
    row.appendChild(caller);
  }

  return row;
}

// Interactive JSON Inspector Tree view
function renderJsonTree(val: any): HTMLElement {
  const root = document.createElement('span');
  root.className = 'oc-json-tree';

  if (val === null) {
    const el = document.createElement('span');
    el.style.color = 'var(--oc-error-color)';
    el.textContent = 'null';
    root.appendChild(el);
    return root;
  }
  if (val === '__oc_undefined__') {
    const el = document.createElement('span');
    el.style.color = 'var(--oc-text-color-dim)';
    el.style.fontStyle = 'italic';
    el.textContent = 'undefined';
    root.appendChild(el);
    return root;
  }
  
  if (typeof val !== 'object') {
    const el = document.createElement('span');
    if (typeof val === 'string') {
      el.style.color = 'var(--oc-network-color)'; // Muted soft green
      el.textContent = `"${val}"`;
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      el.style.color = 'var(--oc-app-color)'; // Muted soft purple/violet
      el.textContent = String(val);
    } else {
      el.textContent = String(val);
    }
    root.appendChild(el);
    return root;
  }

  // Object or Array
  const isArray = Array.isArray(val);
  const keys = Object.keys(val);
  
  if (keys.length === 0) {
    const el = document.createElement('span');
    el.style.color = 'var(--oc-text-color-dim)';
    el.textContent = isArray ? '[]' : '{}';
    root.appendChild(el);
    return root;
  }

  const summary = document.createElement('span');
  summary.className = 'oc-json-summary';
  summary.style.cursor = 'pointer';
  summary.style.display = 'inline-flex';
  summary.style.alignItems = 'center';

  const arrow = document.createElement('span');
  arrow.innerHTML = '&#9656; '; // right
  arrow.style.display = 'inline-block';
  arrow.style.transition = 'transform 0.15s ease';
  arrow.style.marginRight = '4px';
  summary.appendChild(arrow);

  const typeLabel = document.createElement('span');
  typeLabel.style.color = 'var(--oc-primary-color)';
  typeLabel.style.fontWeight = 'bold';
  if (isArray) {
    typeLabel.textContent = `Array(${keys.length})`;
  } else {
    typeLabel.textContent = `Object`;
  }
  summary.appendChild(typeLabel);

  const content = document.createElement('div');
  content.className = 'oc-json-content';
  content.style.display = 'none';
  content.style.paddingLeft = '12px';
  content.style.borderLeft = '1px dashed var(--oc-border-color)';
  content.style.marginTop = '2px';
  content.style.marginBottom = '2px';

  for (const key of keys) {
    const row = document.createElement('div');
    row.style.margin = '2px 0';
    row.style.display = 'flex';
    row.style.alignItems = 'flex-start';

    const keyLabel = document.createElement('span');
    keyLabel.style.color = '#e2e8f0'; // Warm light silver/gray keys
    keyLabel.style.marginRight = '6px';
    keyLabel.style.fontWeight = 'bold';
    keyLabel.textContent = `${key}:`;

    row.appendChild(keyLabel);
    row.appendChild(renderJsonTree(val[key]));
    content.appendChild(row);
  }

  let isOpen = false;
  summary.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen = !isOpen;
    if (isOpen) {
      arrow.innerHTML = '&#9662; '; // down
      content.style.display = 'block';
    } else {
      arrow.innerHTML = '&#9656; '; // right
      content.style.display = 'none';
    }
  });

  root.appendChild(summary);
  root.appendChild(content);
  return root;
}

// 2. NETWORK TAB
function refreshNetwork() {
  if (!panelEl || currentTab !== 'network') return;
  const listContainer = panelEl.querySelector('.oc-network-requests-list') as HTMLElement;
  const scrollEl = panelEl.querySelector('.oc-network-scroll') as HTMLElement;
  if (!listContainer || !scrollEl) return;

  const searchInput = panelEl.querySelector('.oc-net-search-input') as HTMLInputElement;
  const query = searchInput?.value.toLowerCase() || '';

  const rawRequests = getNetworkRequests();
  const filteredRequests = rawRequests.filter((req) => {
    return req.url.toLowerCase().includes(query) || req.method.toLowerCase().includes(query);
  });

  const shouldVirtualize = filteredRequests.length > 500;

  if (shouldVirtualize) {
    if (!netVirtualList) {
      listContainer.innerHTML = '';
      netVirtualList = new VirtualList({
        container: scrollEl,
        items: filteredRequests,
        itemHeight: 45,
        renderItem: (req, idx) => createNetElement(req),
      });
    } else {
      netVirtualList.updateItems(filteredRequests);
    }
  } else {
    if (netVirtualList) {
      netVirtualList.destroy();
      netVirtualList = null;
      listContainer.innerHTML = '';
      scrollEl.style.position = '';
      scrollEl.style.overflowY = 'auto';
      const c = document.createElement('div');
      c.className = 'oc-network-requests-list';
      scrollEl.appendChild(c);
    }

    const listWrap = scrollEl.querySelector('.oc-network-requests-list') as HTMLElement;
    if (listWrap) {
      listWrap.innerHTML = '';
      const fragment = document.createDocumentFragment();
      filteredRequests.forEach((req) => {
        fragment.appendChild(createNetElement(req));
      });
      listWrap.appendChild(fragment);
    }
  }

  // Details
  renderNetworkDetails();
}

function createNetElement(req: NetworkRequest): HTMLDivElement {
  const row = document.createElement('div');
  row.className = `oc-net-row ${req.status === 'pending' ? 'pending' : (req.status >= 400 || req.status === 0 ? 'failed' : '')}`;
  if (selectedRequest && selectedRequest.id === req.id) {
    row.classList.add('active');
  }

  const left = document.createElement('div');
  left.style.display = 'flex';
  left.style.flexDirection = 'column';
  left.style.gap = '2px';
  left.style.overflow = 'hidden';
  left.style.flex = '1';

  const methodUrl = document.createElement('div');
  methodUrl.style.display = 'flex';
  methodUrl.style.alignItems = 'center';
  methodUrl.style.gap = '6px';
  methodUrl.style.overflow = 'hidden';

  const method = document.createElement('span');
  method.style.fontWeight = 'bold';
  method.style.fontSize = '10px';
  method.textContent = req.method;
  methodUrl.appendChild(method);

  const url = document.createElement('span');
  url.className = 'oc-net-url';
  try {
    const urlObj = new URL(req.url);
    url.textContent = urlObj.pathname + urlObj.search;
  } catch (e) {
    url.textContent = req.url;
  }
  methodUrl.appendChild(url);
  left.appendChild(methodUrl);

  const meta = document.createElement('div');
  meta.style.display = 'flex';
  meta.style.gap = '8px';
  meta.style.fontSize = '10px';
  meta.style.color = 'var(--oc-text-color-dim)';

  const timeStr = req.timestamp.toTimeString().split(' ')[0];
  meta.innerHTML = `<span>${timeStr}</span>`;
  if (req.duration) {
    meta.innerHTML += `<span>&bull; ${req.duration}ms</span>`;
  }
  left.appendChild(meta);
  row.appendChild(left);

  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.alignItems = 'center';
  right.style.gap = '6px';

  const type = document.createElement('span');
  type.className = `oc-net-badge ${req.type}`;
  type.textContent = req.type.toUpperCase();
  right.appendChild(type);

  const status = document.createElement('span');
  status.className = 'oc-net-status';
  status.textContent = String(req.status);
  right.appendChild(status);

  row.appendChild(right);

  row.addEventListener('click', () => {
    selectedRequest = req;
    panelEl!.querySelectorAll('.oc-net-row').forEach((r) => r.classList.remove('active'));
    row.classList.add('active');
    renderNetworkDetails();
  });

  return row;
}

function renderNetworkDetails() {
  if (!panelEl) return;
  const container = panelEl.querySelector('.oc-network-details-panel') as HTMLElement;
  if (!container) return;

  if (!selectedRequest) {
    container.innerHTML = `<div class="oc-net-details-empty">Select a request to view details</div>`;
    return;
  }

  const req = selectedRequest;

  let headersHtml = '';
  if (req.requestHeaders && Object.keys(req.requestHeaders).length > 0) {
    headersHtml = Object.entries(req.requestHeaders)
      .map(([k, v]) => `<div class="oc-kv-row"><span class="oc-kv-key">${k}:</span><span class="oc-kv-val">${v}</span></div>`)
      .join('');
  } else {
    headersHtml = '<div style="color:var(--oc-text-color-dim);">No headers</div>';
  }

  let respHeadersHtml = '';
  if (req.responseHeaders && Object.keys(req.responseHeaders).length > 0) {
    respHeadersHtml = Object.entries(req.responseHeaders)
      .map(([k, v]) => `<div class="oc-kv-row"><span class="oc-kv-key">${k}:</span><span class="oc-kv-val">${v}</span></div>`)
      .join('');
  } else {
    respHeadersHtml = '<div style="color:var(--oc-text-color-dim);">No headers</div>';
  }

  let reqBodyHtml = '';
  if (req.requestBody) {
    reqBodyHtml = typeof req.requestBody === 'object' ? JSON.stringify(req.requestBody, null, 2) : String(req.requestBody);
  } else {
    reqBodyHtml = 'No request body';
  }

  let respBodyHtml = '';
  if (req.responseBody) {
    respBodyHtml = typeof req.responseBody === 'object' ? JSON.stringify(req.responseBody, null, 2) : String(req.responseBody);
  } else if (req.error) {
    respBodyHtml = `Error: ${req.error}`;
  } else {
    respBodyHtml = 'Empty response body';
  }

  container.innerHTML = `
    <div class="oc-detail-section">
      <div class="oc-detail-header">
        <span>General</span>
        <svg class="oc-detail-header-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <div class="oc-detail-body">
        <div class="oc-kv-row"><span class="oc-kv-key">Request URL:</span><span class="oc-kv-val" style="word-break:break-all;">${req.url}</span></div>
        <div class="oc-kv-row"><span class="oc-kv-key">Request Method:</span><span class="oc-kv-val">${req.method}</span></div>
        <div class="oc-kv-row"><span class="oc-kv-key">Status Code:</span><span class="oc-kv-val ${typeof req.status === 'number' && (req.status >= 400 || req.status === 0) ? 'oc-text-error' : 'oc-text-success'}">${req.status}</span></div>
        <div class="oc-kv-row"><span class="oc-kv-key">Type:</span><span class="oc-kv-val">${req.type.toUpperCase()}</span></div>
        <div class="oc-kv-row"><span class="oc-kv-key">Timestamp:</span><span class="oc-kv-val">${req.timestamp.toISOString()}</span></div>
      </div>
    </div>
    
    <div class="oc-detail-section">
      <div class="oc-detail-header">
        <span>Request Headers</span>
        <svg class="oc-detail-header-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <div class="oc-detail-body">${headersHtml}</div>
    </div>
    
    <div class="oc-detail-section">
      <div class="oc-detail-header">
        <span>Request Payload</span>
        <svg class="oc-detail-header-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <div class="oc-detail-body" style="font-family:monospace; font-size:11px;">${reqBodyHtml}</div>
    </div>
    
    <div class="oc-detail-section">
      <div class="oc-detail-header">
        <span>Response Headers</span>
        <svg class="oc-detail-header-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <div class="oc-detail-body">${respHeadersHtml}</div>
    </div>
    
    <div class="oc-detail-section">
      <div class="oc-detail-header">
        <span>Response Body</span>
        <svg class="oc-detail-header-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <div class="oc-detail-body" style="font-family:monospace; font-size:11px;">${respBodyHtml}</div>
    </div>
  `;
}

// 3. APPLICATION STORAGE TAB
function refreshStorage() {
  if (!panelEl || currentTab !== 'application') return;
  const container = panelEl.querySelector('.oc-app-table-container') as HTMLElement;
  if (!container) return;

  const searchInput = panelEl.querySelector('.oc-app-search-input') as HTMLInputElement;
  const query = searchInput?.value.toLowerCase() || '';

  let data: StorageItem[] = [];
  if (currentStorageType === 'local') {
    data = getStorageData('local');
  } else if (currentStorageType === 'session') {
    data = getStorageData('session');
  } else {
    data = getCookies();
  }

  const filteredData = data.filter((item) => {
    return item.key.toLowerCase().includes(query) || item.value.toLowerCase().includes(query);
  });

  if (filteredData.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 20px; color:var(--oc-text-color-dim); font-style:italic;">No records found</div>`;
    return;
  }

  const table = document.createElement('table');
  table.className = 'oc-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th style="width:30%;">Key</th>
        <th>Value</th>
        <th style="width:100px; text-align:center;">Actions</th>
      </tr>
    </thead>
    <tbody>
    </tbody>
  `;

  const tbody = table.querySelector('tbody')!;
  filteredData.forEach((item) => {
    const tr = document.createElement('tr');
    
    const keyTd = document.createElement('td');
    keyTd.style.fontWeight = 'bold';
    keyTd.textContent = item.key;
    tr.appendChild(keyTd);
    
    const valTd = document.createElement('td');
    valTd.textContent = item.value;
    valTd.style.cursor = 'pointer';
    valTd.title = 'Double click to edit';
    
    // Inline editing handler
    valTd.addEventListener('dblclick', () => {
      const input = document.createElement('textarea');
      input.className = 'oc-input';
      input.style.width = '100%';
      input.style.height = '60px';
      input.value = item.value;
      
      const saveBtn = document.createElement('button');
      saveBtn.className = 'oc-btn';
      saveBtn.style.border = '1px solid var(--oc-primary-color)';
      saveBtn.style.color = 'var(--oc-primary-color)';
      saveBtn.style.marginTop = '4px';
      saveBtn.textContent = 'Save';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'oc-btn';
      cancelBtn.style.border = '1px solid var(--oc-text-color-dim)';
      cancelBtn.style.color = 'var(--oc-text-color-dim)';
      cancelBtn.style.marginTop = '4px';
      cancelBtn.style.marginLeft = '8px';
      cancelBtn.textContent = 'Cancel';

      const editContainer = document.createElement('div');
      editContainer.appendChild(input);
      editContainer.appendChild(saveBtn);
      editContainer.appendChild(cancelBtn);

      valTd.innerHTML = '';
      valTd.appendChild(editContainer);

      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newVal = input.value;
        if (currentStorageType === 'local' || currentStorageType === 'session') {
          setStorageItem(currentStorageType, item.key, newVal);
        } else {
          setCookie(item.key, newVal);
        }
        refreshStorage();
      });

      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        refreshStorage();
      });
    });

    tr.appendChild(valTd);

    const actTd = document.createElement('td');
    actTd.style.textAlign = 'center';
    
    const delBtn = document.createElement('button');
    delBtn.className = 'oc-btn';
    delBtn.style.color = 'var(--oc-error-color)';
    delBtn.innerHTML = '&times;';
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', () => {
      if (currentStorageType === 'local' || currentStorageType === 'session') {
        deleteStorageItem(currentStorageType, item.key);
      } else {
        deleteCookie(item.key);
      }
      refreshStorage();
    });

    actTd.appendChild(delBtn);
    tr.appendChild(actTd);

    tbody.appendChild(tr);
  });

  container.innerHTML = '';
  container.appendChild(table);
}

function promptAddStorageKey() {
  const key = prompt(`Enter key name for ${currentStorageType}:`);
  if (!key) return;
  const value = prompt(`Enter value for key '${key}':`) || '';
  
  if (currentStorageType === 'local' || currentStorageType === 'session') {
    setStorageItem(currentStorageType, key, value);
  } else {
    setCookie(key, value);
  }
  refreshStorage();
}
