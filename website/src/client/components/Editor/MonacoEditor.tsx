import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.main';
import { StaticServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices';
import { initVimMode } from 'monaco-vim';
import * as React from 'react';
import { getPreloadedModules, isValidSemver } from 'snack-sdk';

import type { TypingsResult } from '../../workers/typings.worker';
import { SDKVersion, Annotation, SnackDependencies } from '../../types';
import getFileLanguage from '../../utils/getFileLanguage';
import { getRelativePath, getAbsolutePath } from '../../utils/path';
import prettierCode from '../../utils/prettierCode';
import type { TypingsResult } from '../../workers/typings.worker';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';
import ResizeDetector from '../shared/ResizeDetector';
import { EditorProps, EditorMode } from './EditorProps';
import { light, dark } from './themes/monaco';
import overrides from './themes/monaco-overrides';
import { vendoredTypes } from './types/vendored';

// @ts-ignore
global.MonacoEnvironment = {
  getWorker(_: string, label: string) {
    switch (label) {
      case 'json':
        // @ts-ignore
        return new Worker('monaco-editor/esm/vs/language/json/json.worker', {
          type: 'module',
        });
      case 'typescript':
      case 'javascript':
        // @ts-ignore
        return new Worker('monaco-editor/esm/vs/language/typescript/ts.worker', {
          type: 'module',
        });
      default:
        // @ts-ignore
        return new Worker('monaco-editor/esm/vs/editor/editor.worker', { type: 'module' });
    }
  },
};

monaco.editor.defineTheme('light', light);
monaco.editor.defineTheme('dark', dark);

/**
 * Disable typescript's diagnostics for JavaScript files.
 * This suppresses errors when using Flow syntax.
 * It's also unnecessary since we use ESLint for error checking.
 */
monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: true,
});

/**
 * Use prettier to format code.
 * This will replace the default formatter.
 */
const documentFormattingProvider: monaco.languages.DocumentFormattingEditProvider = {
  async provideDocumentFormattingEdits(model) {
    const text = await prettierCode(model.uri.path, model.getValue());

    return [
      {
        range: model.getFullModelRange(),
        text,
      },
    ];
  },
};

monaco.languages.registerDocumentFormattingEditProvider('javascript', documentFormattingProvider);
monaco.languages.registerDocumentFormattingEditProvider('typescript', documentFormattingProvider);
monaco.languages.registerDocumentFormattingEditProvider('markdown', documentFormattingProvider);

/**
 * Sync all the models to the worker eagerly.
 * This enables intelliSense for all files without needing an `addExtraLib` call.
 */
monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

/**
 * Configure the typescript compiler to detect JSX and load type definitions
 */
const compilerOptions: monaco.languages.typescript.CompilerOptions = {
  allowJs: true,
  allowSyntheticDefaultImports: true,
  alwaysStrict: true,
  esModuleInterop: true,
  forceConsistentCasingInFileNames: true,
  isolatedModules: true,
  jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
  module: monaco.languages.typescript.ModuleKind.ESNext,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  noEmit: true,
  resolveJsonModule: true,
  strict: true,
  target: monaco.languages.typescript.ScriptTarget.ESNext,
  paths: {
    '*': ['*', '*.native', '*.ios', '*.android'],
  },
};

monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);

type Props = EditorProps & {
  theme: ThemeName;
};

type State = {
  dependencies: SnackDependencies;
  sdkVersion: SDKVersion;
  allDependencies: SnackDependencies;
};

// Store editor states such as cursor position, selection and scroll position for each model
const editorStates = new Map<string, monaco.editor.ICodeEditorViewState | undefined | null>();

// Store details about typings we have requested and loaded
const requestedTypings = new Map<string, string>();
const extraLibs = new Map<string, { js: monaco.IDisposable; ts: monaco.IDisposable }>();

const codeEditorService = StaticServices.codeEditorService.get();

const findModel = (path: string) =>
  monaco.editor.getModels().find((model) => model.uri.path === `/${path}`);

class MonacoEditor extends React.Component<Props, State> {
  static defaultProps: Partial<Props> = {
    lineNumbers: 'on',
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    minimap: {
      enabled: false,
    },
    fontFamily: 'var(--font-monospace)',
    fontLigatures: true,
  };

  state: State = {
    dependencies: {},
    sdkVersion: this.props.sdkVersion,
    allDependencies: {},
  };

  static removePath(path: string) {
    // Remove editor states
    editorStates.delete(path);

    // Remove associated models
    const model = findModel(path);

    model?.dispose();
  }

