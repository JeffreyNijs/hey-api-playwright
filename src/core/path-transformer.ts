export interface PathPattern {
  glob: string;
  regex: RegExp;
  params: string[];
}

export function openApiPathToGlob(path: string, basePattern = '**'): string {
  const globPath = path.replace(/\{[^}]+\}/g, '*');
  return `${basePattern}${globPath}`;
}

export function openApiPathToRegex(path: string): RegExp {
  const regexPath = path
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\{([^}]+)\\}/g, '([^/]+)');

  return new RegExp(`${regexPath}$`);
}

export function extractPathParams(path: string): string[] {
  const matches = path.matchAll(/\{([^}]+)\}/g);
  return Array.from(matches, (m) => m[1] ?? '');
}

export function transformPath(path: string, basePattern = '**'): PathPattern {
  return {
    glob: openApiPathToGlob(path, basePattern),
    regex: openApiPathToRegex(path),
    params: extractPathParams(path),
  };
}

export function methodToFunctionName(_method: string, operationId: string): string {
  const baseName = operationId.charAt(0).toUpperCase() + operationId.slice(1);
  return `mock${baseName}`;
}

export function operationToFixtureName(operationId: string, statusCode: number): string {
  const baseName = operationId.charAt(0).toLowerCase() + operationId.slice(1);

  if (statusCode >= 200 && statusCode < 300) {
    return `${baseName}Response`;
  }

  return `${baseName}Error${statusCode}`;
}
