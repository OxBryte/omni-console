import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OmniConsole',
      fileName: (format) => `omniconsole.${format === 'es' ? 'mjs' : 'umd.js'}`,
      formats: ['es', 'umd'],
    },
    sourcemap: true,
    minify: 'esbuild',
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
    }),
  ],
});
