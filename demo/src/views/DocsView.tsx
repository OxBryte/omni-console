import { useState } from 'react';
import CodeEditor from '../components/CodeEditor';

export default function DocsView() {
  const [activeDocSection, setActiveDocSection] = useState<'installation' | 'getting-started' | 'configuration' | 'react' | 'vue' | 'svelte' | 'security'>('installation');

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
            <div>
              {/* Docs Hero Strip */}
              <div className="docs-page-hero" onMouseMove={handleHeroMouseMove}>
                <div className="hero-stars-glow"></div>
                <div className="hero-grid-glow"></div>

                <div className="docs-page-hero-content">
                  <div className="pill-announcement">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.85 }}>
                      <path d="M12 2L14.7 9.3L22 12L14.7 14.7L12 22L9.3 14.7L2 12L9.3 9.3Z" />
                    </svg>
                    <span>Documentation</span>
                  </div>
                  <h1 className="docs-page-hero-title">
                    Developer <span>Docs</span>
                  </h1>
                  <p className="docs-page-hero-subtitle">Everything you need to instrument, configure, and deploy OmniConsole in any stack.</p>
                </div>
              </div>

              <div className="section-container">
              <div className="docs-container">
              <aside className="docs-sidebar">
                <div className="docs-sidebar-group-label">Getting Started</div>
                <div className={`docs-sidebar-item ${activeDocSection === 'installation' ? 'active' : ''}`} onClick={() => setActiveDocSection('installation')}><span className="sidebar-dot"></span>Installation</div>
                <div className={`docs-sidebar-item ${activeDocSection === 'getting-started' ? 'active' : ''}`} onClick={() => setActiveDocSection('getting-started')}><span className="sidebar-dot"></span>Quick Start</div>
                <div className="docs-sidebar-group-label">Reference</div>
                <div className={`docs-sidebar-item ${activeDocSection === 'configuration' ? 'active' : ''}`} onClick={() => setActiveDocSection('configuration')}><span className="sidebar-dot"></span>Configuration API</div>
                <div className="docs-sidebar-group-label">Framework Guides</div>
                <div className={`docs-sidebar-item ${activeDocSection === 'react' ? 'active' : ''}`} onClick={() => setActiveDocSection('react')}><span className="sidebar-dot"></span>React</div>
                <div className={`docs-sidebar-item ${activeDocSection === 'vue' ? 'active' : ''}`} onClick={() => setActiveDocSection('vue')}><span className="sidebar-dot"></span>Vue</div>
                <div className={`docs-sidebar-item ${activeDocSection === 'svelte' ? 'active' : ''}`} onClick={() => setActiveDocSection('svelte')}><span className="sidebar-dot"></span>Svelte</div>
                <div className="docs-sidebar-group-label">Security</div>
                <div className={`docs-sidebar-item ${activeDocSection === 'security' ? 'active' : ''}`} onClick={() => setActiveDocSection('security')}><span className="sidebar-dot"></span>Production Guard</div>
              </aside>

              <div className="docs-content">

                {/* ── INSTALLATION ── */}
                {activeDocSection === 'installation' && (
                  <section className="docs-section">
                    <div className="docs-breadcrumb">
                      <span>Docs</span><span className="docs-breadcrumb-sep">›</span><span>Installation</span>
                    </div>
                    <h1 className="docs-h1">Installation</h1>
                    <p className="docs-lead">Add OmniConsole to your project in seconds. Zero dependencies, full TypeScript support out of the box.</p>

                    <div className="docs-callout info">
                      <span className="docs-callout-icon">📦</span>
                      <div className="docs-callout-body">
                        <p className="docs-callout-title">Requirements</p>
                        <p className="docs-callout-desc">Requires a modern browser environment (Chrome 90+, Firefox 88+, Safari 15+) and any ES module-compatible build tool such as Vite, Webpack, or esbuild.</p>
                      </div>
                    </div>

                    <h2 className="docs-h2">npm</h2>
                    <CodeEditor code='npm install omniconsole' tabName='terminal' />

                    <h2 className="docs-h2">yarn</h2>
                    <CodeEditor code='yarn add omniconsole' tabName='terminal' />

                    <h2 className="docs-h2">pnpm</h2>
                    <CodeEditor code='pnpm add omniconsole' tabName='terminal' />

                    <hr className="docs-divider" />

                    <h2 className="docs-h2">What's included</h2>
                    <div className="docs-feature-grid">
                      <div className="docs-feature-card">
                        <div className="docs-feature-card-icon" style={{ background: 'rgba(56,189,248,0.1)' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                        </div>
                        <p className="docs-feature-card-title">Console Interceptor</p>
                        <p className="docs-feature-card-desc">Patches <code className="docs-inline-code">console.log/warn/error</code> to stream structured JSON trees into the viewport panel.</p>
                      </div>
                      <div className="docs-feature-card">
                        <div className="docs-feature-card-icon" style={{ background: 'rgba(167,139,250,0.1)' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                        </div>
                        <p className="docs-feature-card-title">Network Monitor</p>
                        <p className="docs-feature-card-desc">Wraps <code className="docs-inline-code">fetch</code> and <code className="docs-inline-code">XMLHttpRequest</code> to capture method, status, and latency per request.</p>
                      </div>
                      <div className="docs-feature-card">
                        <div className="docs-feature-card-icon" style={{ background: 'rgba(52,211,153,0.1)' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path></svg>
                        </div>
                        <p className="docs-feature-card-title">Storage Inspector</p>
                        <p className="docs-feature-card-desc">Reactively tracks <code className="docs-inline-code">localStorage</code>, <code className="docs-inline-code">sessionStorage</code>, and cookies with live diff detection.</p>
                      </div>
                      <div className="docs-feature-card">
                        <div className="docs-feature-card-icon" style={{ background: 'rgba(251,191,36,0.1)' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                        <p className="docs-feature-card-title">Environment Guard</p>
                        <p className="docs-feature-card-desc">Auto stubs itself out in production builds — zero code reaches end users unless you explicitly opt in with <code className="docs-inline-code">forceProd</code>.</p>
                      </div>
                    </div>
                  </section>
                )}

                {/* ── QUICK START ── */}
                {activeDocSection === 'getting-started' && (
                  <section className="docs-section">
                    <div className="docs-breadcrumb">
                      <span>Docs</span><span className="docs-breadcrumb-sep">›</span><span>Quick Start</span>
                    </div>
                    <h1 className="docs-h1">Quick Start</h1>
                    <p className="docs-lead">Get OmniConsole running in your app in under two minutes. Initialize it at the entry-point before any other code runs.</p>

                    <div className="docs-steps">
                      <div className="docs-step">
                        <div className="docs-step-num">1</div>
                        <div className="docs-step-body">
                          <p className="docs-step-title">Install the package</p>
                          <p className="docs-step-desc">Run the install command for your package manager of choice.</p>
                        </div>
                      </div>
                      <div className="docs-step">
                        <div className="docs-step-num">2</div>
                        <div className="docs-step-body">
                          <p className="docs-step-title">Call <code className="docs-inline-code">initOmniConsole()</code> at your app entry</p>
                          <p className="docs-step-desc">Place it at the top of <code className="docs-inline-code">main.ts</code> or <code className="docs-inline-code">index.js</code> — before React/Vue/Svelte mounts — to ensure all browser API patches apply first.</p>
                        </div>
                      </div>
                      <div className="docs-step">
                        <div className="docs-step-num">3</div>
                        <div className="docs-step-body">
                          <p className="docs-step-title">Open your browser and start logging</p>
                          <p className="docs-step-desc">The floating OmniConsole badge appears in the corner. Click to expand the full dashboard panel.</p>
                        </div>
                      </div>
                    </div>

                    <h2 className="docs-h2">Minimal setup</h2>
                    <CodeEditor code={`import { initOmniConsole } from 'omniconsole';

// Place this at the very top of your entry file
initOmniConsole({
  enabled: process.env.NODE_ENV !== 'production',
  defaultDock: 'bottom'
});`} tabName='main.ts' />

                    <div className="docs-callout success">
                      <span className="docs-callout-icon">✓</span>
                      <div className="docs-callout-body">
                        <p className="docs-callout-title">You're good to go</p>
                        <p className="docs-callout-desc">OmniConsole automatically detects your <code className="docs-inline-code">NODE_ENV</code> and disables itself in production. No extra config needed for safe deployments.</p>
                      </div>
                    </div>

                    <h2 className="docs-h2">Vite + React example</h2>
                    <CodeEditor code={`// main.tsx
import { initOmniConsole } from 'omniconsole';
import { createRoot } from 'react-dom/client';
import App from './App';

initOmniConsole({ defaultDock: 'bottom' });

createRoot(document.getElementById('root')!).render(<App />);`} tabName='main.tsx' />
                  </section>
                )}

                {/* ── CONFIGURATION ── */}
                {activeDocSection === 'configuration' && (
                  <section className="docs-section">
                    <div className="docs-breadcrumb">
                      <span>Docs</span><span className="docs-breadcrumb-sep">›</span><span>Configuration API</span>
                    </div>
                    <h1 className="docs-h1">Configuration API</h1>
                    <p className="docs-lead">All config is passed as a single options object to <code className="docs-inline-code">initOmniConsole()</code>. Every field is optional — sensible defaults ship out of the box.</p>

                    <CodeEditor code={`import { initOmniConsole } from 'omniconsole';

initOmniConsole({
  enabled: true,
  defaultDock: 'bottom',
  blacklistedUrls: ['/health', '/metrics'],
  forceProd: false,
  maxLogBuffer: 500,
  theme: {
    accentColor: '#38bdf8',
    background: '#09090b'
  }
});`} tabName='main.ts' />

                    <h2 className="docs-h2">Options reference</h2>
                    <table className="params-table">
                      <thead>
                        <tr>
                          <th>Property</th>
                          <th>Type</th>
                          <th>Default</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>enabled</code></td>
                          <td className="td-type">boolean</td>
                          <td className="td-default">true</td>
                          <td>Master switch. When false, all patches are no-ops and nothing renders.</td>
                        </tr>
                        <tr>
                          <td><code>defaultDock</code></td>
                          <td className="td-type">'bottom' | 'left' | 'right' | 'free'</td>
                          <td className="td-default">'bottom'</td>
                          <td>Initial anchor position of the expandable dashboard panel.</td>
                        </tr>
                        <tr>
                          <td><code>blacklistedUrls</code></td>
                          <td className="td-type">string[]</td>
                          <td className="td-default">[]</td>
                          <td>URL substrings — matching requests are excluded from the Network tab.</td>
                        </tr>
                        <tr>
                          <td><code>forceProd</code></td>
                          <td className="td-type">boolean</td>
                          <td className="td-default">false</td>
                          <td>Bypasses the production environment guard. Useful for staging QA.</td>
                        </tr>
                        <tr>
                          <td><code>theme</code></td>
                          <td className="td-type">OmniConsoleTheme</td>
                          <td className="td-default">DEFAULT_DARK</td>
                          <td>Token overrides for dashboard colors, font sizes, and border radii.</td>
                        </tr>
                        <tr>
                          <td><code>maxLogBuffer</code></td>
                          <td className="td-type">number</td>
                          <td className="td-default">500</td>
                          <td>Maximum console log entries retained before rolling eviction.</td>
                        </tr>
                        <tr>
                          <td><code>networkTimeout</code></td>
                          <td className="td-type">number</td>
                          <td className="td-default">30000</td>
                          <td>Timeout (ms) after which a request is flagged as stalled in the Network tab.</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="docs-callout warning">
                      <span className="docs-callout-icon">⚠</span>
                      <div className="docs-callout-body">
                        <p className="docs-callout-title">Avoid forceProd in CI/CD pipelines</p>
                        <p className="docs-callout-desc">Hard-coding <code className="docs-inline-code">forceProd: true</code> inside your production bundle exposes internal telemetry to end users. Always gate it behind a domain check or environment variable.</p>
                      </div>
                    </div>
                  </section>
                )}

                {/* ── REACT ── */}
                {activeDocSection === 'react' && (
                  <section className="docs-section">
                    <div className="docs-breadcrumb">
                      <span>Docs</span><span className="docs-breadcrumb-sep">›</span><span>Frameworks</span><span className="docs-breadcrumb-sep">›</span><span>React</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h1 className="docs-h1" style={{ margin: 0 }}>React Integration</h1>
                      <span className="docs-tag blue">React 18+</span>
                      <span className="docs-tag purple">TypeScript</span>
                    </div>
                    <p className="docs-lead">Use <code className="docs-inline-code">@omniconsole/react</code> for hooks-based initialization and component wrapper patterns.</p>

                    <CodeEditor code='npm install @omniconsole/react' tabName='terminal' />

                    <h2 className="docs-h2">useOmniConsole Hook</h2>
                    <p className="docs-p">The easiest integration pattern. Call the hook once in your root component. It initializes on mount and cleans up on unmount automatically.</p>
                    <CodeEditor code={`import { useOmniConsole } from '@omniconsole/react';

function App() {
  useOmniConsole({
    enabled: import.meta.env.DEV,
    defaultDock: 'right'
  });

  return (
    <div className="layout">
      <h1>My App</h1>
    </div>
  );
}`} tabName='App.tsx' />

                    <h2 className="docs-h2">{'<OmniConsole />'} Component</h2>
                    <p className="docs-p">Drop the component anywhere in your tree. It renders nothing visible — it's a side-effect-only initializer that handles its own lifecycle.</p>
                    <CodeEditor code={`import { OmniConsole } from '@omniconsole/react';

function App() {
  return (
    <div className="layout">
      <OmniConsole
        enabled={import.meta.env.DEV}
        defaultDock="bottom"
        blacklistedUrls={['/analytics']}
      />
      <Router>
        <Routes />
      </Router>
    </div>
  );
}`} tabName='App.tsx' />

                    <div className="docs-callout info">
                      <span className="docs-callout-icon">💡</span>
                      <div className="docs-callout-body">
                        <p className="docs-callout-title">Strict Mode compatible</p>
                        <p className="docs-callout-desc">OmniConsole handles React 18's double-invocation of effects in Strict Mode gracefully. Internal patches are idempotent and won't stack.</p>
                      </div>
                    </div>
                  </section>
                )}

                {/* ── VUE ── */}
                {activeDocSection === 'vue' && (
                  <section className="docs-section">
                    <div className="docs-breadcrumb">
                      <span>Docs</span><span className="docs-breadcrumb-sep">›</span><span>Frameworks</span><span className="docs-breadcrumb-sep">›</span><span>Vue</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h1 className="docs-h1" style={{ margin: 0 }}>Vue Integration</h1>
                      <span className="docs-tag green">Vue 3</span>
                      <span className="docs-tag purple">TypeScript</span>
                    </div>
                    <p className="docs-lead">Register OmniConsole as a Vue plugin. It respects Vue's app lifecycle and cleans up on <code className="docs-inline-code">app.unmount()</code>.</p>

                    <CodeEditor code='npm install @omniconsole/vue' tabName='terminal' />

                    <h2 className="docs-h2">Plugin registration</h2>
                    <p className="docs-p">Register the plugin before calling <code className="docs-inline-code">app.mount()</code>. Options are passed as the second argument to <code className="docs-inline-code">app.use()</code>.</p>
                    <CodeEditor code={`import { createApp } from 'vue';
import App from './App.vue';
import { OmniConsolePlugin } from '@omniconsole/vue';

const app = createApp(App);

app.use(OmniConsolePlugin, {
  enabled: import.meta.env.DEV,
  defaultDock: 'left'
});

app.mount('#app');`} tabName='main.ts' />

                    <h2 className="docs-h2">Composition API</h2>
                    <p className="docs-p">For finer-grained control, use the composable directly inside any component:</p>
                    <CodeEditor code={`<script setup lang="ts">
import { useOmniConsole } from '@omniconsole/vue';

useOmniConsole({
  defaultDock: 'bottom',
  blacklistedUrls: ['/internal']
});
</script>

<template>
  <div>Your component content</div>
</template>`} tabName='App.vue' />
                  </section>
                )}

                {/* ── SVELTE ── */}
                {activeDocSection === 'svelte' && (
                  <section className="docs-section">
                    <div className="docs-breadcrumb">
                      <span>Docs</span><span className="docs-breadcrumb-sep">›</span><span>Frameworks</span><span className="docs-breadcrumb-sep">›</span><span>Svelte</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h1 className="docs-h1" style={{ margin: 0 }}>Svelte Integration</h1>
                      <span className="docs-tag" style={{ color: '#f97316', background: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.2)' }}>Svelte 4+</span>
                    </div>
                    <p className="docs-lead">Attach OmniConsole using Svelte's native action API. The directive applies on mount and tears down on destroy — no lifecycle boilerplate needed.</p>

                    <CodeEditor code='npm install @omniconsole/svelte' tabName='terminal' />

                    <h2 className="docs-h2">Action directive</h2>
                    <p className="docs-p">Use <code className="docs-inline-code">use:omniconsole</code> on your root layout wrapper. It accepts the same options object as <code className="docs-inline-code">initOmniConsole()</code>.</p>
                    <CodeEditor code={`<script>
  import { omniconsole } from '@omniconsole/svelte';

  const options = {
    enabled: import.meta.env.DEV,
    defaultDock: 'bottom'
  };
</script>

<div use:omniconsole={options}>
  <slot />
</div>`} tabName='Layout.svelte' />

                    <div className="docs-callout info">
                      <span className="docs-callout-icon">💡</span>
                      <div className="docs-callout-body">
                        <p className="docs-callout-title">SvelteKit support</p>
                        <p className="docs-callout-desc">Apply the action in <code className="docs-inline-code">+layout.svelte</code> to scope it across the entire route tree. It works correctly across client-side navigations.</p>
                      </div>
                    </div>
                  </section>
                )}

                {/* ── SECURITY ── */}
                {activeDocSection === 'security' && (
                  <section className="docs-section">
                    <div className="docs-breadcrumb">
                      <span>Docs</span><span className="docs-breadcrumb-sep">›</span><span>Security</span><span className="docs-breadcrumb-sep">›</span><span>Production Guard</span>
                    </div>
                    <h1 className="docs-h1">Production Guard</h1>
                    <p className="docs-lead">OmniConsole auto-detects production environments and replaces all its internals with silent no-op stubs — ensuring zero code leaks to end users.</p>

                    <div className="docs-callout danger">
                      <span className="docs-callout-icon">🔒</span>
                      <div className="docs-callout-body">
                        <p className="docs-callout-title">Default behavior in production</p>
                        <p className="docs-callout-desc">When <code className="docs-inline-code">NODE_ENV === 'production'</code>, OmniConsole replaces itself with an empty module — no console patches, no UI, no bundle weight. This happens automatically.</p>
                      </div>
                    </div>

                    <h2 className="docs-h2">How the guard works</h2>
                    <div className="docs-steps">
                      <div className="docs-step">
                        <div className="docs-step-num">1</div>
                        <div className="docs-step-body">
                          <p className="docs-step-title">Environment detection</p>
                          <p className="docs-step-desc">On init, OmniConsole reads <code className="docs-inline-code">process.env.NODE_ENV</code>. If it's <code className="docs-inline-code">'production'</code> and <code className="docs-inline-code">forceProd</code> is not set, it exits immediately with no side effects.</p>
                        </div>
                      </div>
                      <div className="docs-step">
                        <div className="docs-step-num">2</div>
                        <div className="docs-step-body">
                          <p className="docs-step-title">Noop stub injection</p>
                          <p className="docs-step-desc">A stub module replaces all exported functions with empty no-ops. Tree-shaking then eliminates even those stubs from the final bundle output.</p>
                        </div>
                      </div>
                      <div className="docs-step">
                        <div className="docs-step-num">3</div>
                        <div className="docs-step-body">
                          <p className="docs-step-title">Zero footprint</p>
                          <p className="docs-step-desc">The production build adds less than 200 bytes to your bundle. The full interactive panel is never shipped to end users.</p>
                        </div>
                      </div>
                    </div>

                    <h2 className="docs-h2">Staging override</h2>
                    <p className="docs-p">To enable OmniConsole in a production-built staging environment, gate <code className="docs-inline-code">forceProd</code> behind a hostname check:</p>
                    <CodeEditor code={`initOmniConsole({
  enabled: true,
  // Only activates on staging — never hard-code true
  forceProd: window.location.hostname.includes('staging.yourdomain.com')
});`} tabName='main.ts' />

                    <div className="docs-callout warning">
                      <span className="docs-callout-icon">⚠</span>
                      <div className="docs-callout-body">
                        <p className="docs-callout-title">Never hard-code forceProd: true</p>
                        <p className="docs-callout-desc">Always gate <code className="docs-inline-code">forceProd</code> on a domain check or env variable. Hard-coding it risks exposing developer tooling to real users in production.</p>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
          </div>
  );
}
