import type { PlaywrightPluginConfig } from './types';
import { handler } from './plugin/handler';
import { resolveConfig, validateConfig } from './plugin/config';

export function playwrightPlugin(config: PlaywrightPluginConfig = {}) {
  const errors = validateConfig(config);
  if (errors.length > 0) {
    throw new Error(`Invalid playwright plugin config: ${errors.join(', ')}`);
  }

  const resolved = resolveConfig(config);

  return {
    name: 'hey-api-playwright',
    output: resolved.output,
    config: resolved,
    handler,
  };
}

export { handler } from './plugin/handler';
export { defaultConfig, resolveConfig, validateConfig } from './plugin/config';
export { collectOperations } from './core/operation-collector';
export {
  openApiPathToGlob,
  openApiPathToRegex,
  extractPathParams,
  transformPath,
  methodToFunctionName,
  operationToFixtureName,
} from './core/path-transformer';
export { generateFixtures, generateFixtureTypes } from './generators/playwright-fixture-generator';
export { generateRouteHandlers } from './generators/playwright-route-generator';
export { generateMockBuilders } from './generators/playwright-builder-generator';

export type { PlaywrightPluginConfig, OperationMeta, ResponseMeta, HttpMethod } from './types';

export default playwrightPlugin;
