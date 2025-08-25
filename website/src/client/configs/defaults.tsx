import type { SnackFiles, SnackDependencies } from '../types';

export const DEFAULT_METADATA_NAME = 'Snack - React Native in the browser';
export const DEFAULT_METADATA_DESCRIPTION_EMPTY = `Write code in Expo's online editor and instantly use it on your phone.`;
export const DEFAULT_METADATA_DESCRIPTION_SAVED = `Try this project on your phone! Use Expo's online editor to make changes and save your own copy.`;

export const DEFAULT_DESCRIPTION = 'No description';

export const DEFAULT_CODE: SnackFiles = {
  'App.js': {
    contents: `import { StyleSheet, Text, View } from 'react-native';

// You can import supported modules from npm
import { Card } from 'react-native-paper';

// or any files within the Snack
import AssetExample from './components/AssetExample';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.paragraph}>
        Change code in the editor and watch it change on your phone! Save to get a shareable url.
      </Text>
      <Card>
        <AssetExample />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
`,
    type: 'CODE',
  },
  'assets/snack-icon.png': {
    contents:
      'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/2f7d32b1787708aba49b3586082d327b',
    type: 'ASSET',
  },
  'components/AssetExample.js': {
    contents: `import { Text, View, StyleSheet, Image } from 'react-native';

export default function AssetExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.paragraph}>
        Local files and assets can be imported by dragging and dropping them into the editor
      </Text>
      <Image style={styles.logo} source={require('../assets/snack-icon.png')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  paragraph: {
    margin: 24,
    marginTop: 0,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logo: {
    height: 128,
    width: 128,
  }
});
`,
    type: 'CODE',
  },
  'README.md': {
    contents: `# Sample Snack app

Open the \`App.js\` file to start writing some code. You can preview the changes directly on your phone or tablet by scanning the **QR code** or use the iOS or Android emulators. When you're done, click **Save** and share the link!

When you're ready to see everything that Expo provides (or if you want to use your own editor) you can **Download** your project and use it with [expo cli](https://docs.expo.dev/get-started/installation/#expo-cli)).

All projects created in Snack are publicly available, so you can easily share the link to this project via link, or embed it on a web page with the \`<>\` button.

If you're having problems, you can tweet to us [@expo](https://twitter.com/expo) or ask in our [forums](https://forums.expo.dev/c/expo-dev-tools/61) or [Discord](https://chat.expo.dev/).

Snack is Open Source. You can find the code on the [GitHub repo](https://github.com/expo/snack).
`,
    type: 'CODE',
  },
};

export const DEFAULT_DEPENDENCIES: SnackDependencies = {
  'react-native-paper': {
    version: '4.9.2',
    // The handle ensures that the dependency doesn't need to be resolved
    // on startup
    handle: 'snackager-1/react-native-paper@4.9.2',
  },
  '@expo/vector-icons': {
    version: '*',
  },
};
