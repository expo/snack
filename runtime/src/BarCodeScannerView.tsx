import type { BarcodeScanningResult } from 'expo-camera';
import Constants from 'expo-constants';
import * as React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';

type Props = {
  onBarCodeScanned: (event: Pick<BarcodeScanningResult, 'type' | 'data'>) => any;
  initialURL: string;
  snackApiError?: string;
};

export default function BarCodeScannerView({ onBarCodeScanned, snackApiError }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        onSubmitEditing={(e) => onBarCodeScanned({ data: e.nativeEvent.text, type: 'url' })}
        placeholder="Enter URL to load"
      />
      {!!snackApiError && <Text style={styles.error}>{snackApiError}</Text>}
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
  error: {
    margin: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#34495e',
  },
});
