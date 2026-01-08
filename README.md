# hey-api-playwright

Generate type-safe Playwright E2E test fixtures and route mocks from your OpenAPI specification.

## Installation

```bash
npm install hey-api-playwright --save-dev
```

### Peer Dependencies

This package requires:

- `@hey-api/openapi-ts` >= 0.61.0
- `@playwright/test` >= 1.40.0
- `hey-api-builders` >= 0.1.0

## Usage

### Configuration

Add the plugin to your `openapi-ts.config.ts`:

```typescript
import { defineConfig } from '@hey-api/openapi-ts';
import playwrightPlugin from 'hey-api-playwright';

export default defineConfig({
  input: './openapi.yaml',
  output: './src/generated',
  plugins: [
    '@hey-api/typescript',
    'hey-api-builders',
    playwrightPlugin({
      generateBuilders: true,
      generateErrorMocks: true,
    }),
  ],
});
```

### Generated Output

The plugin generates a `playwright-mocks.gen.ts` file with:

#### 1. Static Fixtures

```typescript
export const fixtures = {
  getUsersResponse: { users: [{ id: "550e8400-...", name: "aaaaa" }] },
  getUsersError404: { message: "Not found", code: "NOT_FOUND" },
};
```

#### 2. Route Handlers

Quick one-liners for common mocking scenarios:

```typescript
import { mockGetUsers, mockGetUsersError404 } from './generated/playwright-mocks.gen';

test('shows user list', async ({ page }) => {
  await mockGetUsers(page);
  await page.goto('/users');
  await expect(page.getByRole('list')).toBeVisible();
});

test('handles 404', async ({ page }) => {
  await mockGetUsersError404(page);
  await page.goto('/users');
  await expect(page.getByText('Not found')).toBeVisible();
});
```

#### 3. Fluent Builders

For complex test scenarios with custom data:

```typescript
import { GetUsersMock } from './generated/playwright-mocks.gen';

test('handles empty state', async ({ page }) => {
  await new GetUsersMock()
    .with({ users: [] })
    .apply(page);
  
  await page.goto('/users');
  await expect(page.getByText('No users')).toBeVisible();
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `output` | `string` | `'playwright-mocks.gen.ts'` | Output file path |
| `generateBuilders` | `boolean` | `true` | Generate fluent builder classes |
| `generateErrorMocks` | `boolean` | `true` | Generate 4xx/5xx error fixtures |
| `baseUrlPattern` | `string` | `'**'` | Base URL pattern for route matching |
| `mockStrategy` | `'static' \| 'zod'` | `'static'` | Mock data generation strategy |

## How It Works

1. Parses your OpenAPI spec using `@hey-api/openapi-ts`
2. Extracts operations (paths + methods) and their response schemas
3. Uses `hey-api-builders` to generate typed mock data
4. Outputs Playwright-specific route handlers and fixtures

## License

MIT
