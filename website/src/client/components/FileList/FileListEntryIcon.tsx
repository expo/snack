import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { FileSystemEntry } from './types';
import { isEntryPoint, isPackageJson, isImage, isTest } from '../../utils/fileUtilities';
import { c } from '../ThemeProvider';

type Props = {
  entry: FileSystemEntry;
};

export default function FileListEntryIcon({ entry }: Props) {
  let icon;

  if (entry.state.isLoading) {
    return <div className={css(styles.spinner)} />;
  } else if (isEntryPoint(entry.item.path)) {
    icon = (
      <g>
        <path d="M7.46487122,14 C7.80521143,13.4116533 8,12.7285743 8,12 C8,9.790861 6.209139,8 4,8 C3.65470043,8 3.31961992,8.043753 3,8.12601749 L3,2 L13,2 L13,14 L7.46487122,14 Z M9,2 L13,6 L13,2 L9,2 Z M9,6 L9,2 L8,2 L8,7 L13,7 L13,6 L9,6 Z" />
        <circle cx="4" cy="12" r="3" />
      </g>
    );
  } else if (isPackageJson(entry.item.path)) {
    icon = (
      <path d="M2,5.09257608 L7.47329684,8.31213064 L7.47329684,14.7092088 L2,11.5325867 L2,5.09257608 Z M2.49245524,4.22207437 L7.97432798,1 L13.506361,4.2238509 L7.92838937,7.41965108 L2.49245524,4.22207437 Z M14,5.09352708 L14,11.5325867 L8.47329684,14.7128733 L8.47329684,8.25995389 L14,5.09352708 Z" />
    );
  } else if (entry.item.type === 'folder') {
    if (entry.state.isExpanded) {
      icon = (
        <g>
          <path d="M7.5,5 L2,5 L2,13 L7.75,13 L14,13 L14,4 L15,4 L15,14 L1,14 L1,4 L6.5,4 L5.5,5 L7.5,5 L7.5,4.5 L7.5,5 Z M14,4 L14,3 L7.5,3 L7.5,3.5 L7.5,3 L7,3.5 L7,2 L15,2 L15,4 L14,4 Z M6.5,4 L5,4 L7,2 L7,3.5 L6.5,4 Z" />
          <polygon points="0 7 13 7 14 14 1 14" />
        </g>
      );
    } else {
      icon = (
        <path d="M7.25,4 L7.5,4 L7.5,3 L7,3.5 L7,2 L15,2 L15,4 L7.25,4 Z M6.75,4 L5,4 L7,2 L7,3.5 L6.5,4 L6.75,4 Z M1,4 L15,4 L15,14 L1,14 L1,4 Z M7.5,3 L7.5,4 L14,4 L14,3 L7.5,3 Z" />
      );
    }
  } else if (isImage(entry.item.path)) {
    icon = (
      <g>
        <circle cx="5" cy="5" r="1" />
        <polygon points="5.71428571 8.41176471 8 11.2352941 10.8571429 7 14 13 2 13" />
        <path d="M3,3 L3,13 L13,13 L13,3 L3,3 Z M3,2 L13,2 C13.5522847,2 14,2.44771525 14,3 L14,13 C14,13.5522847 13.5522847,14 13,14 L3,14 C2.44771525,14 2,13.5522847 2,13 L2,3 C2,2.44771525 2.44771525,2 3,2 Z" />
      </g>
    );
  } else {
    icon = (
      <path d="M3,2 L13,2 L13,14 L3,14 L3,2 Z M9,2 L13,6 L13,2 L9,2 Z M9,6 L9,2 L8,2 L8,7 L13,7 L13,6 L9,6 Z" />
    );
  }

  return (
    <svg
      className={css(
        styles.icon,
        isTest(entry.item.path) ? styles.test : undefined,
        entry.state.isError ? styles.error : undefined,
      )}
      viewBox="0 0 16 16">
      {icon}
    </svg>
  );
}

const spin = {
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
};

const styles = StyleSheet.create({
  icon: {
    height: 16,
    width: 16,
    fill: 'currentColor',
    verticalAlign: 'middle',
    opacity: 0.7,
  },
  error: {
    fill: c('error'),
  },
  test: {
    color: c('soft'),
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
