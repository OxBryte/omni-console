# @omniconsole/vue

[![Documentation](https://img.shields.io/badge/docs-console.oxbryte.xyz-blue)](https://console.oxbryte.xyz)
[![npm version](https://img.shields.io/npm/v/@omniconsole/vue.svg)](https://www.npmjs.com/package/@omniconsole/vue)

Vue plugin integration wrapper for the **OmniConsole** in-app developer toolbar.

Official Documentation: [console.oxbryte.xyz](https://console.oxbryte.xyz)

## Installation

Install both the Vue wrapper and the core library:

```bash
npm install @omniconsole/vue omniconsole
# or
yarn add @omniconsole/vue omniconsole
```

## Usage

Register the plugin globally in your main Vue app mount:

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import { OmniConsolePlugin } from '@omniconsole/vue';

const app = createApp(App);
app.use(OmniConsolePlugin, {
  enabled: true,
  defaultDock: 'left'
});
app.mount('#app');
```

For detailed options, theme customization, and API parameters, please visit [console.oxbryte.xyz](https://console.oxbryte.xyz).

---

## Keywords

`developer-toolbar`, `vue`, `vue-console`, `mobile-debugging`, `devtools`, `in-app-console`, `debugging`

