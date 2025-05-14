import AccessCamera from '@/src/components/AccessCamera';
import { HelloWave } from '@/src/components/HelloWave';
import ImagePicker from '@/src/components/ImagePicker';
import ISBNScanner from '@/src/components/ISBNScanner';
import ScansComp from '@/src/components/ScansComp';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import React, { useContext } from 'react';
import { Image as RNImage, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ColorModeContext } from './_layout';

const BOOK_IMAGE = require('@/assets/images/book.png'); // Place a book icon in assets/images/book.png

const SALMON = '#F08080';
const LIGHT_BLUE = '#7EC8E3';

export default function HomeScreen() {
  const [loading, setLoading] = React.useState(false);
  const bounce = useSharedValue(0);
  const { colorMode, setColorMode } = useContext(ColorModeContext);

  React.useEffect(() => {
    if (loading) {
      bounce.value = withRepeat(
        withSequence(
          withSpring(-40, { damping: 2 }),
          withSpring(0, { damping: 2 })
        ),
        -1,
        true
      );
    } else {
      bounce.value = 0;
    }
  }, [loading]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  const buttonColor = colorMode === 'salmon' ? SALMON : LIGHT_BLUE;

  return (
    <SafeAreaView style={{ flex: 1, marginTop: 40, margin: 20, backgroundColor: 'transparent' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={{ color: 'black' }}>Hi, Mecls1</ThemedText>
          <HelloWave />
        </ThemedView>
        <TouchableOpacity
          onPress={() => setColorMode(colorMode === 'salmon' ? 'blue' : 'salmon')}
          style={{ padding: 8 }}
          accessibilityLabel="Toggle button color"
        >
          <Ionicons name="color-palette" size={28} color={buttonColor} />
        </TouchableOpacity>
      </View>
      <View style={styles.stepContainer}>
        <ThemedText type="subtitle" style={{ color: 'black' }}>Your last scans</ThemedText>
        <ScansComp />
      </View>
      <ThemedView style={styles.stepContainer2}>
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
          <View style={styles.iconContainer}>
            <ImagePicker setLoading={setLoading} buttonColor={buttonColor} />
            <ThemedText type='defaultSemiBold' style={styles.iconLabel}>Gallery</ThemedText>
          </View>
          <View style={styles.iconContainer}>
            <ISBNScanner setLoading={setLoading} buttonColor={buttonColor} />
            <ThemedText type='defaultSemiBold' style={styles.iconLabel}>ISBN</ThemedText>
          </View>
          <View style={styles.iconContainer}>
            <AccessCamera setLoading={setLoading} buttonColor={buttonColor} />
            <ThemedText type='defaultSemiBold' style={styles.iconLabel}>Camera</ThemedText>
          </View>
        </View>
      </ThemedView>
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <Animated.View style={[styles.bounceBook, animatedStyle]}>
            <RNImage source={BOOK_IMAGE} style={{ width: 100, height: 120 }} resizeMode="cover" />
          </Animated.View>
          <ThemedText style={styles.loadingText}>Finding your book and summary...</ThemedText>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 8,
  },
  stepContainer: {
    flex: 2,
    marginTop: 40,
    backgroundColor: 'transparent',
    gap: 8,
  },
  stepContainer2: {
    marginBottom: 80,
    backgroundColor: 'transparent',
    gap: 8,
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  loadingOverlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderRadius: 20,
  },
  bounceBook: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    fontStyle: 'italic',
  },
});


