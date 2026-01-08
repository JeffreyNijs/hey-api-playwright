import type { OperationMeta } from '../types';
import { operationToFixtureName } from '../core/path-transformer';

export interface FixtureGeneratorOptions {
  generateErrorMocks: boolean;
  mockStrategy: 'static' | 'zod';
}

export function generateFixtures(
  operations: OperationMeta[],
  options: FixtureGeneratorOptions
): string {
  const fixtureEntries: string[] = [];

  for (const operation of operations) {
    for (const response of operation.responses) {
      if (!response.schemaName) continue;

      if (response.isError && !options.generateErrorMocks) continue;

      const fixtureName = operationToFixtureName(operation.operationId, response.statusCode);

      const builderClass = `${response.schemaName}Builder`;

      fixtureEntries.push(`  ${fixtureName}: new ${builderClass}().build()`);
    }
  }

  if (fixtureEntries.length === 0) {
    return '// No fixtures generated - no response schemas found\nexport const fixtures = {} as const;\n\n';
  }

  let code = '/**\n * Generated fixtures for API responses\n */\n';
  code += 'export const fixtures = {\n';
  code += fixtureEntries.join(',\n');
  code += '\n} as const;\n\n';

  return code;
}

export function generateFixtureTypes(operations: OperationMeta[]): string {
  const typeEntries: string[] = [];

  for (const operation of operations) {
    for (const response of operation.responses) {
      if (!response.schemaName) continue;

      const fixtureName = operationToFixtureName(operation.operationId, response.statusCode);

      typeEntries.push(`  ${fixtureName}: types.${response.schemaName}`);
    }
  }

  if (typeEntries.length === 0) {
    return '';
  }

  let code = 'export interface Fixtures {\n';
  code += typeEntries.join(';\n');
  code += ';\n}\n\n';

  return code;
}
