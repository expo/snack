import AssetRegistry from '../../NativeModules/AssetRegistry';
import { SnackConfig } from '../SnackConfig';
import { allPlatformModules } from './common';

export const modules: SnackConfig['modules'] = {
  // Modules that are common to all platforms
  ...allPlatformModules,

  // React (web) core modules
  'react-dom': require('react-dom'),
  'react-native': require('react-native-web'),
  'react-native-web': require('react-native-web'),
  'react-native-web/dist/modules/AssetRegistry': AssetRegistry,
  'react-native-web/dist/modules/UnimplementedView': require('react-native-web/dist/modules/UnimplementedView'), // for react-native-maps@0.29.4
};
