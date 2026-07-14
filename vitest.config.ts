import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '**/*.d.ts',
        'src/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 30000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@config': path.resolve(__dirname, './src/config'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@errors': path.resolve(__dirname, './src/errors'),
      '@interfaces': path.resolve(__dirname, './src/interfaces'),
      '@models': path.resolve(__dirname, './src/models'),
      '@dto': path.resolve(__dirname, './src/dto'),
      '@validators': path.resolve(__dirname, './src/validators'),
      '@providers': path.resolve(__dirname, './src/providers'),
      '@services': path.resolve(__dirname, './src/services'),
      '@pipeline': path.resolve(__dirname, './src/pipeline'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@middleware': path.resolve(__dirname, './src/middleware'),
      '@events': path.resolve(__dirname, './src/events'),
      '@metrics': path.resolve(__dirname, './src/metrics'),
      '@cache': path.resolve(__dirname, './src/cache'),
      '@prompts': path.resolve(__dirname, './src/prompts'),
      '@plugins': path.resolve(__dirname, './src/plugins'),
      '@health': path.resolve(__dirname, './src/health'),
    },
  },
});
