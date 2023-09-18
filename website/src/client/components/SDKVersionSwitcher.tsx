import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import * as React from 'react';

import { c } from './ThemeProvider';
import { versions } from '../configs/sdk';
import { SDKVersion } from '../types';

type Props = {
  sdkVersion: SDKVersion;
  isLocalWebPreview: boolean;
  onChange: (sdkVersion: SDKVersion, isLocalhost: boolean) => void;
  selectClassName?: string;
};

export default function SDKVersionSwitcher({
  sdkVersion,
  isLocalWebPreview,
  onChange,
  selectClassName,
}: Props) {
  const vers = Object.keys(versions).sort();
  const options = vers.filter((v) => versions[v as SDKVersion] || v === sdkVersion);
  if (process.env.NODE_ENV === 'development' || isLocalWebPreview) {
    options.push('localhost');
  }
  return (
    <div className={css(styles.container)}>
      <span className={css(styles.label)}>Expo</span>
      <span className={css(styles.switcher)}>
        <select
          value={isLocalWebPreview ? 'localhost' : sdkVersion}
          onChange={(e) =>
            onChange(
              (e.target.value === 'localhost'
                ? vers[vers.length - 1]
                : e.target.value) as SDKVersion,
              e.target.value === 'localhost'
            )
          }
          className={classnames(css(styles.select), selectClassName)}
        >
          {options.map((option) => (
            <option className={css(styles.option)} key={option} value={option}>
              {option === 'localhost' ? option : `v${option}`}
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
      color: c('soft'),
      position: 'absolute',
      fontSize: '0.6em',
      right: '2em',
      top: '0.66em',
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
    cursor: 'pointer',
    border: `1px solid ${c('border')}`,
  },
  option: {
    backgroundColor: c('content'),
    color: c('text'),
  },
});
