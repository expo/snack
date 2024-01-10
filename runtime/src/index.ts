import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
// @ts-expect-error Argument of type 'typeof App' is not assignable to parameter of type 'ComponentType<InitialProps>'.
registerRootComponent(App);
