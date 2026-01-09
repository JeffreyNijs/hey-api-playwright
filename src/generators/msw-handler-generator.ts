import type { OperationMeta } from '../types';
import { openApiPathToGlob, operationToFixtureName } from '../core/path-transformer';

export interface MswHandlerGeneratorOptions {
  baseUrlPattern: string;
}

export function generateMswHandlers(
  operations: OperationMeta[],
  options: MswHandlerGeneratorOptions
): string {
  let code = `/**
 * MSW Handler functions for mocking API responses
 */
`;

  for (const operation of operations) {
    code += generateOperationHandler(operation, options);
  }

  return code;
}

function generateOperationHandler(
  operation: OperationMeta,
  options: MswHandlerGeneratorOptions
): string {
  const { operationId, method, path, responses } = operation;
  const { baseUrlPattern } = options;

  const functionName = `mswMock${operationId.charAt(0).toUpperCase() + operationId.slice(1)}`;
  const globPattern = openApiPathToGlob(path, baseUrlPattern);

  const successResponse = responses.find((r) => r.isSuccess);

  if (!successResponse) {
    return ''; // Skip operations without success response for now
  }

  const fixtureName = operationToFixtureName(operationId, successResponse.statusCode);
  const schemaName = successResponse.schemaName ? `types.${successResponse.schemaName}` : 'any';

  // For 204 No Content, we don't return a body
  if (successResponse.statusCode === 204) {
    return `
export const ${functionName} = () => {
  return http.${method}('${globPattern}', () => {
    return new HttpResponse(null, { status: 204 });
  });
};
`;
  }

  return `
export const ${functionName} = (data?: ${schemaName} | ((defaultData: ${schemaName}) => ${schemaName})) => {
  return http.${method}('${globPattern}', () => {
    const defaultData = fixtures.${fixtureName};
    const responseData = typeof data === 'function' 
      ? (data as any)(defaultData)
      : (data ?? defaultData);
      
    return HttpResponse.json(responseData, { status: ${successResponse.statusCode} });
  });
};
`;
}
