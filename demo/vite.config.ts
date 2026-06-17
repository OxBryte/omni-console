import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      'omniconsole': resolve(__dirname, '../packages/core/src/index.ts'),
      '@omniconsole/react': resolve(__dirname, '../packages/react/src/index.tsx'),
    },
  },
});
