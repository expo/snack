import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { c } from '../ThemeProvider';

type Segment<T> = {
  id: T;
  text: string;
};

type Props<T> = {
  selectedId: T;
  onSelect: (id: T) => void;
  onClick?: () => void;
  segments: Segment<T>[];
  className?: string;
};

export default function SegmentedButton<T extends string>({
  selectedId,
  onSelect,
  segments,
}: Props<T>) {
  return (
    <div className={css(styles.container)}>
      {segments.map(({ id, text }) => (
        <button
          onClick={(e) => {
            e.preventDefault();
            onSelect(id);
          }}
          className={css(styles.button, selectedId === id ? styles.selected : null)}
          key={id}>
          <span>{text}</span>
        </button>
      ))}
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    boxShadow: `inset 0 0 0 1px ${c('border')}`,
    borderRadius: 3,
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    cursor: 'pointer',
    outline: 0,
    border: 0,
    padding: '.5em 1em',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    transitionDuration: '170ms',
    transitionProperty: 'color, background',
    transitionTimingFunction: 'linear',
    appearance: 'none',
    backgroundColor: 'transparent',

    ':hover': {
      backgroundColor: c('hover'),
    },
  },

  selected: {
    color: c('text'),
    backgroundColor: c('selected'),
    ':hover': {
      backgroundColor: c('selected'),
    },
  },
});
