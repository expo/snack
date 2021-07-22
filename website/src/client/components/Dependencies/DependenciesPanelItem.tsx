import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';
import { isModulePreloaded } from 'snack-sdk';

import { SnackDependencies, SnackDependency, SDKVersion } from '../../types';
import { c } from '../ThemeProvider';

type Props = {
  name: string;
  dependency: SnackDependency;
  updateDependencies: (
    updateFn: (dependencies: SnackDependencies) => { [name: string]: SnackDependency | null }
  ) => void;
  sdkVersion: SDKVersion;
};

export default (props: Props) => {
  const { name, dependency, updateDependencies, sdkVersion } = props;
  const isResolving =
    !dependency.error && !dependency.handle && !isModulePreloaded(name, sdkVersion);
  const color = dependency.error
    ? c('error')
    : dependency.wantedVersion && dependency.wantedVersion !== dependency.version
    ? c('warning')
    : 'currentColor';
  return (
    <div className={css(styles.container)}>
      {isResolving ? (
        <div className={css(styles.spinner)} />
      ) : (
        <svg className={css(styles.icon)} viewBox="0 0 16 16" style={{ fill: color }}>
          <path d="M2,5.09257608 L7.47329684,8.31213064 L7.47329684,14.7092088 L2,11.5325867 L2,5.09257608 Z M2.49245524,4.22207437 L7.97432798,1 L13.506361,4.2238509 L7.92838937,7.41965108 L2.49245524,4.22207437 Z M14,5.09352708 L14,11.5325867 L8.47329684,14.7128733 L8.47329684,8.25995389 L14,5.09352708 Z" />
        </svg>
      )}
      <span className={css(styles.title)} style={{ color }}>
        {name}
      </span>
      <span className={css(styles.version)} style={{ color }}>
        {dependency.version}
      </span>
    </div>
  );
};

const spin = {
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0 12px',
    overflow: 'hidden',
  },

  title: {
    flex: 1,
    fontSize: '1em',
    fontWeight: 500,
    lineHeight: 1,
    margin: '4px 0 4px 8px',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },

  version: {
    fontSize: '1em',
    fontWeight: 500,
    lineHeight: 1,
  },

  icon: {
    height: 16,
    width: 16,
    fill: 'currentColor',
    verticalAlign: 'middle',
    opacity: 0.7,
  },

  spinner: {
    display: 'inline-block',
    verticalAlign: 'middle',
    borderStyle: 'solid',
    borderTopColor: 'currentColor',
    borderLeftColor: 'currentColor',
    borderBottomColor: 'currentColor',
    borderRightColor: 'rgba(0, 0, 0, .16)',
    borderWidth: 1,
    height: 12,
    width: 12,
    borderRadius: '50%',
    margin: '2px 2px',
    animationDuration: '1s',
    animationName: [spin],
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
});
