import { describe, it, expect } from 'vitest';
import { generateFixtures, generateFixtureTypes } from './playwright-fixture-generator';
import type { OperationMeta } from '../types';

function createOperation(overrides: Partial<OperationMeta> = {}): OperationMeta {
  return {
    operationId: 'getUsers',
    method: 'get',
    path: '/users',
    responses: [],
    ...overrides,
  };
}

describe('playwright-fixture-generator', () => {
  describe('generateFixtures', () => {
    it('returns empty fixtures comment when no operations', () => {
      const result = generateFixtures([], {
        generateErrorMocks: true,
        mockStrategy: 'static',
      });

      expect(result).toContain('No fixtures generated');
      expect(result).toContain('export const fixtures = {} as const;');
    });

    it('generates fixture for success response', () => {
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

      const result = generateFixtures(operations, {
        generateErrorMocks: true,
        mockStrategy: 'static',
      });

      expect(result).toContain('getUsersResponse: new UserListBuilder().build()');
    });

    it('generates fixture for error response when enabled', () => {
      const operations: OperationMeta[] = [
        createOperation({
          responses: [
            {
              statusCode: 404,
              schemaName: 'NotFoundError',
              schema: null,
              isSuccess: false,
              isError: true,
            },
          ],
        }),
      ];

      const result = generateFixtures(operations, {
        generateErrorMocks: true,
        mockStrategy: 'static',
      });

      expect(result).toContain('getUsersError404: new NotFoundErrorBuilder().build()');
    });

    it('skips error fixtures when generateErrorMocks is false', () => {
      const operations: OperationMeta[] = [
        createOperation({
          responses: [
            {
              statusCode: 404,
              schemaName: 'NotFoundError',
              schema: null,
              isSuccess: false,
              isError: true,
            },
          ],
        }),
      ];

      const result = generateFixtures(operations, {
        generateErrorMocks: false,
        mockStrategy: 'static',
      });

      expect(result).not.toContain('getUsersError404');
    });

    it('skips responses without schemaName', () => {
      const operations: OperationMeta[] = [
        createOperation({
          responses: [
            {
              statusCode: 204,
              schemaName: null,
              schema: null,
              isSuccess: true,
              isError: false,
            },
          ],
        }),
      ];

      const result = generateFixtures(operations, {
        generateErrorMocks: true,
        mockStrategy: 'static',
      });

      expect(result).toContain('No fixtures generated');
    });
  });

  describe('generateFixtureTypes', () => {
    it('returns empty string when no operations', () => {
      expect(generateFixtureTypes([])).toBe('');
    });

    it('generates type for fixture', () => {
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

      const result = generateFixtureTypes(operations);

      expect(result).toContain('export interface Fixtures');
      expect(result).toContain('getUsersResponse: types.UserList');
    });
  });
});
