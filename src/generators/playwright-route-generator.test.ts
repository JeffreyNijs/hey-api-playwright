import { describe, it, expect } from 'vitest';
import { generateRouteHandlers } from './playwright-route-generator';
import type { OperationMeta } from '../types';

function createOperation(overrides: Partial<OperationMeta> = {}): OperationMeta {
  return {
    operationId: 'getUsers',
    method: 'get',
    path: '/api/users',
    responses: [],
    ...overrides,
  };
}

describe('playwright-route-generator', () => {
  describe('generateRouteHandlers', () => {
    it('generates handler for operation with response schema', () => {
      const operations: OperationMeta[] = [
        createOperation({
          responses: [
            {
              statusCode: 200,
              schemaName: 'UserList',
              schema: null,
              isSuccess: true,
              isError: false,
            },
          ],
        }),
      ];

      const result = generateRouteHandlers(operations, {
        baseUrlPattern: '**',
        generateErrorMocks: true,
      });

      expect(result).toContain('export async function mockGetUsers');
      expect(result).toContain('page.route(/.*\\/api\\/users(\\?.*)?$/');
      expect(result).toContain('Partial<types.UserList>');
      expect(result).toContain('fixtures.getUsersResponse');
    });

    it('checks HTTP method in route handler', () => {
      const operations: OperationMeta[] = [
        createOperation({
          method: 'post',
          operationId: 'createUser',
          responses: [
            {
              statusCode: 201,
              schemaName: 'User',
              schema: null,
              isSuccess: true,
              isError: false,
            },
          ],
        }),
      ];

      const result = generateRouteHandlers(operations, {
        baseUrlPattern: '**',
        generateErrorMocks: true,
      });

      expect(result).toContain("method().toLowerCase() !== 'post'");
      expect(result).toContain('route.fallback()');
    });

    it('generates error handler when enabled', () => {
      const operations: OperationMeta[] = [
        createOperation({
          responses: [
            {
              statusCode: 200,
              schemaName: 'UserList',
              schema: null,
              isSuccess: true,
              isError: false,
            },
            {
              statusCode: 404,
              schemaName: 'NotFound',
              schema: null,
              isSuccess: false,
              isError: true,
            },
          ],
        }),
      ];

      const result = generateRouteHandlers(operations, {
        baseUrlPattern: '**',
        generateErrorMocks: true,
      });

      expect(result).toContain('mockGetUsersError404');
      expect(result).toContain('status: 404');
    });

    it('skips error handlers when disabled', () => {
      const operations: OperationMeta[] = [
        createOperation({
          responses: [
            {
              statusCode: 200,
              schemaName: 'UserList',
              schema: null,
              isSuccess: true,
              isError: false,
            },
            {
              statusCode: 404,
              schemaName: 'NotFound',
              schema: null,
              isSuccess: false,
              isError: true,
            },
          ],
        }),
      ];

      const result = generateRouteHandlers(operations, {
        baseUrlPattern: '**',
        generateErrorMocks: false,
      });

      expect(result).not.toContain('mockGetUsersError404');
    });

    it('generates empty handler for operation without schema', () => {
      const operations: OperationMeta[] = [
        createOperation({
          operationId: 'healthCheck',
          path: '/health',
          responses: [],
        }),
      ];

      const result = generateRouteHandlers(operations, {
        baseUrlPattern: '**',
        generateErrorMocks: true,
      });

      expect(result).toContain('mockHealthCheck');
      expect(result).toContain('status = 200');
      expect(result).not.toContain('fixtures.');
    });

    it('converts path params to glob wildcards', () => {
      const operations: OperationMeta[] = [
        createOperation({
          operationId: 'getUser',
          path: '/api/users/{id}',
          responses: [
            {
              statusCode: 200,
              schemaName: 'User',
              schema: null,
              isSuccess: true,
              isError: false,
            },
          ],
        }),
      ];

      const result = generateRouteHandlers(operations, {
        baseUrlPattern: '**',
        generateErrorMocks: true,
      });

      expect(result).toContain('page.route(/.*\\/api\\/users\\/([^/]+)(\\?.*)?$/');
    });
    it('supports optional matcher in route handler', () => {
      const operations: OperationMeta[] = [
        createOperation({
          responses: [
            {
              statusCode: 200,
              schemaName: 'UserList',
              schema: null,
              isSuccess: true,
              isError: false,
            },
          ],
        }),
      ];

      const result = generateRouteHandlers(operations, {
        baseUrlPattern: '**',
        generateErrorMocks: true,
      });

      expect(result).toContain('options?: RouteHandlerOptions');
      expect(result).toContain('if (options?.matcher && !options.matcher(route.request()))');
    });
  });
});
