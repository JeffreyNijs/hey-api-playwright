import type { OperationMeta, ResponseMeta, HttpMethod } from '../types';

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

function isErrorStatus(status: number): boolean {
  return status >= 400;
}

interface ResponseLike {
  description?: string;
  content?: Record<string, { schema?: SchemaLike }>;
}

interface SchemaLike {
  $ref?: string;
  [key: string]: unknown;
}

interface OperationLike {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: readonly string[];
  responses?: Record<string, ResponseLike | undefined>;
}

interface PathItemLike {
  get?: OperationLike;
  post?: OperationLike;
  put?: OperationLike;
  patch?: OperationLike;
  delete?: OperationLike;
  head?: OperationLike;
  options?: OperationLike;
}

function extractSchemaName(schema: SchemaLike | undefined): string | null {
  if (!schema) return null;

  if (schema.$ref && typeof schema.$ref === 'string') {
    // Handle standard OpenAPI refs
    if (schema.$ref.startsWith('#/components/schemas/')) {
      return schema.$ref.replace('#/components/schemas/', '');
    }
    // Handle specific openapi-ts refs if any, or just return the last segment
    const parts = schema.$ref.split('/');
    return parts[parts.length - 1] || null;
  }

  // Handle inline schema with title as implicit name (often used by openapi-ts)
  if (typeof schema.title === 'string') {
    return schema.title || null;
  }

  return null;
}

function findJsonContent(content: Record<string, { schema?: SchemaLike }> | undefined) {
  if (!content) return undefined;

  // prioritized search
  if (content['application/json']) return content['application/json'];

  // Fuzzy search for other json types (e.g. application/vnd.api+json)
  const jsonKey = Object.keys(content).find(
    (k) => k.toLowerCase().includes('application/') && k.toLowerCase().includes('json')
  );
  if (jsonKey) return content[jsonKey];

  return undefined;
}

function collectResponses(
  responses: Record<string, ResponseLike | undefined> | undefined,
  allSchemas: Record<string, unknown>
): ResponseMeta[] {
  if (!responses) return [];

  const result: ResponseMeta[] = [];

  for (const [statusStr, response] of Object.entries(responses)) {
    if (!response) continue;

    const statusCode = statusStr === 'default' ? 200 : parseInt(statusStr, 10);

    if (isNaN(statusCode)) continue;

    const jsonContent = findJsonContent(response.content);
    const schema = jsonContent?.schema;

    const schemaName = extractSchemaName(schema);
    const resolvedSchema = schemaName ? (allSchemas[schemaName] ?? null) : null;

    result.push({
      statusCode,
      description: response.description,
      schemaName,
      schema: (resolvedSchema ?? schema ?? null) as ResponseMeta['schema'],
      isSuccess: isSuccessStatus(statusCode),
      isError: isErrorStatus(statusCode),
    });
  }

  return result.sort((a, b) => a.statusCode - b.statusCode);
}

function generateOperationId(method: HttpMethod, path: string): string {
  const segments = path
    .split('/')
    .filter(Boolean)
    .map((seg) => {
      if (seg.startsWith('{') && seg.endsWith('}')) {
        return 'By' + capitalize(seg.slice(1, -1));
      }
      return capitalize(seg);
    });

  return method + segments.join('');
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function collectOperations(
  paths: Record<string, PathItemLike> | undefined,
  schemas: Record<string, unknown>
): OperationMeta[] {
  if (!paths) return [];

  const operations: OperationMeta[] = [];

  for (const [path, pathItem] of Object.entries(paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];

      if (!operation) continue;

      const operationId = operation.operationId ?? generateOperationId(method, path);

      operations.push({
        operationId,
        method,
        path,
        summary: operation.summary,
        description: operation.description,
        responses: collectResponses(operation.responses, schemas),
        tags: operation.tags ? [...operation.tags] : undefined,
      });
    }
  }

  return operations;
}
