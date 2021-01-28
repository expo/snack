import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { versions } from '../configs/sdk';
import { SDKVersion } from '../types';
import { c } from './ThemeProvider';

type Props = {
  sdkVersion: SDKVersion;
  onChange: (sdkVersion: SDKVersion) => void;
};

export default function SDKVersionSwitcher({ sdkVersion, onChange }: Props) {
  return (
    <div className={css(styles.container)}>
      <span className={css(styles.label)}>Expo</span>
      <span className={css(styles.switcher)}>
        <select
          value={sdkVersion}
          onChange={(e) => onChange(e.target.value as any)}
          className={css(styles.select)}>
          {Object.keys(versions)
            .filter((v) => versions[v as SDKVersion] || v === sdkVersion)
            .map((v) => (
              <option className={css(styles.option)} key={v} value={v}>
                v{v}
              </option>
            ))}
        </select>
      </span>
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    marginRight: '.5em',
  },
  switcher: {
    position: 'relative',
    display: 'inline-block',

    ':after': {
      content: '"▼"',
      position: 'absolute',
      fontSize: '0.6em',
      right: '2em',
      top: '1em',
      pointerEvents: 'none',
    },
  },
  label: {
    flex: 1,
    margin: '0 .5em',

    '@media (max-width: 480px)': {
      display: 'none',
    },
  },
  select: {
    appearance: 'none',
    backgroundColor: 'transparent',
    padding: '0 2em 0 1em',
    borderRadius: 12,
    outline: 0,
    border: `1px solid ${c('border')}`,
  },
  option: {
    backgroundColor: c('content'),
    color: c('text'),
  },
});
