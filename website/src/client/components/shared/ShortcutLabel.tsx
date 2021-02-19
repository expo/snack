import { css, StyleSheet } from 'aphrodite';
import classnames from 'classnames';
import findKey from 'lodash/findKey';
import * as React from 'react';

import { KeyMap } from './KeybindingsManager';

type Props = {
  combo: number[];
  className?: string;
};

type KeyName = keyof typeof KeyMap;

const isMac = 'navigator' in global && /Mac/i.test(navigator.platform);

const KeyLabels: Partial<{ [key in KeyName]: string }> = {
  Cmd: '⌘',
  Delete: '⌫',
  Enter: '↩',
  Shift: '⇧',
  Ctrl: isMac ? '⌃' : 'Ctrl',
  Alt: isMac ? '⌥' : 'Alt',
  Backslash: '\\',
  Tilde: '`',
};

export default function ShortcutLabel({ combo, className }: Props): any {
  return (
    <kbd className={classnames(css(styles.shortcutLabel), className)}>
      {combo
        .map((code) => {
          const name = findKey(KeyMap, (c) => c === code);

          // @ts-ignore
          if (name && KeyLabels[name]) {
            // @ts-ignore
            return KeyLabels[name];
          } else {
            return name;
          }
        })
        .join(isMac ? '' : '+')}
    </kbd>
  );
}

const styles = StyleSheet.create({
  shortcutLabel: {
    color: 'inherit',
    fontFamily: 'monospace',
    fontSize: '80%',
    opacity: 0.45,
    boxShadow: `none`,
    display: 'inline-block',
  },
});
