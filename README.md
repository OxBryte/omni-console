# OmniConsole

[![Documentation](https://img.shields.io/badge/docs-console.oxbryte.xyz-blue)](https://console.oxbryte.xyz)

**OmniConsole** is an open-source, ultra-lightweight, customizable in-app developer toolbar distributed as a zero-dependency npm package. It mirrors the core features of standard browser developer tools—specifically the **Console**, **Network**, and **Application (Storage)** tabs—directly within the application viewport.

Official Documentation: [console.oxbryte.xyz](https://console.oxbryte.xyz)

---

## Key Features

* 🚀 **Frictionless Mobile Debugging:** Inspect log outputs, throw values, and monitor network calls directly on small screen viewports, simulators, PWAs, or embedded web views.
* 📦 **Zero-Dependency Footprint:** Written in raw client-side TypeScript. The final gzipped bundle size is only **~13KB**.
* ⚡️ **60 FPS List Virtualization:** Uses dynamic virtualization for Console and Network lists when entries exceed 500 items to maintain fluid application scroll performance.
* 🔒 **Production Guards:** Automatically resolves to a no-operation stub in production environments by default, preventing sensitive data leaks.
* 🎨 **Sleek, Minimalist Theme:** Out-of-the-box modern dark/light system styling using custom CSS variables matching developer brand guidelines.
* 🔌 **Framework Wrappers:** Seamless integration wrappers for React, Vue, and Svelte.

---

## Installation

```bash
npm install omniconsole
# or
yarn add omniconsole
```

---

## Getting Started

Initialize the console at the entry point of your application (e.g. `main.ts` or `index.js`).

```typescript
import { initOmniConsole } from 'omniconsole';

// Initialize console overrides
initOmniConsole({
  enabled: process.env.NODE_ENV !== 'production',
  defaultDock: 'bottom',
  blacklistedUrls: [
    'https://telemetry.yourdomain.com'
  ]
});
```

---

## Configuration API Options

You can pass the following properties during initialization:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `true` | When false, disables console overrides and hides the floating widget. |
| `defaultDock` | `'bottom' \| 'left' \| 'right' \| 'free'` | `'bottom'` | Sets the initial position of the console panel. |
| `blacklistedUrls` | `string[]` | `[]` | Excludes matched network calls from appearing in the Network tab. |
| `forceProd` | `boolean` | `false` | Bypasses safety checks to force enable OmniConsole on staging or preview production builds. |
| `theme` | `OmniConsoleTheme` | `DEFAULT_DARK` | An object mapping theme variables to override brand accent colors. |

---

## Framework Integration Wrappers

### React
Import the hook or component wrapper from `@omniconsole/react`:

```tsx
import { useOmniConsole } from '@omniconsole/react';

function App() {
  useOmniConsole({
    defaultDock: 'right'
  });

  return (
    <div className="app">
      <h1>My Application</h1>
    </div>
  );
}
```

### Vue
Register the Vue plugin globally in your main script wrapper:

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import { OmniConsolePlugin } from '@omniconsole/vue';

const app = createApp(App);
app.use(OmniConsolePlugin, {
  defaultDock: 'left'
});
app.mount('#app');
```

### Svelte
Use the Svelte action directive on your wrapper layout element:

```html
<script>
  import { omniconsole } from '@omniconsole/svelte';
</script>

<div use:omniconsole={{ defaultDock: 'bottom' }}>
  <slot />
</div>
```

---

## Local Development & Playground

To preview the landing page, documentation, and play with event triggers:

1. Clone the repository and install workspaces:
   ```bash
   npm install
   ```
2. Start the hot-reloading development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:5173/](http://localhost:5173/) in your web browser.
