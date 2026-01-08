import type { OperationMeta, ResponseMeta, HttpMethod } from '../types';
import { extractSchemaName } from './operation-collector';

function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

function isErrorStatus(status: number): boolean {
  return status >= 400;
}

interface OpenApiTsOperation {
  method: string;
  path: string;
  operationId: string;
  summary?: string;
  description?: string;
  tags?: string[];
  responses: Record<
    string,
    {
      mediaType?: string;
      schema?: any;
      description?: string;
    }
  >;
}

export function adaptOpenApiTsOperation(
  op: OpenApiTsOperation,
  allSchemas: Record<string, unknown>
): OperationMeta {
  const responses: ResponseMeta[] = [];

  if (op.responses) {
    for (const [statusStr, response] of Object.entries(op.responses)) {
      if (!response) continue;

      const statusCode = statusStr === 'default' ? 200 : parseInt(statusStr, 10);
      if (isNaN(statusCode)) continue;

      const schema = response.schema;
      const schemaName = extractSchemaName(schema);
      const resolvedSchema = schemaName ? (allSchemas[schemaName] ?? null) : null;

      responses.push({
        statusCode,
        description: response.description,
        schemaName,
        schema: (resolvedSchema ?? schema ?? null) as ResponseMeta['schema'],
        isSuccess: isSuccessStatus(statusCode),
        isError: isErrorStatus(statusCode),
      });
    }
  }

  return {
    operationId: op.operationId,
    method: op.method.toLowerCase() as HttpMethod,
    path: op.path,
    summary: op.summary,
    description: op.description,
    tags: op.tags,
    responses: responses.sort((a, b) => a.statusCode - b.statusCode),
  };
}
