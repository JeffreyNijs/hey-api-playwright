export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

export interface OperationMeta {
  operationId: string;
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  responses: ResponseMeta[];
  tags?: string[];
}

export interface ResponseMeta {
  statusCode: number;
  description?: string;
  schemaName: string | null;
  schema: Record<string, unknown> | null;
  isSuccess: boolean;
  isError: boolean;
}

export interface PlaywrightPluginConfig {
  output?: string;
  generateBuilders?: boolean;
  generateErrorMocks?: boolean;
  baseUrlPattern?: string;
  mockStrategy?: 'static' | 'zod';
  generateMsw?: boolean;
}

export interface PlaywrightPluginContext {
  config: Required<PlaywrightPluginConfig>;
  operations: OperationMeta[];
}
