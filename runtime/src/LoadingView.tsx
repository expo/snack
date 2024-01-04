import * as React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

type Props = object;

type State = {
  opacity: Animated.Value;
  inputRange: number[];
  outputRange: number[];
};

export default class LoadingView extends React.PureComponent<Props, State> {
  state: State = {
    opacity: new Animated.Value(0),
    inputRange: Array(31)
      .fill(0)
      .map((_, index) => index),
    outputRange: Array(31)
      .fill(0)
      .map((_, index) => (index % 2 ? 0.1 : 1)),
  };

  componentDidMount() {
    const { opacity, inputRange } = this.state;
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: inputRange.length - 1,
          duration: (inputRange.length - 1) * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: (inputRange.length - 1) * 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }

  render() {
    const { opacity, inputRange, outputRange } = this.state;
    return (
      <View style={styles.container}>
        <Animated.Image
          style={{
            ...StyleSheet.absoluteFillObject,
            width: '100%',
            height: '100%',
            opacity: opacity.interpolate({
              inputRange, // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
              outputRange, // [1, 0.1, 1, 0.1, 1, 0.1, 1, 0.1, 1, 0.1, 1],
            }),
          }}
          resizeMode="contain"
          source={require('../assets/splash.png')}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});
