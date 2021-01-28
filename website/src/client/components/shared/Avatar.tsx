import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { c } from '../ThemeProvider';

type Props = {
  size: number;
  source: string | null;
};

function Avatar(props: Props) {
  const { source, size } = props;
  return (
    <div className={css(styles.container)}>
      {source ? (
        <img
          src={source}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M13.125 13.563c2.423-3.635 2.831-10.938-2.623-10.938-5.454 0-5.05 7.303-2.627 10.938-2.423 0-5.25 2.389-5.25 4.812h15.75c.004-2.423-2.827-4.813-5.25-4.813z"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

export default Avatar;

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    stroke: c('text'),
  },
});
