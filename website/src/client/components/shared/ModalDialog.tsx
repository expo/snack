import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import * as React from 'react';

import { c } from '../ThemeProvider';
import ModalSheet, { ModalSheetProps } from './ModalSheet';

type Props = ModalSheetProps & {
  title?: string;
  autoSize?: boolean;
};

export default function ModalDialog(props: Props) {
  const { title, children, ...rest } = props;

  return (
    <ModalSheet
      {...rest}
      className={classnames(css(props.autoSize !== false && styles.small), props.className)}>
      {title ? <div className={css(styles.title)}>{title}</div> : null}
      <div className={css(title ? styles.bottom : styles.content)}>{children}</div>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  small: {
    minWidth: 360,
    minHeight: 0,
    maxWidth: 420,
    maxHeight: 'calc(100% - 100px)',
  },
  title: {
    height: 72,
    fontSize: 24,
    width: '100%',
    lineHeight: '24px',
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: `1px solid ${c('border-editor')}`,
  },
  bottom: {
    padding: '16px 24px 24px 24px',
    overflow: 'auto',
  },
  content: {
    padding: 24,
    overflow: 'auto',
  },
});
