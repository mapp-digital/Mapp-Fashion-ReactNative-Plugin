import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment - jsdom for React components and hooks
    environment: 'jsdom',

    // Global test setup
    setupFiles: ['./src/__tests__/test-utils/setup.ts'],

    // Include only SDK tests (src folder)
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    // Exclude app folder and other non-SDK files
    exclude: [
      'node_modules/**',
      'app/**',
      'components/**',
      'assets/**',
      'data/**',
      '.expo/**',
      'dist/**',
      '.{idea,git,cache,output,temp}/**',
      '{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],

    // Test globals (describe, it, expect, etc.)
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
        'src/__tests__/**',
        'src/**/__mocks__/**',
        'src/**/types/**',
        'src/**/enums/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Test timeout
    testTimeout: 10000,

    // Hook timeout
    hookTimeout: 10000,

    // Mock configurations
    deps: {
      // Mock axios and other external dependencies
      external: [
        'axios',
        'react-native-keychain',
        '@snowplow/react-native-tracker',
      ],
    },
  },

  // Path resolution to match your tsconfig
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      src: resolve(__dirname, './src'),
    },
  },

  // Define for React
  define: {
    __DEV__: true,
  },
});
