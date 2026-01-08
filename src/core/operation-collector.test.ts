import { describe, it, expect } from 'vitest';
import { collectOperations } from './operation-collector';

describe('operation-collector', () => {
  describe('collectOperations', () => {
    it('returns empty array for undefined paths', () => {
      expect(collectOperations(undefined, {})).toEqual([]);
    });

    it('returns empty array for empty paths', () => {
      expect(collectOperations({}, {})).toEqual([]);
    });

    it('collects GET operation', () => {
      const paths = {
        '/users': {
          get: {
            operationId: 'getUsers',
            summary: 'Get all users',
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/UserList' },
                  },
                },
              },
            },
          },
        },
      };

      const result = collectOperations(paths, {});

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        operationId: 'getUsers',
        method: 'get',
        path: '/users',
        summary: 'Get all users',
      });
    });

    it('collects multiple operations on same path', () => {
      const paths = {
        '/users': {
          get: { operationId: 'getUsers', responses: {} },
          post: { operationId: 'createUser', responses: {} },
        },
      };

      const result = collectOperations(paths, {});

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.operationId)).toContain('getUsers');
      expect(result.map((r) => r.operationId)).toContain('createUser');
    });

    it('generates operationId from method and path when missing', () => {
      const paths = {
        '/users/{id}': {
          get: { responses: {} },
        },
      };

      const result = collectOperations(paths, {});

      expect(result[0]?.operationId).toBe('getUsersById');
    });

    it('extracts response schema name from $ref', () => {
      const paths = {
        '/users': {
          get: {
            operationId: 'getUsers',
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/UserList' },
                  },
                },
              },
            },
          },
        },
      };

      const result = collectOperations(paths, {});

      expect(result[0]?.responses[0]?.schemaName).toBe('UserList');
      expect(result[0]?.responses[0]?.statusCode).toBe(200);
      expect(result[0]?.responses[0]?.isSuccess).toBe(true);
      expect(result[0]?.responses[0]?.isError).toBe(false);
    });

    it('categorizes error responses correctly', () => {
      const paths = {
        '/users': {
          get: {
            operationId: 'getUsers',
            responses: {
              '200': { description: 'Success' },
              '404': {
                description: 'Not found',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Error' },
                  },
                },
              },
              '500': { description: 'Server error' },
            },
          },
        },
      };

      const result = collectOperations(paths, {});
      const responses = result[0]?.responses ?? [];

      expect(responses).toHaveLength(3);

      const notFound = responses.find((r) => r.statusCode === 404);
      expect(notFound?.isSuccess).toBe(false);
      expect(notFound?.isError).toBe(true);
      expect(notFound?.schemaName).toBe('Error');

      const serverError = responses.find((r) => r.statusCode === 500);
      expect(serverError?.isError).toBe(true);
    });

    it('sorts responses by status code', () => {
      const paths = {
        '/users': {
          get: {
            operationId: 'getUsers',
            responses: {
              '500': { description: 'Error' },
              '200': { description: 'Success' },
              '404': { description: 'Not found' },
            },
          },
        },
      };

      const result = collectOperations(paths, {});
      const statusCodes = result[0]?.responses.map((r) => r.statusCode) ?? [];

      expect(statusCodes).toEqual([200, 404, 500]);
    });

    it('copies tags as mutable array', () => {
      const paths = {
        '/users': {
          get: {
            operationId: 'getUsers',
            tags: ['users', 'public'] as const,
            responses: {},
          },
        },
      };

      const result = collectOperations(paths, {});

      expect(result[0]?.tags).toEqual(['users', 'public']);
    });

    it('handles operations without responses', () => {
      const paths = {
        '/health': {
          get: {
            operationId: 'healthCheck',
          },
        },
      };

      const result = collectOperations(paths, {});

      expect(result).toHaveLength(1);
      expect(result[0]?.responses).toEqual([]);
    });
  });
});
