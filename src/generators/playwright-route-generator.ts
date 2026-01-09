import type { OperationMeta } from '../types';
import {
  openApiPathToRegex,
  methodToFunctionName,
  operationToFixtureName,
} from '../core/path-transformer';

export interface RouteGeneratorOptions {
  baseUrlPattern: string;
  generateErrorMocks: boolean;
}

export function generateRouteHandlers(
  operations: OperationMeta[],
  options: RouteGeneratorOptions
): string {
  let code = '/**\n * Route handler functions for mocking API responses\n */\n\n';

  for (const operation of operations) {
    code += generateRouteHandler(operation, options);
  }

  return code;
}

function generateRouteHandler(operation: OperationMeta, options: RouteGeneratorOptions): string {
  const { operationId, method, path, responses } = operation;
  const { baseUrlPattern } = options;

  const functionName = methodToFunctionName(method, operationId);
  const regexPattern = openApiPathToRegex(path, baseUrlPattern);
  const regexStr = regexPattern.source.replace(/\$$/g, '(\\?.*)?$');

  const successResponses = responses.filter((r) => r.isSuccess);
  const errorResponses = responses.filter((r) => r.isError);

  const primaryResponse = successResponses[0];

  if (!primaryResponse?.schemaName) {
    return generateEmptyRouteHandler(functionName, method, regexStr);
  }

  let code = '';

  code += generateSuccessHandler(functionName, method, regexStr, operationId, {
    statusCode: primaryResponse.statusCode,
    schemaName: primaryResponse.schemaName,
  });

  if (options.generateErrorMocks) {
    for (const errorResponse of errorResponses) {
      if (!errorResponse.schemaName) continue;

      code += generateErrorHandler(functionName, method, regexStr, operationId, {
        statusCode: errorResponse.statusCode,
        schemaName: errorResponse.schemaName,
      });
    }
  }

  return code;
}

function generateEmptyRouteHandler(functionName: string, method: string, regexStr: string): string {
  return `
export async function ${functionName}(
  page: Page,
  status = 200
): Promise<void> {
  await page.route(/${regexStr}/, async (route) => {
    if (route.request().method().toLowerCase() !== '${method}') {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status,
      body: status === 204 ? undefined : '{}',
    });
  });
}

`;
}

function generateSuccessHandler(
  functionName: string,
  method: string,
  regexStr: string,
  operationId: string,
  response: { statusCode: number; schemaName: string }
): string {
  const fixtureName = operationToFixtureName(operationId, response.statusCode);

  return `
export async function ${functionName}(
  page: Page,
  data?: Partial<types.${response.schemaName}>
): Promise<void> {
  await page.route(/${regexStr}/, async (route) => {
    if (route.request().method().toLowerCase() !== '${method}') {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: ${response.statusCode},
      json: data ? { ...fixtures.${fixtureName}, ...data } : fixtures.${fixtureName},
    });
  });
}

`;
}

function generateErrorHandler(
  functionName: string,
  method: string,
  regexStr: string,
  operationId: string,
  response: { statusCode: number; schemaName: string }
): string {
  const errorFunctionName = `${functionName}Error${response.statusCode}`;
  const fixtureName = operationToFixtureName(operationId, response.statusCode);

  return `
export async function ${errorFunctionName}(
  page: Page,
  data?: Partial<types.${response.schemaName}>
): Promise<void> {
  await page.route(/${regexStr}/, async (route) => {
    if (route.request().method().toLowerCase() !== '${method}') {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: ${response.statusCode},
      json: data ? { ...fixtures.${fixtureName}, ...data } : fixtures.${fixtureName},
    });
  });
}

`;
}
