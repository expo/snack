import { Linking } from 'react-native';

export default Linking;

export function isVerbose(): boolean {
  return __DEV__;
}
