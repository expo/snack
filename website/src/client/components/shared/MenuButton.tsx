import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { c, s } from '../ThemeProvider';
import FooterButton from './FooterButton';

type Props = {
  icon?: string;
  label?: React.ReactNode;
  content: React.ReactNode;
};

export default function MenuButton({ icon, label, content }: Props) {
  const [active, setActive] = React.useState<boolean>(false);
  const root = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.target === root.current || root.current?.contains(e.target as Node)) {
        return;
      }

      setActive(false);
    };

    document.addEventListener('click', onClick);

    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div ref={root} className={css(styles.panelContainer)}>
      <FooterButton icon={icon} active={active} onClick={() => setActive((value) => !value)}>
        {label}
      </FooterButton>
      {active ? <div className={css(styles.pane)}>{content}</div> : null}
    </div>
  );
}

const styles = StyleSheet.create({
  panelContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  pane: {
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    flexDirection: 'column',
    position: 'absolute',
    right: 0,
    bottom: 32,
    minWidth: 160,
    padding: '8px 0',
    borderWidth: 1,
    borderRadius: 3,
    borderStyle: 'solid',
    backgroundColor: c('content'),
    borderColor: c('border'),
    boxShadow: s('popover'),
    color: c('text'),
    zIndex: -1,
  },
});
