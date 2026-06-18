# omniconsole

[![Documentation](https://img.shields.io/badge/docs-console.oxbryte.xyz-blue)](https://console.oxbryte.xyz)
[![npm version](https://img.shields.io/npm/v/omniconsole.svg)](https://www.npmjs.com/package/omniconsole)

The core package for **OmniConsole** — an ultra-lightweight, customizable in-app developer toolbar. It mirrors the Console, Network, and Storage developer tab instruments directly inside your viewport.

Official Documentation: [console.oxbryte.xyz](https://console.oxbryte.xyz)

## Installation

```bash
npm install omniconsole
# or
yarn add omniconsole
```

## Quick Start

Initialize the toolbar in your application's entrypoint (e.g. `main.ts` or `index.js`):

```typescript
import { initOmniConsole } from 'omniconsole';

initOmniConsole({
  enabled: process.env.NODE_ENV !== 'production',
  defaultDock: 'bottom'
});
```

For detailed configuration options and theme setup, please visit [console.oxbryte.xyz](https://console.oxbryte.xyz).
