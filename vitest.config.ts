import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@mojodoc/parser': './packages/parser/src/index.ts',
      '@mojodoc/transform': './packages/transform/src/index.ts',
      '@mojodoc/renderer': './packages/renderer/src/index.ts',
    },
  },
});
