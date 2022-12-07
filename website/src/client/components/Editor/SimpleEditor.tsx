import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import escape from 'escape-html';
import { highlight, languages } from 'prismjs/components/prism-core';
import React from 'react';
import Editor from 'react-simple-code-editor';

import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';
import { EditorProps } from './EditorProps';
import { light, dark } from './themes/simple-editor';

type Props = EditorProps & {
  theme: ThemeName;
};

// Store selection and undo stack
const sessions = new Map();

class SimpleEditor extends React.Component<Props> {
  static defaultProps: Partial<Props> = {
    lineNumbers: 'on',
  };

  static removePath(path: string) {
    sessions.delete(path);
  }

  static renamePath(oldPath: string, newPath: string) {
    const session = sessions.get(oldPath);

    sessions.delete(oldPath);
    sessions.set(newPath, session);
  }

  componentDidUpdate(prevProps: Props) {
    const editor = this._editor.current;

    if (this.props.selectedFile !== prevProps.selectedFile && editor) {
      // Save the editor state for the previous file so we can restore it when it's re-opened
      sessions.set(prevProps.selectedFile, editor.session);

      // If we find a previous session for the current file, restore it
      // Otherwise set the session session to a fresh one
      const session = sessions.get(this.props.selectedFile);

      if (session) {
        editor.session = session;
      } else {
        editor.session = {
          history: {
            stack: [],
            offset: -1,
          },
        };
      }
    }
  }

  _highlight = (path: string, code: string) => {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      return highlight(code, languages.ts, 'typescript');
    } else if (path.endsWith('.js')) {
      return highlight(code, languages.jsx, 'jsx');
    } else if (path.endsWith('.json')) {
      return highlight(code, languages.json, 'json');
    } else if (path.endsWith('.md')) {
      return highlight(code, languages.markdown, 'markdown');
    }

    return escape(code);
  };

  private _handleValueChange = (code: string) => {
    this.props.updateFiles(() => ({
      [this.props.selectedFile]: {
        type: 'CODE',
        contents: code,
      },
    }));
  };

  _editor = React.createRef<Editor>();

  render() {
    const { selectedFile, lineNumbers, theme, files } = this.props;
    const file = files[selectedFile];
    return (
      <div
        className={css(styles.container, lineNumbers === 'on' && styles.containerWithLineNumbers)}>
        <Editor
          // @ts-ignore
          ref={this._editor}
          value={file?.type === 'CODE' ? file.contents : ''}
          onValueChange={this._handleValueChange}
          highlight={(code: string) =>
            lineNumbers === 'on'
              ? this._highlight(selectedFile, code)
                  .split('\n')
                  .map((line: string) => `<span class="${css(styles.line)}">${line}</span>`)
                  .join('\n')
              : this._highlight(selectedFile, code)
          }
          padding={lineNumbers === 'on' ? 0 : 8}
          className={classnames(css(styles.editor), 'prism-code')}
        />
        <style
          type="text/css"
          dangerouslySetInnerHTML={{ __html: theme === 'dark' ? dark : light }}
        />
      </div>
    );
  }
}

export default withThemeName(SimpleEditor);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'auto',
  },
  containerWithLineNumbers: {
    paddingLeft: 64,
  },
  editor: {
    fontFamily: 'var(--font-monospace)',
    fontSize: 12,
    minHeight: '100%',
    counterReset: 'line',
    overflow: 'visible !important' as any,
  },
  line: {
    ':before': {
      position: 'absolute',
      right: '100%',
      marginRight: 26,
      textAlign: 'right',
      opacity: 0.5,
      userSelect: 'none',
      counterIncrement: 'line',
      content: 'counter(line)',
    },
  },
});
