import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['@hey-api/openapi-ts', '@playwright/test', 'hey-api-builders'],
});
