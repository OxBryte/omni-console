# @omniconsole/react

[![Documentation](https://img.shields.io/badge/docs-console.oxbryte.xyz-blue)](https://console.oxbryte.xyz)
[![npm version](https://img.shields.io/npm/v/@omniconsole/react.svg)](https://www.npmjs.com/package/@omniconsole/react)

React wrapper hook and component integration for **OmniConsole** in-app developer toolbar.

Official Documentation: [console.oxbryte.xyz](https://console.oxbryte.xyz)

## Installation

Install both the React wrapper and the core library:

```bash
npm install @omniconsole/react omniconsole
# or
yarn add @omniconsole/react omniconsole
```

## Usage

Call the hook at the root of your application wrapper component:

```tsx
import { useOmniConsole } from '@omniconsole/react';

function App() {
  useOmniConsole({
    enabled: process.env.NODE_ENV !== 'production',
    defaultDock: 'bottom'
  });

  return (
    <div className="app">
      <h1>My Application</h1>
    </div>
  );
}
```

For detailed options, theme customization, and API parameters, please visit [console.oxbryte.xyz](https://console.oxbryte.xyz).
