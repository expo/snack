import type { BarcodeScanningResult } from 'expo-camera';
import Constants from 'expo-constants';
import * as React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

type Props = {
  onBarCodeScanned: (event: Pick<BarcodeScanningResult, 'type' | 'data'>) => any;
  initialURL: string;
};

export default function BarCodeScannerView({ onBarCodeScanned }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        onSubmitEditing={(e) => onBarCodeScanned({ data: e.nativeEvent.text, type: 'url' })}
        placeholder="Enter URL to load"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
  },
  input: {
    backgroundColor: 'white',
    margin: 24,
    padding: 8,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, .16)',
  },
});
