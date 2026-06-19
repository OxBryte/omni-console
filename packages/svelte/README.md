# @omniconsole/svelte

[![Documentation](https://img.shields.io/badge/docs-console.oxbryte.xyz-blue)](https://console.oxbryte.xyz)
[![npm version](https://img.shields.io/npm/v/@omniconsole/svelte.svg)](https://www.npmjs.com/package/@omniconsole/svelte)

Svelte layout wrapper and directive integration for the **OmniConsole** in-app developer toolbar.

Official Documentation: [console.oxbryte.xyz](https://console.oxbryte.xyz)

## Installation

Install both the Svelte wrapper and the core library:

```bash
npm install @omniconsole/svelte omniconsole
# or
yarn add @omniconsole/svelte omniconsole
```

## Usage

Use the custom svelte action directive on your main layout container:

```html
<script>
  import { omniconsole } from '@omniconsole/svelte';
</script>

<div use:omniconsole={{ enabled: true, defaultDock: 'bottom' }}>
  <slot />
</div>
```

For detailed options, theme customization, and API parameters, please visit [console.oxbryte.xyz](https://console.oxbryte.xyz).

---

## Keywords

`developer-toolbar`, `svelte`, `svelte-console`, `mobile-debugging`, `devtools`, `in-app-console`, `debugging`

