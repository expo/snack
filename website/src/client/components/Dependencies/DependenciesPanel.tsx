import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { SnackMissingDependencies } from 'snack-sdk';

import { SnackDependencies, SnackDependency, SDKVersion } from '../../types';
import { c } from '../ThemeProvider';
import ResizablePane from '../shared/ResizablePane';
import DependenciesPanelItem from './DependenciesPanelItem';

type Props = {
  dependencies: SnackDependencies;
  missingDependencies: SnackMissingDependencies;
  sdkVersion: SDKVersion;
  updateDependencies: (
    updateFn: (dependencies: SnackDependencies) => { [name: string]: SnackDependency | null }
  ) => void;
};

export default (props: Props) => {
  const { dependencies, missingDependencies, sdkVersion, updateDependencies } = props;
  return (
    <ResizablePane direction="vertical" className={css(styles.container)}>
      <div className={css(styles.content)}>
        <h4 className={css(styles.title)}>Dependencies</h4>
        <div className={css(styles.items)}>
          {Object.entries(dependencies)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, dependency]) => (
              <DependenciesPanelItem
                name={name}
                dependency={dependency}
                updateDependencies={updateDependencies}
                sdkVersion={sdkVersion}
              />
            ))}
        </div>
      </div>
    </ResizablePane>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '14em',
  },

  content: {
    backgroundColor: c('content'),
    borderColor: c('border'),
    borderWidth: '1px 1px 0 0',
    borderStyle: 'solid',
    height: '100%',
    minHeight: 0,
  },

  title: {
    fontSize: '0.9em',
    fontWeight: 'normal',
    margin: '12px',
    textTransform: 'uppercase',
  },

  items: {
    display: 'flex',
    flexDirection: 'column',
  },
});
