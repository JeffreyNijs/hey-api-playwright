import { describe, it, expect } from 'vitest';
import { generateMockBuilders } from './playwright-builder-generator';
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

describe('playwright-builder-generator', () => {
  describe('generateMockBuilders', () => {
    it('generates builder class for success response', () => {
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

      const result = generateMockBuilders(operations, {
        baseUrlPattern: '**',
        generateErrorMocks: true,
      });

      expect(result).toContain('export class GetUsersMock');
      expect(result).toContain('private data: types.UserList');
      expect(result).toContain('fixtures.getUsersResponse');
    });

    it('generates with() method for overrides', () => {
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

      const result = generateMockBuilders(operations, {
        baseUrlPattern: '**',
        generateErrorMocks: true,
      });

      expect(result).toContain('with(overrides: Partial<types.UserList>)');
      expect(result).toContain('return this');
    });

    it('generates build() method that returns cloned data', () => {
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

      const result = generateMockBuilders(operations, {
        baseUrlPattern: '**',
        generateErrorMocks: true,
      });

      expect(result).toContain('build(): types.UserList');
      expect(result).toContain('structuredClone(this.data)');
    });

    it('generates apply() method with page.route', () => {
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

      const result = generateMockBuilders(operations, {
        baseUrlPattern: '**',
        generateErrorMocks: true,
      });

      expect(result).toContain('async apply(page: Page');
      expect(result).toContain("static readonly globPattern = '**/api/users'");
      expect(result).toContain('static readonly pattern = /.*\\/api\\/users(\\?.*)?$/');
      expect(result).toContain('= GetUsersMock.pattern');
      expect(result).toContain('page.route(pattern');
      expect(result).toContain('route.fulfill');
    });

    it('generates error builder when enabled', () => {
      const operations: OperationMeta[] = [
        createOperation({
          responses: [
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

      const result = generateMockBuilders(operations, {
        baseUrlPattern: '**',
        generateErrorMocks: true,
      });

      expect(result).toContain('export class GetUsersError404Mock');
      expect(result).toContain('status: 404');
    });

    it('skips error builders when disabled', () => {
      const operations: OperationMeta[] = [
        createOperation({
          responses: [
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

      const result = generateMockBuilders(operations, {
        baseUrlPattern: '**',
        generateErrorMocks: false,
      });

      expect(result).not.toContain('GetUsersError404Mock');
    });

    it('uses custom base URL pattern', () => {
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

      const result = generateMockBuilders(operations, {
        baseUrlPattern: 'https://api.example.com',
        generateErrorMocks: true,
      });

      expect(result).toContain("static readonly globPattern = 'https://api.example.com/api/users'");
    });
  });
});
