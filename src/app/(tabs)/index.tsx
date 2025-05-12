import AccessCamera from '@/src/components/AccessCamera';
import { HelloWave } from '@/src/components/HelloWave';
import ImagePicker from '@/src/components/ImagePicker';
import ISBNScanner from '@/src/components/ISBNScanner';
import ScansComp from '@/src/components/ScansComp';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import React, { useState } from 'react';
import { Image as RNImage, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const BOOK_IMAGE = require('@/assets/images/book.png'); // Place a book icon in assets/images/book.png

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const bounce = useSharedValue(0);

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

  return (
    <SafeAreaView style={{ flex: 1, marginTop: 50, margin: 20, backgroundColor: 'transparent' }}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ color: 'black' }}>Hi, Mecls1</ThemedText>
        <HelloWave />
      </ThemedView>
      <View style={styles.stepContainer}>
        <ThemedText type="subtitle" style={{ color: 'black' }}>Your last scans</ThemedText>
        <ScansComp />
      </View>
      <ThemedView style={styles.stepContainer2}>
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
          <ImagePicker setLoading={setLoading} />
          <AccessCamera setLoading={setLoading} />
          <ISBNScanner setLoading={setLoading} />
        </View>
      </ThemedView>
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <Animated.View style={[styles.bounceBook, animatedStyle]}>
            <RNImage source={BOOK_IMAGE} style={{ width: 100, height: 120 }} resizeMode="contain" />
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
    flex:2,
    marginTop: 40,
    backgroundColor: 'transparent',
    gap: 8,
  },
  stepContainer2: {
    marginBottom:100,
    backgroundColor: 'transparent',
    gap: 8,
    alignSelf: 'center',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  loadingOverlay: {
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
