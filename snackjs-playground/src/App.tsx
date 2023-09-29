import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Button, SafeAreaView, Text } from 'react-native';

import * as Files from './Files';
import * as Logger from './Logger';
import * as Modules from './Modules';

// Hardcode the Snack files for now
Files.setFiles({
  'test/log.js': `console.log('ASDASDADS');`,
  'test/import.js': `require('./log');`,
  'index.js': `
    import { Text } from 'react-native';
    import './test/import';

    export default function App() {
      return <Text>Hello world!</Text>;
    }
  `,
});

type State = {
  rootElement: React.ReactElement | null;
};

export default class App extends React.Component<object, State> {
  state: State = {
    rootElement: null,
  };

  private _awaitingModulesInitialization: Promise<void> | null = null;

  async componentDidMount() {
    this._awaitingModulesInitialization = Modules.initialize();

    if (Files.get(Files.entry())) {
      this.reloadModules();
    }
  }

  private forceReload() {
    // In here, you can change the files and force a reload
    Files.setFiles({
      'test/import.js': `require('./log'); require('debug');`,
    });

    this.reloadModules({ changedPaths: Files.list() });
  }

  private async reloadModules({
    changedPaths = [],
    changedDependencies = [],
  }: { changedPaths?: string[]; changedDependencies?: string[] } = {}) {
    // Wait for modules to be ready
    if (this._awaitingModulesInitialization) {
      await this._awaitingModulesInitialization;
      this._awaitingModulesInitialization = null;
    }

    let rootElement: React.ReactElement | null = null;

    try {
      const rootModuleUri = 'module://' + Files.entry();
      await Modules.flush({ changedPaths, changedUris: [rootModuleUri] });

      const hasRootModuleUri = await Modules.has(rootModuleUri);
      if (!hasRootModuleUri) {
        const rootDefaultExport = (await Modules.load(rootModuleUri)).default;
        if (!rootDefaultExport) {
          throw new Error(`No default export of '${Files.entry()}' to render!`);
        }

        Logger.info('Updating root element');
        rootElement = React.createElement(rootDefaultExport);
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.setState({ rootElement });
    }
  }

  render() {
    const { rootElement } = this.state;

    return (
      <SafeAreaView style={{ margin: 16 }}>
        <Button onPress={() => this.forceReload()} title="Force-reload" />
        <StatusBar style="dark" />
        {rootElement ? rootElement : <Text>Loading...</Text>}
      </SafeAreaView>
    );
  }
}
