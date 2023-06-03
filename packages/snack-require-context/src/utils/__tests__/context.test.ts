import {
  SnackRequireContextRequest,
  convertRequestToVirtualModulePath,
  convertVirtualModulePathToRequest,
  createContextModuleTemplate,
  createEmptyContextModuleTemplate,
  pathIsVirtualModule,
  resolveContextDirectory,
  resolveContextFiles,
} from '../context';

describe(pathIsVirtualModule, () => {
  it('returns true for virtual module', () => {
    expect(pathIsVirtualModule('app?ctx=abc123')).toBe(true);
    expect(pathIsVirtualModule('/app?ctx=abc123')).toBe(true);
    expect(pathIsVirtualModule('./app?ctx=abc123')).toBe(true);
    expect(pathIsVirtualModule('module:/app?ctx=abc123')).toBe(true);
    expect(pathIsVirtualModule('module://app?ctx=abc123')).toBe(true);
  });

  it('returns false for non-virtual module', () => {
    expect(pathIsVirtualModule('App.tsx')).toBe(false);
    expect(pathIsVirtualModule('/App.tsx')).toBe(false);
    expect(pathIsVirtualModule('./App.tsx')).toBe(false);
    expect(pathIsVirtualModule('module://App.tsx')).toBe(false);
    expect(pathIsVirtualModule('module:/app?ctx')).toBe(false);
  });
});

describe(convertRequestToVirtualModulePath, () => {
  it('converts request to URL-safe virtual module path', () => {
    const request = requireContext('app', false, /\.tsx$/, 'sync');
    const virtualModule = convertRequestToVirtualModulePath(request);
    expect(virtualModule).toBe(encodeURI(virtualModule));
  });

  it('converts empty paths', () => {
    const request = requireContext('', true, /\.mdx$/, 'async');
    const virtualModule = convertRequestToVirtualModulePath(request);
    expect(virtualModule).toBe(encodeURI(virtualModule));
  });

  it('converts back and forth with identical request', () => {
    const request = requireContext('components', true, /.*/, 'async');
    const virtualModule = convertRequestToVirtualModulePath(request);
    const convertedRequest = convertVirtualModulePathToRequest(virtualModule);
    expect(convertedRequest).toEqual(request);
    expect(convertedRequest).toHaveProperty('directory', 'components');
    expect(convertedRequest).toHaveProperty('isRecursive', true);
  });
});

describe(convertVirtualModulePathToRequest, () => {
  it('throws when ?ctx= is missing', () => {
    expect(() => convertVirtualModulePathToRequest('app')).toThrow(/not contain the context hash/);
  });

  it('throws when ?ctx= contains invalid JSON', () => {
    expect(() => convertVirtualModulePathToRequest('app?ctx=aGVsbG8')).toThrow();
  });

  it('converts empty directories', () => {
    const request = requireContext('', true, /\.tsx$/, 'sync');
    const virtualModule = convertRequestToVirtualModulePath(request);
    const convertedRequest = convertVirtualModulePathToRequest(virtualModule);
    expect(convertedRequest).toEqual(request);
    expect(convertedRequest).toHaveProperty('directory', '');
  });
});

describe(resolveContextDirectory, () => {
  it('returns root relative paths', () => {
    expect(resolveContextDirectory('./app/_layout.tsx', './')).toBe('app');
    expect(resolveContextDirectory('./app/test/_layout.tsx', '../')).toBe('app');
    expect(resolveContextDirectory('./app/home/_layout.tsx', './')).toBe('app/home');
    expect(resolveContextDirectory('./components/Test.tsx', '../app/auth')).toBe('app/auth');
  });
});

describe(resolveContextFiles, () => {
  it('returns empty list without files', () => {
    expect(resolveContextFiles(requireContext('app'), [])).toEqual([]);
  });

  it('returns single matching file', () => {
    const files = ['components/test.tsx'];
    expect(resolveContextFiles(requireContext('components'), files)).toEqual([
      './components/test.tsx',
    ]);
  });

  it('returns multiple matching files', () => {
    const files = ['ui/Avatar.js', 'components/User.tsx'];
    expect(resolveContextFiles(requireContext('ui'), files)).toEqual(['./ui/Avatar.js']);
  });

  it('returns multiple matching files from nested path', () => {
    const files = ['App.tsx', 'components/ui/Button.js', 'components/ui/form/Input.tsx'];
    expect(resolveContextFiles(requireContext('components/ui'), files)).toEqual([
      './components/ui/Button.js',
      './components/ui/form/Input.tsx',
    ]);
  });

  it('does not return nested files when not recursive', () => {
    const files = ['App.tsx', 'components/ui/Button.js', 'components/ui/form/Input.tsx'];
    expect(resolveContextFiles(requireContext('components/ui', false), files)).toEqual([
      './components/ui/Button.js',
    ]);
  });

  it('returns files matching regex pattern', () => {
    const files = ['App.tsx', 'components/ui/Button.js', 'components/ui/Textual.tsx'];
    expect(resolveContextFiles(requireContext('', true, /\.tsx$/), files)).toEqual([
      './App.tsx',
      './components/ui/Textual.tsx',
    ]);
  });
});

describe(createEmptyContextModuleTemplate, () => {
  /* eslint-disable no-eval */

  it('can be evaluated', () => {
    const files = ['./non/existing/file.js'];
    expect(() => eval(createContextModuleTemplate(files))).not.toThrow();
  });

  // Other functions will load the modules, don't want to do that in the test
});

describe(createEmptyContextModuleTemplate, () => {
  /* eslint-disable no-eval */

  it('can be evaluated', () => {
    expect(() => eval(createEmptyContextModuleTemplate())).not.toThrow();
  });

  it('throws when loading modules', () => {
    expect(() => eval(createEmptyContextModuleTemplate())('./test')).toThrow(/No modules found/);
  });

  it('returns empty array as keys', () => {
    expect(() => eval(createEmptyContextModuleTemplate()).keys()).toHaveLength(0);
  });

  it('throws when using resolve', () => {
    expect(() => eval(createEmptyContextModuleTemplate()).resolve('./test')).toThrow(
      /Unimplemented/
    );
  });
});

function requireContext(
  directory: string,
  isRecursive = true,
  matching = /^\.\/.*$/,
  mode: 'sync' | 'async' = 'sync'
): SnackRequireContextRequest {
  return { directory, isRecursive, matching, mode };
}
