import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';

type Props = {
  visible: boolean;
  label: string;
};

export default function UpdateIndicator(props: Props) {
  const { visible, label } = props;
  const [initial, setInitial] = React.useState(true);
  React.useEffect(() => {
    let raf: number | undefined;
    raf = requestAnimationFrame(() => {
      raf = undefined;
      setInitial(false);
    });
    return () => (raf ? cancelAnimationFrame(raf) : undefined);
  }, []);
  const isVisible = visible && !initial;
  return (
    <View style={styles.container} pointerEvents="none">
      <View
        style={[
          styles.notification,
          isVisible && styles.notificationVisible,
          initial && styles.notificationInitial,
        ]}>
        <Text style={styles.notificationText}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  notification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: '#4630eb',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    transitionDelay: '0s',
    transitionDuration: '0.5s',
    transitionTimingFunction: 'ease-in',
    transform: [{ translateY: -100 }],
  },
  notificationVisible: {
    // @ts-ignore
    transitionDelay: '1s',
    transitionDuration: '1s',
    transitionTimingFunction: 'ease-out',
    transform: [{ translateY: 0 }],
  },
  notificationInitial: {
    // @ts-ignore
    transitionDelay: '5s',
  },
  notificationText: {
    color: 'white',
    fontFamily: "'Source Sans Pro', 'Helvetica Neue', Helvetica, Arial, sans-serif;",
    fontSize: 13,
    fontWeight: '500',
  },
});
