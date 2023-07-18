import { SnackFiles } from 'snack-content';

import { FileManager, FileInfo, handleManifestCode } from '../Files';

describe(FileManager, () => {
  describe('get', () => {
    it('returns undefined for non-existing file', () => {
      expect(new FileManager().get('App.js')).toBeUndefined();
    });

    it('returns asset files', () => {
      const files = new Map<string, FileInfo>();
      files.set(
        'assets/icon.png',
        makeFile({ isAsset: true, s3Url: 'https://example.com/icon.png' })
      );

      expect(new FileManager(files).get('assets/icon.png')).toMatchObject({
        isAsset: true,
        isBundled: false,
        s3Url: 'https://example.com/icon.png',
      });
    });

    it('returns code files', () => {
      const files = new Map<string, FileInfo>();
      files.set('utils/log.js', makeFile({ contents: 'console.log("Hello");' }));

      expect(new FileManager(files).get('utils/log.js')).toMatchObject({
        isAsset: false,
        isBundled: false,
        contents: 'console.log("Hello");',
      });
    });
  });

  describe('list', () => {
    it('returns empty list without files', () => {
      expect(new FileManager().list()).toEqual([]);
    });

    it('returns all file names', () => {
      const files = new Map<string, FileInfo>();
      files.set('App.js', makeFile());
      files.set('components/Text.js', makeFile());
      files.set('components/Button.js', makeFile());

      expect(new FileManager(files).list()).toEqual([
        'App.js',
        'components/Text.js',
        'components/Button.js',
      ]);
    });
  });

  describe('entry', () => {
    it('returns "App.js" entry file without files', () => {
      expect(new FileManager().entry()).toBe('App.js');
    });

    it('returns "index.ts" entry file', () => {
      const files = new Map<string, FileInfo>();
      files.set('index.ts', makeFile());
      files.set('App.js', makeFile());

      expect(new FileManager(files).entry()).toBe('index.ts');
    });

    it('returns "app.js" entry file', () => {
      const files = new Map<string, FileInfo>();
      files.set('app.js', makeFile());
      files.set('components/Text.js', makeFile());

      expect(new FileManager(files).entry()).toBe('app.js');
    });
  });

  function makeFile(partial: Partial<FileInfo> = {}) {
    return {
      isAsset: false,
      isBundled: false,
      contents: undefined,
      diff: undefined,
      s3Url: undefined,
      s3Contents: undefined,
      ...partial,
    } as FileInfo;
  }
});

describe(handleManifestCode, () => {
  it('skips without manifest', () => {
    const manager = new FileManager();
    handleManifestCode(manager, null);
    expect(manager.list()).toEqual([]);
  });

  it('loads manifest code', () => {
    const manager = new FileManager();
    const code: SnackFiles = {
      'App.js': { type: 'CODE', contents: 'console.log("Hello");' },
      'assets/icon.png': { type: 'ASSET', contents: 'https://example.com/icon.png' },
    };

    handleManifestCode(manager, { extra: { code } } as any);

    expect(manager.get('App.js')).toMatchObject({
      isAsset: false,
      isBundled: false,
      contents: 'console.log("Hello");',
    });

    expect(manager.get('assets/icon.png')).toMatchObject({
      isAsset: true,
      isBundled: false,
      s3Url: 'https://example.com/icon.png',
    });
  });
});
