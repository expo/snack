import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';
import { useResizeDetector } from 'react-resize-detector';

type Props = {
  onResize: (width?: number | undefined, height?: number | undefined) => void;
  children: React.ReactNode;
};

export default function ResizeDetector(props: Props) {
  const { ref } = useResizeDetector({ onResize: props.onResize });
  return (
    <div ref={ref} className={css(styles.container)}>
      {props.children}
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    position: 'relative',
  },
});
