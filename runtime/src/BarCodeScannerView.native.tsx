import { Camera, CameraView, type CameraViewProps } from 'expo-camera';
import Constants from 'expo-constants';
import * as React from 'react';
import { Text, View, StyleSheet } from 'react-native';

import LoadingView from './LoadingView';

type Props = {
  onBarCodeScanned: CameraViewProps['onBarcodeScanned'];
  initialURL: string;
  snackApiError?: string;
};

type State = {
  waitingForPermission: boolean;
  hasCameraPermission: boolean;
};

export default class BarCodeScannerView extends React.Component<Props, State> {
  state = {
    waitingForPermission: true,
    hasCameraPermission: false,
  };

  componentDidMount() {
    this._openCameraAsync();
  }

  _openCameraAsync = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();

    this.setState({
      waitingForPermission: false,
      hasCameraPermission: status === 'granted',
    });
  };

  render() {
    const { initialURL, onBarCodeScanned, snackApiError } = this.props;
    const { waitingForPermission, hasCameraPermission } = this.state;

    if (waitingForPermission) {
      return <LoadingView />;
    }

    if (hasCameraPermission) {
      return (
        <View style={styles.container}>
          <Text style={styles.initialURL}>{`Launch URL: ${initialURL}`}</Text>
          <Text style={styles.paragraph}>
            Open up https://snack.expo.dev and scan the QR code to get started!
            {'\n'}
            {'\n'}
            Make sure to leave the web page open while you are running the project.
            {!!snackApiError && <Text style={styles.paragraph}>{snackApiError}</Text>}
          </Text>
          {/* @ts-ignore Property 'style' does not exist on type */}
          <CameraView style={styles.camera} onBarCodeScanned={onBarCodeScanned} />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.paragraph}>
          Please accept the camera permission so that you can scan a QR code!
        </Text>
        {!!snackApiError && <Text style={styles.paragraph}>{snackApiError}</Text>}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
  },
  initialURL: {
    margin: 16,
    marginBottom: 0,
    fontSize: 16,
    textAlign: 'center',
    color: '#4630eb',
  },
  paragraph: {
    margin: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#34495e',
  },
  camera: {
    flex: 1,
  },
});
