import { Camera, CameraView, type CameraViewProps } from 'expo-camera';
import Constants from 'expo-constants';
import * as React from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import LoadingView from './LoadingView';

type Props = {
  onBarCodeScanned: CameraViewProps['onBarcodeScanned'];
  initialURL: string;
  snackApiError?: string;
};

type State = {
  waitingForPermission: boolean;
  hasCameraPermission: boolean;
  url: string;
};

export default class BarCodeScannerView extends React.Component<Props, State> {
  state = {
    waitingForPermission: true,
    hasCameraPermission: false,
    url: '',
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

  _handleOpen = () => {
    const { url } = this.state;
    if (url.trim()) {
      this.props.onBarCodeScanned({ data: url.trim(), type: 'url' });
    }
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
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={this.state.url}
              onChangeText={(text) => this.setState({ url: text })}
              onSubmitEditing={this._handleOpen}
              placeholder="Enter URL to load"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity style={styles.button} onPress={this._handleOpen}>
              <Text style={styles.buttonText}>Open</Text>
            </TouchableOpacity>
          </View>
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
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={this.state.url}
            onChangeText={(text) => this.setState({ url: text })}
            onSubmitEditing={this._handleOpen}
            placeholder="Enter URL to load"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity style={styles.button} onPress={this._handleOpen}>
            <Text style={styles.buttonText}>Open</Text>
          </TouchableOpacity>
        </View>
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
  inputContainer: {
    flexDirection: 'row',
    margin: 16,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    padding: 8,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, .16)',
    borderRadius: 4,
    marginRight: 8,
  },
  button: {
    backgroundColor: '#4630eb',
    paddingHorizontal: 24,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
});
