import * as React from 'react';
import { View, StyleSheet, Image } from 'react-native';

export default function LoadingView() {
  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={{ uri: 'https://s3.amazonaws.com/exp-brand-assets/SnackIcon_200.png' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    opacity: 0,
    // TODO(cedric): check if we can drop this, these arent working
    // animationDelay: '2s',
    // animationDuration: '2s',
    // transitionTimingFunction: 'ease-out',
    // animationIterationCount: 'infinite',
    // animationKeyframes: [
    //   {
    //     '0%': { opacity: 0.1 },
    //     '48%': { opacity: 0.5 },
    //     '52%': { opacity: 0.5 },
    //     '100%': { opacity: 0.1 },
    //   },
    // ],
  },
});
