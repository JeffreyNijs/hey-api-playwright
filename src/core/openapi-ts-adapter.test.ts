import { describe, it, expect } from 'vitest';
import { adaptOpenApiTsOperation } from './openapi-ts-adapter';

describe('openapi-ts-adapter', () => {
  it('should adapt openapi-ts specific operation structure to OperationMeta', () => {
    const mockOp = {
      method: 'get',
      path: '/users',
      operationId: 'GetUsers',
      responses: {
        '200': {
          description: 'Success',
          schema: {
            $ref: '#/components/schemas/User',
          },
        },
        '400': {
          mediaType: 'application/json',
          schema: {
            type: 'object',
          },
        },
      },
    };

    const schemas = {
      User: { type: 'object' },
    };

    const result = adaptOpenApiTsOperation(mockOp as any, schemas);

    expect(result.operationId).toBe('GetUsers');
    expect(result.method).toBe('get');
    expect(result.path).toBe('/users');
    expect(result.responses).toHaveLength(2);

    const successResponse = result.responses.find((r) => r.statusCode === 200);
    expect(successResponse).toBeDefined();
    expect(successResponse?.schemaName).toBe('User');
    expect(successResponse?.isSuccess).toBe(true);

    const errorResponse = result.responses.find((r) => r.statusCode === 400);
    expect(errorResponse).toBeDefined();
    expect(errorResponse?.isError).toBe(true);
  });

  it('should handle missing responses gracefully', () => {
    const mockOp = {
      method: 'post',
      path: '/users',
      operationId: 'CreateUser',
      responses: {},
    };
    const result = adaptOpenApiTsOperation(mockOp as any, {});
    expect(result.responses).toHaveLength(0);
  });
});
