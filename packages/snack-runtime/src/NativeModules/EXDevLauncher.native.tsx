import { NativeModules } from 'react-native';
export default (NativeModules.EXDevLauncher ?? {}) as any;
