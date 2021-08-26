import { SnackOptions } from 'snack-sdk';

const defaults: SnackOptions = {
  codeChangesDelay: 500,
  files: {
    'App.js': {
      type: 'CODE',
      contents: `import React from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';
import Constants from 'expo-constants';

export default () => {
  return (
    <View style={styles.container}>
      <Image style={styles.image} source={require('./assets/image.png')} />
      <Text style={styles.paragraph}>
        Change code in the editor and watch it change on your phone!
        Save to get a shareable url. You get a new url each time you save.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34495e',
  },
});
      `,
    },
    'assets/image.png': {
      type: 'ASSET',
      contents:
        'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/2f7d32b1787708aba49b3586082d327b',
    },
    'assets/audio.mp3': {
      type: 'ASSET',
      contents:
        'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/c9c43b458d6daa9771a7287cae9f5b47',
    },
    'assets/fonts/Inter-Black.otf': {
      type: 'ASSET',
      contents:
        'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/44b1541a96341780b29112665c66ac67',
    },
  },
  dependencies: {
    'expo-av': { version: '*' },
    'expo-font': { version: '*' },
    'expo-app-loading': { version: '*' },
  },
};

export default defaults;
