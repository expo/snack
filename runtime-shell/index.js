import { registerRootComponent } from 'expo';

try {
  const App = require('./src/App').default;
  // import App from './src/App';

  console.log('app', App);

  // registerRootComponent calls AppRegistry.registerComponent('main', () => App);
  // It also ensures that whether you load the app in Expo Go or in a native build,
  // the environment is set up appropriately
  registerRootComponent(App);
} catch (error) {
  console.error(error);
  throw error;
}
