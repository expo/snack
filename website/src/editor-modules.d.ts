declare module 'monaco-editor/esm/vs/editor/editor.main' {
  export * from 'monaco-editor';
}

declare module 'prismjs/components/prism-core' {
  export { highlight, languages } from 'prismjs';
}

declare module 'monaco-vim' {
  import type { editor, IDisposable } from 'monaco-editor';
  export function initVimMode(
    editor: editor.IStandaloneCodeEditor,
    statusbar: HTMLElement
  ): IDisposable;
}

declare module 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices' {
  import type { editor, Uri, IRange } from 'monaco-editor';
  export const StaticServices: {
    codeEditorService: {
      get(): editor.IEditorOverrideServices & {
        openCodeEditor(
          input: { resource: Uri; options: { selection: IRange } },
          source: editor.IStandaloneCodeEditor
        ): Promise<{ getControl(): editor.IStandaloneCodeEditor }>;
      };
    };
  };
}
