import type { BarCodeEvent } from 'expo-barcode-scanner';
import * as React from 'react';
import { TextInput, StyleSheet, SafeAreaView } from 'react-native';

type Props = {
  onBarCodeScanned: (event: Pick<BarCodeEvent, 'type' | 'data'>) => any;
  initialURL: string;
};

export default function BarCodeScannerView({ onBarCodeScanned }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.input}
        onSubmitEditing={(e) => onBarCodeScanned({ data: e.nativeEvent.text, type: 'url' })}
        placeholder="Enter URL to load"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
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
