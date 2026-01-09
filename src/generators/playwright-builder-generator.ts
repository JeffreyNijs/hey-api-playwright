import type { OperationMeta } from '../types';
import {
  openApiPathToGlob,
  openApiPathToRegex,
  operationToFixtureName,
} from '../core/path-transformer';

export interface BuilderGeneratorOptions {
  baseUrlPattern: string;
  generateErrorMocks: boolean;
}

export function generateMockBuilders(
  operations: OperationMeta[],
  options: BuilderGeneratorOptions
): string {
  let code = '/**\n * Fluent mock builders for complex test scenarios\n */\n\n';

  for (const operation of operations) {
    const builders = generateOperationBuilders(operation, options);
    code += builders;
  }

  return code;
}

function generateOperationBuilders(
  operation: OperationMeta,
  options: BuilderGeneratorOptions
): string {
  const { operationId, method, path, responses } = operation;
  const { baseUrlPattern, generateErrorMocks } = options;

  const globPattern = openApiPathToGlob(path, baseUrlPattern);
  const regexPattern = openApiPathToRegex(path, baseUrlPattern);
  let code = '';

  for (const response of responses) {
    if (!response.schemaName) continue;
    if (response.isError && !generateErrorMocks) continue;

    const className = generateBuilderClassName(operationId, response.statusCode);
    const fixtureName = operationToFixtureName(operationId, response.statusCode);

    code += generateBuilderClass(
      className,
      response.schemaName,
      fixtureName,
      method,
      globPattern,
      regexPattern,
      response.statusCode
    );
  }

  return code;
}

function generateBuilderClassName(operationId: string, statusCode: number): string {
  const baseName = operationId.charAt(0).toUpperCase() + operationId.slice(1);

  if (statusCode >= 200 && statusCode < 300) {
    return `${baseName}Mock`;
  }

  return `${baseName}Error${statusCode}Mock`;
}

function generateBuilderClass(
  className: string,
  schemaName: string,
  fixtureName: string,
  method: string,
  globPattern: string,
  regexPattern: RegExp,
  statusCode: number
): string {
  // Escape the regex for embedding in a template literal
  const regexStr = regexPattern.source;
  return `
export class ${className} {
  private data: types.${schemaName};

  /** Glob pattern for this endpoint (may match too broadly) */
  static readonly globPattern = '${globPattern}';

  /** Precise regex pattern for this endpoint (handles query params) */
  static readonly pattern = /${regexStr.replace(/\$$/g, '(\\?.*)?$')}/;

  constructor() {
    this.data = structuredClone(fixtures.${fixtureName});
  }

  /**
   * Override specific fields in the mock data
   */
  with(overrides: Partial<types.${schemaName}>): this {
    this.data = { ...this.data, ...overrides };
    return this;
  }

  /**
   * Get the current mock data
   */
  build(): types.${schemaName} {
    return structuredClone(this.data);
  }

  /**
   * Apply this mock to a Playwright page
   * @param page - The Playwright page
   * @param pattern - Route pattern (uses static pattern by default)
   */
  async apply(page: Page, pattern: string | RegExp = ${className}.pattern): Promise<void> {
    const data = this.data;
    await page.route(pattern, async (route) => {
      if (route.request().method().toLowerCase() !== '${method}') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: ${statusCode},
        json: data,
      });
    });
  }
}

`;
}
