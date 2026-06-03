import { defineConfig } from 'vitest/config';
import path from 'node:path';

const defaultIncludes = ['src/**/*.test.ts', 'src/**/*.test.tsx'];
const hasExplicitTestsFilter = process.argv.some((arg) => arg.startsWith('tests/'));

export default defineConfig({
  test: {
    environment: 'node',
    include: hasExplicitTestsFilter
      ? [...defaultIncludes, 'tests/**/*.test.ts', 'tests/**/*.test.tsx']
      : defaultIncludes,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
