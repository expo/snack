import { LogBox } from 'react-native';

export default {
  ignoreLogs(logs: string[]) {
    LogBox.ignoreLogs(logs);
  },
};
