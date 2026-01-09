import type { PlaywrightPluginConfig } from '../types';

export const defaultConfig: Required<PlaywrightPluginConfig> = {
  output: 'playwright-mocks',
  generateBuilders: true,
  generateErrorMocks: true,
  baseUrlPattern: '**/api/**',
  mockStrategy: 'static',
  generateMsw: false,
};

export function resolveConfig(
  config: PlaywrightPluginConfig = {}
): Required<PlaywrightPluginConfig> {
  return {
    ...defaultConfig,
    ...config,
  };
}

export function validateConfig(config: PlaywrightPluginConfig): string[] {
  const errors: string[] = [];

  if (config.output && typeof config.output !== 'string') {
    errors.push('output must be a string');
  }

  if (config.mockStrategy && !['static', 'zod'].includes(config.mockStrategy)) {
    errors.push('mockStrategy must be "static" or "zod"');
  }

  return errors;
}
