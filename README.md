# hey-api-playwright

Generate type-safe Playwright E2E test fixtures, route mocks, and consistent data builders from your OpenAPI specification.

This plugin for `@hey-api/openapi-ts` bridges the gap between your API definition and Playwright tests, ensuring your test data always matches your API schema.

## Features

- **Automated Route Mocking**: Generates `page.route()` helpers for every API operation.
- **Type-safe Fixtures**: Mock data is validated against your OpenAPI schemas using Zod.
- **Fluent Builders**: Override default mock data easily with a chainable `.with()` API.
- **Strict Mode Compatibility**: ensuring your tests never drift from the API contract.
- **Integration Ready**: Works seamlessly with `@playwright/test`.

## Installation

```bash
npm install hey-api-playwright hey-api-builders --save-dev
```

### Peer Dependencies

Ensure you have the following installed:

- `@hey-api/openapi-ts` >= 0.61.0
- `@playwright/test` >= 1.40.0

## Configuration

Add the plugin to your `openapi-ts.config.ts`. You must also include `hey-api-builders` as it powers the data generation.

```typescript
import { defineConfig } from '@hey-api/openapi-ts';
import playwrightPlugin from 'hey-api-playwright';
import { buildersPlugin } from 'hey-api-builders';

export default defineConfig({
  input: './openapi.yaml',
  output: './src/generated',
  plugins: [
    '@hey-api/typescript',
    buildersPlugin({
      schema: './src/generated/schemas.ts' // Optional: if using schema references
    }),
    playwrightPlugin({
      generateBuilders: true,
      generateErrorMocks: true,
    }),
  ],
});
```

Run the generator:

```bash
npx openapi-ts
```

This will produce a `playwright-mocks.gen.ts` file in your output directory.

## Usage

### 1. Basic Route Mocking

For simple tests where you just need the API to return a valid 200 OK response with default data:

```typescript
import { test, expect } from '@playwright/test';
import { mockViewUsers, mockCreateUser } from './generated/playwright-mocks.gen';

test('renders user list', async ({ page }) => {
  // Mocks GET /users with default generated data matching the schema
  await mockViewUsers(page);
  
  await page.goto('/users');
  await expect(page.getByRole('list')).toBeVisible();
});
```

### 2. Fluent Builders (Recommended)

For more complex scenarios where you need specific data states, use the generated Mock classes with the Builder pattern. This allows you to override specific fields while keeping the rest compliant with the schema.

```typescript
import { test, expect } from '@playwright/test';
import { ViewUsersMock } from './generated/playwright-mocks.gen';

test('renders specific users', async ({ page }) => {
  // Override specific fields, rest are auto-generated
  await new ViewUsersMock()
    .with({
      items: [
        { id: 'user-123', name: 'Alice', role: 'ADMIN' },
        { id: 'user-456', name: 'Bob', role: 'USER' }
      ],
      meta: { total: 2 }
    })
    .apply(page); // Applies the route handler
    
  await page.goto('/users');
  await expect(page.getByText('Alice')).toBeVisible();
  await expect(page.getByText('Bob')).toBeVisible();
});
```

### 3. Pattern Matching

By default, mocks match the path defined in OpenAPI. You can override the matching logic (e.g., regex for query params) when applying the mock.

```typescript
// Match strict URL
await new ViewUsersMock().apply(page, '**/api/v1/users');

// Match with Regex (useful for query params)
await new ViewUsersMock().apply(page, /.*\/api\/v1\/users(\?.*)?$/);
```

### 4. Global Fixtures

You can combine these with Playwright's `test` fixtures to set up common mocks for all tests.

```typescript
// fixtures.ts
import { test as base } from '@playwright/test';
import { ViewMeMock } from './generated/playwright-mocks.gen';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Gloablly mock the "Get Current User" endpoint
    await new ViewMeMock()
      .with({ id: 'test-user', email: 'test@example.com' })
      .apply(page);
      
    await use(page);
  },
});
```

## How It Works

1. **Schema Parsing**: Parses your OpenAPI spec to understand all available operations and data models.
2. **Builder Generation**: Uses `hey-api-builders` to create `Builder` classes for every response schema. These builders can generate valid mock data instantly.
3. **Route Generation**: Creates `Mock` classes that wrap Playwright's `page.route()`.
4. **Runtime Validation**: When you call `.with()`, TypeScript ensures you only pass valid fields. The underlying Zod schemas ensure the final response is valid.

## License

MIT
