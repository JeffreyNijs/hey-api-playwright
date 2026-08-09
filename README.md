# hey-api-playwright (deprecated)

> **This package was deprecated on 2026-08-09 and this repository is archived.**
> Use Hey API's built-in [`msw` plugin](https://heyapi.dev/docs/openapi/typescript/plugins/msw)
> with [`@msw/playwright`](https://github.com/mswjs/playwright) instead.

`hey-api-playwright` will not receive a compatibility release for current Hey API versions.
Existing published versions remain available so installations stay reproducible, but they should
not be used for new work.

## Why it was retired

The package duplicated responsibilities that now have maintained upstream implementations:

- Hey API generates typed MSW handlers directly from OpenAPI operations.
- Hey API's Faker plugin generates schema-constrained request, response, and model factories.
- `@msw/playwright` runs ordinary MSW handlers through Playwright's network routing.

Maintaining a second generator for route matching, mock bodies, and response types would add drift
without adding a durable capability. Version 0.3.0 also targets an obsolete custom-plugin API and is
not compatible with current `@hey-api/openapi-ts` releases.

## Migration

Remove the deprecated package and install the maintained stack:

```sh
npm uninstall hey-api-playwright
npm install --save-dev @faker-js/faker @hey-api/openapi-ts @msw/playwright @playwright/test msw
```

Generate TypeScript types, Faker factories, and MSW handlers:

```ts
// openapi-ts.config.ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi.yaml',
  output: './src/generated',
  plugins: [
    '@hey-api/typescript',
    {
      name: '@faker-js/faker',
      maxCallDepth: 3,
    },
    'msw',
  ],
});
```

Create the default handlers using the generated Faker response factories:

```ts
// tests/api-handlers.ts
import { fakeGetPetResponse200 } from '../src/generated/@faker-js/faker.gen';
import { createMswHandlers } from '../src/generated/msw.gen';

const api = createMswHandlers({ baseUrl: 'http://localhost:3000/api' });

export const handlers = [
  api.pick.getPet({
    body: fakeGetPetResponse200(),
    status: 200,
  }),
];
```

Expose them to Playwright through an automatic network fixture:

```ts
// tests/fixtures.ts
import { test as base } from '@playwright/test';
import { defineNetworkFixture, type NetworkFixture } from '@msw/playwright';
import type { AnyHandler } from 'msw';

import { handlers } from './api-handlers';

type Fixtures = {
  handlers: Array<AnyHandler>;
  network: NetworkFixture;
};

export const test = base.extend<Fixtures>({
  handlers: [handlers, { option: true }],
  network: [
    async ({ context, handlers }, use) => {
      const network = defineNetworkFixture({ context, handlers });
      await network.enable();
      await use(network);
      await network.disable();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
```

Per-test overrides use the same generated, typed handler factory:

```ts
import { fakeGetPetResponse200 } from '../src/generated/@faker-js/faker.gen';
import { createMswHandlers } from '../src/generated/msw.gen';
import { expect, test } from './fixtures';

test('shows a named pet', async ({ network, page }) => {
  network.use(
    createMswHandlers({ baseUrl: 'http://localhost:3000/api' }).pick.getPet({
      body: fakeGetPetResponse200({ useDefault: true }),
    }),
  );

  await page.goto('/pets/1');
  await expect(page).toHaveURL(/pets/);
});
```

The generated factory names reflect your own operation IDs and status codes. See the
[Hey API Faker documentation](https://heyapi.dev/docs/openapi/typescript/plugins/faker),
[Hey API MSW documentation](https://heyapi.dev/docs/openapi/typescript/plugins/msw), and
[`@msw/playwright` usage guide](https://github.com/mswjs/playwright#usage) for the maintained APIs.

## Historical source

The source remains in this repository for auditability. The final published version was `0.3.0`.
No new npm version is planned.

## License

MIT
