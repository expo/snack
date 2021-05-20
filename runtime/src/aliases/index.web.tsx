import AssetRegistry from '../NativeModules/AssetRegistry';
import common from './common';

const aliases: { [key: string]: any } = {
  ...common,
  'react-dom': require('react-dom'),
  'react-native': require('react-native-web'),
  'react-native-web': require('react-native-web'),
  'react-native-web/dist/modules/AssetRegistry': AssetRegistry,
};

export default aliases;
