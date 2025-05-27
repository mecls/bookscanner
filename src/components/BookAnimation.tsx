import { ColorModeContext } from '@/src/app/(tabs)/_layout';
import { Colors } from '@/src/constants/Colors';
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from 'react-native-reanimated';

interface BookAnimationProps {
  isVisible: boolean;
  bookImage?: string;
}

export default function BookAnimation({ isVisible, bookImage }: BookAnimationProps) {
  const { colorMode } = useContext(ColorModeContext);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (isVisible) {
      // Reset values
      translateX.value = 0;
      scale.value = 1;

      // Bounce animation sequence
      translateX.value = withSequence(
        withSpring(-20, { damping: 8 }),
        withSpring(20, { damping: 8 }),
        withSpring(-10, { damping: 8 }),
        withSpring(10, { damping: 8 }),
        withSpring(0, { damping: 8 })
      );
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.book,
          animatedStyle,
          { backgroundColor: colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  book: {
    width: 80,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
}); 