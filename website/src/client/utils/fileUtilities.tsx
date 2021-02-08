import escapeRegExp from 'escape-string-regexp';

export function isInsideFolder(path: string, folderPath: string) {
  return path.startsWith(`${folderPath}/`);
}

export function getParentPath(path: string): string | undefined {
  return path.includes('/') ? path.replace(/\/[^/]+$/, '') : undefined;
}

export function changeParentPath(path: string, oldParentPath: string, newParentPath: string) {
  return path.replace(new RegExp('^' + escapeRegExp(oldParentPath + '/')), newParentPath + '/');
}

export function getUniquePath(allPaths: string[], suggestedPath: string, initialSuffix?: string) {
  const parts = suggestedPath.includes('.') ? suggestedPath.split('.') : undefined;
  const ext = parts ? parts.pop() : '';
  const initialPath = parts ? parts.join('.') : suggestedPath;

  let path = suggestedPath;
  let counter = initialSuffix ? 0 : 1;

  while (allPaths.some((p) => p.toLowerCase() === path.toLowerCase())) {
    const suffix = `${initialSuffix ?? ''} ${counter || ''}`.trim();

    if (ext) {
      path = `${initialPath} ${suffix}.${ext}`;
    } else {
      path = `${initialPath} ${suffix}`;
    }

    counter++;
  }

  return path;
}

export function isEntryPoint(name: string): boolean {
  return /^App\.(js|tsx?)$/.test(name);
}

export function isPackageJson(name: string): boolean {
  return name === 'package.json';
}

export function isESLintConfig(name: string): boolean {
  return /^\.eslintrc(\.json)?$/.test(name);
}

export function isImage(name: string): boolean {
  return /\.(bmp|jpg|jpeg|png|gif|svg|webp)$/.test(name);
}

export function isScript(name: string): boolean {
  return /\.(js|tsx?)$/.test(name);
}

export function isJson(name: string): boolean {
  return name.endsWith('.json');
}

export function isJS(name: string): boolean {
  return name.endsWith('.js');
}

export function isTS(name: string): boolean {
  return isScript(name) && !isJS(name);
}

export function isTest(name: string): boolean {
  name = name.toLocaleLowerCase();
  return (
    name.includes('__tests__') ||
    name.includes('__integration-tests__') ||
    name.includes('__mocks__') ||
    name.includes('.test') ||
    name.includes('.spec')
  );
}