  static renamePath(oldPath: string, newPath: string) {
    const selection = editorStates.get(oldPath);

    editorStates.delete(oldPath);
    editorStates.set(newPath, selection);

    this.removePath(oldPath);
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    const { dependencies, sdkVersion } = props;
    if (sdkVersion !== state.sdkVersion || dependencies !== state.dependencies) {
      const coreDependencies: SnackDependencies = {};
      for (const [name, version] of Object.entries(getPreloadedModules(sdkVersion, true))) {
        if (isValidSemver(version) && version !== '*') {
          coreDependencies[name] = { version };
        }
      }
      return {
        sdkVersion,
        dependencies,
        allDependencies: {
          ...coreDependencies,
          ...dependencies,
        },
      };
    }
    return null;
  }

  componentDidMount() {
    // Spawn a worker to fetch type definitions for dependencies
    // @ts-ignore
    this._typingsWorker = new Worker('../../workers/typings.worker', { type: 'module' });
    this._typingsWorker?.addEventListener('message', ({ data }: any) => this._addTypings(data));

    const {
      files,
      dependencies,
      selectedFile,
      annotations,
      autoFocus,
      sdkVersion,
      updateFiles,
      onSelectFile,
      ...rest
    } = this.props;

    // The methods provided by the service are on it's prototype
    // So spreading this object doesn't work, we must mutate it
    codeEditorService.openCodeEditor = async (
      { resource, options }: any,
      editor: monaco.editor.IStandaloneCodeEditor
    ) => {
      // Remove the leading slash added by the Uri
      this.props.onSelectFile(resource.path.replace(/^\//, ''));

      editor.setSelection(options.selection);
      editor.revealLine(options.selection.startLineNumber);

      return {
        getControl: () => editor,
      };
    };

    const editor = monaco.editor.create(
      this._node.current as HTMLDivElement,
      rest,
      codeEditorService
    );
    this._editor = editor;
    this._disposables = [editor];

    this._disposables.push(editor.onDidChangeModelContent(this._handleEditFile));

    this._toggleMode(this.props.mode);

    this._openFile(selectedFile, files[selectedFile]?.contents as string, autoFocus);
    this._updateMarkers(annotations, selectedFile);
    this._fetchTypings();

    // Load all the files so the editor can provide proper intellisense
    for (const path in files) {
      const file = files[path];
      if (file.type === 'CODE') {
        this._initializeFile(path, file.contents);
      }
    }

    // Hover provider to show version for imported modules
    const hoverProvider: monaco.languages.HoverProvider = {
      provideHover: this._handleProvideHover,
    };
    this._disposables.push(monaco.languages.registerHoverProvider('javascript', hoverProvider));
    this._disposables.push(monaco.languages.registerHoverProvider('typescript', hoverProvider));

    // Completion provider to provide autocomplete for files and dependencies
    const completionProvider: monaco.languages.CompletionItemProvider = {
      triggerCharacters: ["'", '"', '.', '/'],
      provideCompletionItems: this._handleProvideCompletionItems,
    };
    this._disposables.push(
      monaco.languages.registerCompletionItemProvider('javascript', completionProvider)
    );
    this._disposables.push(
      monaco.languages.registerCompletionItemProvider('typescript', completionProvider)
    );

    // Register the vendored types
    this._addTypings({
      typings: vendoredTypes,
      // These values are irrelevant and have no impact
      name: 'snack-types',
      version: '1.0.0',
    });
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const {
      selectedFile,
      files,
      mode,
      annotations,
      dependencies,
      sdkVersion,
      autoFocus,
      theme,
      updateFiles,
      onSelectFile,
      ...rest
    } = this.props;

    if (this._editor) {
      this._editor.updateOptions(rest);

      const model = this._editor.getModel();

      const value: string = files[selectedFile]?.contents as any;
      if (selectedFile !== prevProps.selectedFile) {
        // Save the editor state for the previous file so we can restore it when it's re-opened
        editorStates.set(prevProps.selectedFile, this._editor.saveViewState());

        this._openFile(selectedFile, value, autoFocus);
      } else if (model && value !== model.getValue()) {
        // @ts-ignore
        this._editor.executeEdits(null, [
          {
            range: model.getFullModelRange(),
            text: value,
          },
        ]);
      }
    }

    if (annotations !== prevProps.annotations || selectedFile !== prevProps.selectedFile) {
      this._updateMarkers(annotations, selectedFile);
    }

    if (this.state.allDependencies !== prevState.allDependencies) {
      this._fetchTypings();
    }

    if (mode !== prevProps.mode) {
      this._toggleMode(mode);
    }

    if (theme !== prevProps.theme) {
      // Update the global editor theme
      // Monaco doesn't have a way to change theme locally
      monaco.editor.setTheme(theme);
    }

    // Update all changed entries for updated intellisense
    if (prevProps.files !== this.props.files) {
      for (const path in this.props.files) {
        const file = this.props.files[path];
        if (
          file.type === 'CODE' &&
          file.contents !== prevProps.files[path]?.contents &&
          path !== selectedFile
        ) {
          this._initializeFile(path, file.contents);
        }
      }
    }
  }

  componentWillUnmount() {
    this._disposables.forEach((dis) => dis.dispose());
    this._typingsWorker?.terminate();
  }

  _initializeFile = (path: string, value: string) => {
    let model = findModel(path);

    if (model && !model.isDisposed()) {
      // If a model exists, we need to update it's value
      // This is needed because the content for the file might have been modified externally
      // Use `pushEditOperations` instead of `setValue` or `applyEdits` to preserve undo stack
      // @ts-ignore
      model.pushEditOperations(
        [],
        [
          {
            range: model.getFullModelRange(),
            text: value,
          },
        ]
      );
    } else {
      model = monaco.editor.createModel(
        value,
        undefined,
        monaco.Uri.from({ scheme: 'file', path })
      );

      model.updateOptions({
        tabSize: 2,
        insertSpaces: true,
      });
    }
  };

  _openFile = (path: string, value: string, focus?: boolean) => {
    this._initializeFile(path, value);

    const model = findModel(path);

    if (this._editor && model) {
      this._editor.setModel(model);

      // Restore the editor state for the file
      const editorState = editorStates.get(path);

      if (editorState) {
        this._editor.restoreViewState(editorState);
      }

      if (focus) {
        this._editor.focus();
      }
    }
  };

  _handleEditFile = (_event: monaco.editor.IModelContentChangedEvent): void => {
    const model = this._editor?.getModel();
    if (model) {
      const value = model.getValue();
      if (value !== this.props.files[this.props.selectedFile]?.contents) {
        this.props.updateFiles(() => ({
          [this.props.selectedFile]: {
            type: 'CODE',
            contents: value,
          },
        }));
      }
    }
  };

  _handleProvideHover = (
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): monaco.languages.ProviderResult<monaco.languages.Hover> => {
    // Get the current line
    const line = model.getLineContent(position.lineNumber);
    const language = getFileLanguage(this.props.selectedFile);

    if (!language) {
      return null;
    }

    // Tokenize the line
    const tokens = monaco.editor.tokenize(line, language)[0];

    for (let i = 0, l = tokens.length; i < l; i++) {
      const current = tokens[i];
      const next = tokens[i + 1];
      const end = next ? next.offset : line.length;

      if (
        (current.type === 'string.js' || current.type === 'string.ts') &&
        position.column > current.offset &&
        position.column < end
      ) {
        // Get the string for the token and strip quotes
        const string = line.slice(current.offset + 1, end - 1);

        // If the string refers to a dependency show the version
        const dep = this.state.allDependencies[string];
        if (dep) {
          const isResolving =
            this.state.dependencies[string] && !this.state.dependencies[string].handle;
          const resolvedVersion =
            this.state.dependencies[string]?.handle?.split('@').pop() ?? dep.version;
          return {
            range: new monaco.Range(
              position.lineNumber,
              current.offset + 1,
              position.lineNumber,
              end
            ),
            contents: [
              {
                value: isResolving
                  ? `Resolving "${string}@${dep.version}" ...`
                  : `version "${resolvedVersion}"`,
              },
            ],
          };
        }
      }
    }
    return null;
  };

  _getImportAtPosition(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    untilPosition?: boolean
  ): monaco.IRange | void {
    // Get editor content before the pointer
    const textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    // Find the import name
    const matches = textUntilPosition.match(
      /(([\s|\n]+(import|from)\s+)|(\brequire\b\s*\())["|'][^'^"]*$/
    );
    if (!matches) return undefined;
    const line = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column + 1000,
    });
    const startOfName = matches[0].replace(/(\s|'|"|from |require\()/g, '');
    const startIndex = line.indexOf(startOfName);
    const endIndex =
      Math.max(line.indexOf("'", startIndex), 0) ||
      Math.max(line.indexOf('"', startIndex), 0) ||
      line.length;

    // Return the range within the current line
    return {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: startIndex + 1,
      endColumn: untilPosition ? position.column : endIndex + 1,
    };
  }

  _handleProvideCompletionItems = (
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    _context: monaco.languages.CompletionContext,
    _token: monaco.CancellationToken
  ) => {
    const range = this._getImportAtPosition(model, position, true);
    if (range) {
      const text = model.getValueInRange(range);

      // User is trying to import a file
      if (text.startsWith('.')) {
        const prefix = getAbsolutePath(text, this.props.selectedFile);
        const suggestions: monaco.languages.CompletionItem[] = Object.keys(this.props.files)
          .filter((path) => path !== this.props.selectedFile && path.startsWith(prefix))
          .map((path): monaco.languages.CompletionItem => {
            const relativePath = getRelativePath(path, this.props.selectedFile);
            return {
              label: relativePath,
              // Don't keep extension for JS files
              insertText: `${relativePath.replace(/\.(js|tsx?)$/, '')}`,
              kind: monaco.languages.CompletionItemKind.File,
              range,
            };
          });
        return { suggestions };
      } else {
        const deps = this.state.allDependencies;

        return {
          // User is trying to import a dependency
          suggestions: Object.keys(deps).map((name) => ({
            label: name,
            insertText: name,
            detail: deps[name].version,
            kind: monaco.languages.CompletionItemKind.Module,
            range,
          })),
        };
      }
    }

    return undefined;
  };

  _fetchTypings = () => {
    const deps = this.state.allDependencies;

    Object.keys(deps).forEach((qualifier) => {
      const { version } = deps[qualifier];
      if (!isValidSemver(version)) {
        return;
      }

      // Parse the qualifier to get the package name
      // This will handle qualifiers with deep imports
      const match = /^(?:@([^/?]+)\/)?([^@/?]+)(?:\/([^@]+))?/.exec(qualifier);
      if (!match) {
        return;
      }

      const name = (match[1] ? `@${match[1]}/` : '') + match[2];

      if (requestedTypings.get(name) === version) {
        // Typing already loaded
        return;
      }

      requestedTypings.set(name, version);

      this._typingsWorker?.postMessage({
        name,
        version,
      });
    });
  };

  _addTypings = ({ typings, errorMessage }: TypingsResult) => {
    if (errorMessage) {
      console.warn(errorMessage);
    }

    Object.keys(typings).forEach((path) => {
      const extraLib = extraLibs.get(path);

      if (extraLib) {
        extraLib.js.dispose();
        extraLib.ts.dispose();
      }

      // Monaco Uri parsing contains a bug which escapes characters unwantedly.
      // This causes package-names such as `@expo/vector-icons` to not work.
      // https://github.com/Microsoft/monaco-editor/issues/1375
      let uri = monaco.Uri.from({ scheme: 'file', path }).toString();
      if (path.includes('@')) {
        uri = uri.replace('%40', '@');
      }

      const js = monaco.languages.typescript.javascriptDefaults.addExtraLib(typings[path], uri);
      const ts = monaco.languages.typescript.typescriptDefaults.addExtraLib(typings[path], uri);

      extraLibs.set(path, { js, ts });
    });
  };

  _annotationToMarker = (annotation: Annotation): monaco.editor.IMarker => {
    const { severity: annotationSeverity, location, action, ...rest } = annotation;
    let severity: monaco.MarkerSeverity;
    if (annotationSeverity < 0) {
      severity = monaco.MarkerSeverity.Info;
    } else if (annotationSeverity === 1) {
      severity = monaco.MarkerSeverity.Hint;
    } else if (annotationSeverity >= 3) {
      severity = monaco.MarkerSeverity.Error;
    } else {
      severity = monaco.MarkerSeverity.Warning;
    }
    return {
      ...rest,
      ...(location ? { ...location } : {}),
      // owner: 'expo',
      // resource: fileName,
      severity,
    } as any;
  };

  _updateMarkers = (annotations: Annotation[], path: string) =>
    monaco.editor.setModelMarkers(
      // @ts-ignore
      this._editor.getModel(),
      null,
      annotations.filter((a) => a.location?.fileName === path).map(this._annotationToMarker)
    );

  _toggleMode = (mode: EditorMode) => {
    if (mode === 'vim' && this._editor) {
      this._vim = initVimMode(this._editor, this._statusbar.current as HTMLDivElement);
    } else {
      this._vim?.dispose();
    }
  };

  _handleResize = (width?: number, height?: number) => {
    if (this._width !== width || this._height !== height) {
      this._width = width;
      this._height = height;
      this._editor?.layout();
    }
  };

  _typingsWorker: Worker | undefined;
  _disposables: monaco.IDisposable[] = [];
  _editor: monaco.editor.IStandaloneCodeEditor | null = null;
  _vim: any;
  _node = React.createRef<HTMLDivElement>();
  _statusbar = React.createRef<HTMLDivElement>();
  _width?: number;
  _height?: number;

  render() {
    return (
      <div className={css(styles.container)}>
        <style type="text/css" dangerouslySetInnerHTML={{ __html: overrides }} />
        <ResizeDetector onResize={this._handleResize}>
          <div
            ref={this._node}
            className={classnames(
              css(styles.editor),
              'snack-monaco-editor',
              `theme-${this.props.theme}`
            )}
          />
        </ResizeDetector>
        {this.props.mode === 'vim' ? (
          <div className="snack-monaco-vim-statusbar" ref={this._statusbar} />
        ) : null}
      </div>
    );
  }
}

export default withThemeName(MonacoEditor);

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
  },
  editor: {
    height: '100%',
    width: '100%',
  },
});
