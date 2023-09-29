import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Text } from 'react-native';

import * as Errors from './Errors';
import * as Files from './Files';
import * as Logger from './Logger';
import * as Modules from './Modules';

// Hardcode the Snack files for now
Files.setFiles({
  'index.js': `
    console.log('ASDASDASD');
    export default function App() {
      return <div>Hello, world!</div>;
    }
  `,
});

type State = {
  rootElement: React.ReactElement | null;
};

export default class App extends React.Component<object, State> {
  private _awaitingModulesInitialization: Promise<void> | null = null;

  async componentDidMount() {
    this._awaitingModulesInitialization = Modules.initialize();

    if (Files.get(Files.entry())) {
      this.reloadModules();
    }
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

        console.log('ASD');
      }
    } catch (error) {
      Errors.report(error);
    } finally {
      this.setState({ rootElement });
    }
  }

  render() {
    const { rootElement } = this.state;

    return (
      <>
        <StatusBar style="dark" />
        {!!rootElement && <Errors.ErrorBoundary>{rootElement}</Errors.ErrorBoundary>}
        {!rootElement && <Text>Loading...</Text>}
      </>
    );
  }
}
