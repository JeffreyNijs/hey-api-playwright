import { describe, it, expect } from 'vitest';
import {
  openApiPathToGlob,
  openApiPathToRegex,
  extractPathParams,
  transformPath,
  methodToFunctionName,
  operationToFixtureName,
} from './path-transformer';

describe('path-transformer', () => {
  describe('openApiPathToGlob', () => {
    it('converts simple path without params', () => {
      expect(openApiPathToGlob('/api/users')).toBe('**/api/users');
    });

    it('converts path with single param', () => {
      expect(openApiPathToGlob('/api/users/{id}')).toBe('**/api/users/*');
    });

    it('converts path with multiple params', () => {
      expect(openApiPathToGlob('/api/users/{userId}/posts/{postId}')).toBe(
        '**/api/users/*/posts/*'
      );
    });

    it('uses custom base pattern', () => {
      expect(openApiPathToGlob('/users', 'https://api.example.com')).toBe(
        'https://api.example.com/users'
      );
    });

    it('handles root path', () => {
      expect(openApiPathToGlob('/')).toBe('**/');
    });
  });

  describe('openApiPathToRegex', () => {
    it('creates regex that matches simple path', () => {
      const regex = openApiPathToRegex('/api/users');
      expect(regex.test('https://example.com/api/users')).toBe(true);
      expect(regex.test('https://example.com/api/posts')).toBe(false);
    });

    it('creates regex that matches path with params', () => {
      const regex = openApiPathToRegex('/api/users/{id}');
      expect(regex.test('https://example.com/api/users/123')).toBe(true);
      expect(regex.test('https://example.com/api/users/abc-def')).toBe(true);
      expect(regex.test('https://example.com/api/users')).toBe(false);
    });

    it('escapes special regex characters', () => {
      const regex = openApiPathToRegex('/api/items.json');
      expect(regex.test('https://example.com/api/items.json')).toBe(true);
      expect(regex.test('https://example.com/api/itemsXjson')).toBe(false);
    });
  });

  describe('extractPathParams', () => {
    it('extracts single param', () => {
      expect(extractPathParams('/users/{id}')).toEqual(['id']);
    });

    it('extracts multiple params', () => {
      expect(extractPathParams('/users/{userId}/posts/{postId}')).toEqual(['userId', 'postId']);
    });

    it('returns empty array for no params', () => {
      expect(extractPathParams('/users')).toEqual([]);
    });
  });

  describe('transformPath', () => {
    it('returns complete path pattern object', () => {
      const result = transformPath('/api/users/{id}');

      expect(result.glob).toBe('**/api/users/*');
      expect(result.regex.test('/api/users/123')).toBe(true);
      expect(result.params).toEqual(['id']);
    });

    it('uses custom base pattern', () => {
      const result = transformPath('/users', 'https://api.example.com');
      expect(result.glob).toBe('https://api.example.com/users');
    });
  });

  describe('methodToFunctionName', () => {
    it('creates mock function name from operationId', () => {
      expect(methodToFunctionName('get', 'getUsers')).toBe('mockGetUsers');
    });

    it('capitalizes first letter', () => {
      expect(methodToFunctionName('post', 'createUser')).toBe('mockCreateUser');
    });

    it('handles already capitalized operationId', () => {
      expect(methodToFunctionName('delete', 'DeleteUser')).toBe('mockDeleteUser');
    });
  });

  describe('operationToFixtureName', () => {
    it('creates response fixture name for success status', () => {
      expect(operationToFixtureName('getUsers', 200)).toBe('getUsersResponse');
    });

    it('creates error fixture name for 4xx status', () => {
      expect(operationToFixtureName('getUsers', 404)).toBe('getUsersError404');
    });

    it('creates error fixture name for 5xx status', () => {
      expect(operationToFixtureName('getUsers', 500)).toBe('getUsersError500');
    });

    it('lowercases first letter of operationId', () => {
      expect(operationToFixtureName('GetUsers', 200)).toBe('getUsersResponse');
    });
  });
});
