import { StyleSheet, css } from 'aphrodite';
import trim from 'lodash/trim';
import * as React from 'react';

import { Annotation } from '../types';
import { c, s } from './ThemeProvider';

type Props = {
  annotations: Annotation[];
  onSelectFile: (path: string) => void;
};

export default ({ annotations, onSelectFile }: Props) => {
  const [selected, setSelected] = React.useState<string | undefined>(undefined);
  return (
    <>
      {annotations.map(({ message, location, source, severity, action }, index) => {
        let iconStyle = styles.infoIcon;
        let locationStyle = styles.infoColor;
        if (severity >= 3) {
          iconStyle = styles.errorIcon;
          locationStyle = styles.errorColor;
        } else if (severity >= 2) {
          iconStyle = styles.warningIcon;
          locationStyle = styles.warningColor;
        } else if (severity < 0) {
          iconStyle = styles.loadingIcon;
        }

        const file = location?.fileName ? (
          <span
            className={css(styles.location, locationStyle)}
            onClick={() => onSelectFile(location.fileName)}>
            {`${location.fileName} (${location.startLineNumber}:${location.startColumn})`}
          </span>
        ) : (
          ''
        );

        const icon = <div className={css(styles.icon, iconStyle)} />;

        const lines = message.split('\n');
        const title = lines[0];

        let suffix;
        if (action) {
          suffix = (
            <button className={css(styles.action)} onClick={action.run}>
              {action.icon ? (
                <span className={css(styles.actionIcon)}>
                  <action.icon />
                </span>
              ) : undefined}
              <span className={css(styles.actionText)}>{action.title}</span>
            </button>
          );
        } else if (source) {
          suffix = <span className={css(styles.source)}>{` (${source})`}</span>;
        }

        const key = `${location?.fileName ?? ''}.${title}.${source ?? ''}`;
        const expanded = annotations.length === 1 || selected === key;
        return (
          <div key={index} className={css(styles.item)} onClick={() => setSelected(key)}>
            <div className={css(styles.line)}>
              {icon}
              {file}
              {title}
              {suffix}
            </div>
            {expanded && lines.length > 1 ? (
              <pre className={css(styles.callstack)}>
                {trim(message.substring(title.length), '\r\n')}
              </pre>
            ) : undefined}
          </div>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  item: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0 1.5em',
  },

  line: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    border: 0,
    margin: 0,
    padding: '1px 0',
    color: c('text'),
    minHeight: 30,
  },

  icon: {
    backgroundSize: 16,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    width: 16,
    height: 16,
    marginRight: '0.5em',
  },

  loadingIcon: {
    borderWidth: 2,
    borderStyle: 'solid',
    borderTopColor: c('text'),
    borderLeftColor: c('text'),
    borderBottomColor: c('text'),
    borderRightColor: 'rgba(0, 0, 0, .16)',
    opacity: 0.5,
    borderRadius: '50%',
    verticalAlign: -3,
    animationName: [
      {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
    ],
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },

  infoIcon: {
    backgroundImage: `url(${require('../assets/info-icon.png')})`,
  },

  errorIcon: {
    backgroundImage: `url(${require('../assets/cross-red.png')})`,
  },

  warningIcon: {
    backgroundImage: `url(${require('../assets/cross.png')})`,
  },

  location: {
    textDecoration: 'underline',
    cursor: 'pointer',
    marginRight: '0.5em',
  },

  infoColor: {
    opacity: 0.5,
  },

  errorColor: {
    color: c('error'),
  },

  warningColor: {
    color: c('warning'),
  },

  source: {
    color: c('text'),
    opacity: 0.5,
    marginLeft: '0.5em',
  },

  action: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    appearance: 'none',
    outline: 0,
    margin: '0 0 0 0.5em',
    backgroundColor: c('content'),
    color: c('selected'),
    borderRadius: 3,
    border: `1px solid ${c('selected')}`,
    lineHeight: 1,
    padding: '0 12px',
    minWidth: 50,
    minHeight: 30,
    ':hover': {
      backgroundColor: c('selected'),
      color: c('content'),
      boxShadow: s('small'),
    },
  },

  actionIcon: {
    marginRight: 4,
  },

  actionText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  callstack: {
    color: c('error'),
    fontFamily: 'var(--font-monospace)',
    margin: '0.5em 0px',
  },
});
