import Constants from 'expo-constants';
import * as React from 'react';
import { StyleSheet, Animated, SafeAreaView, Text } from 'react-native';

type Props = {
  visible: boolean;
  label: string;
};

type State = {
  animValue: Animated.Value;
};

export default class UpdateIndicator extends React.PureComponent<Props, State> {
  state: State = {
    animValue: new Animated.Value(0),
  };

  private show() {
    Animated.timing(this.state.animValue, {
      toValue: 1,
      delay: 3000,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }

  private hide() {
    Animated.spring(this.state.animValue, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }

  componentDidMount() {
    if (this.props.visible) {
      this.show();
    }
  }

  componentDidUpdate(prevProps: Props) {
    const isVisible = this.props.visible;
    const wasVisible = prevProps.visible;
    if (wasVisible && !isVisible) {
      this.hide();
    } else if (!wasVisible && isVisible) {
      this.show();
    }
  }

  render() {
    const { label } = this.props;
    const { animValue } = this.state;
    return (
      <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View
          style={[
            styles.notification,
            {
              transform: [
                {
                  translateY: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
              ],
            },
          ]}>
          <Text style={styles.notificationText}>{label}</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  notification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24 + Constants.statusBarHeight,
    paddingTop: Math.max(Constants.statusBarHeight - 2, 0),
    paddingBottom: Math.min(Constants.statusBarHeight, 2),
    backgroundColor: '#4630eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    color: 'white',
    fontSize: 14,
  },
});
