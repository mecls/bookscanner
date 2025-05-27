import { HelloWave } from '@/src/components/HelloWave';
import ISBNScanner from '@/src/components/ISBNScanner';
import ReadingStreak from '@/src/components/ReadingStreak';
import ScansComp from '@/src/components/ScansComp';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { Colors } from '@/src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useContext } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ColorModeContext } from './_layout';


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

  const buttonColor = colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title" style={{ color: 'black' }}>Hi, leugim</ThemedText>
            <HelloWave />
          </ThemedView>
          <TouchableOpacity
            onPress={() => setColorMode(colorMode === 'salmon' ? 'orange' : 'salmon')}
            style={{ padding: 8 }}
            accessibilityLabel="Toggle button color"
          >
            <Ionicons name="color-palette" size={28} color={buttonColor} />
          </TouchableOpacity>
        </View>

        <ReadingStreak />
        
        <View style={styles.stepContainer}>
          <ThemedText type="subtitle" style={{ color: 'black' }}>Your last scans</ThemedText>
          <ScansComp />
        </View>

        <ThemedView style={styles.stepContainer2}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.iconContainer}>
              <ISBNScanner setLoading={setLoading} buttonColor={buttonColor} />
              <ThemedText type='defaultSemiBold' style={styles.iconLabel}>ISBN</ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <View style={styles.loadingContent}>
            <ActivityIndicator 
              size="large" 
              color={colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange} 
              style={styles.loadingSpinner}
            />
            <ThemedText style={styles.loadingText}>Finding and summarizing your book...</ThemedText>
            <ThemedText style={styles.loadingText}>This won't take long...</ThemedText>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 8,
  },
  stepContainer: {
    flex: 1,
    marginTop: 0,
    backgroundColor: 'transparent',
    gap: 8,
  },
  stepContainer2: {
    marginTop: 30,
    marginBottom: 30,
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bounceBook: {
    marginBottom: 20,
  },
  loadingSpinner: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
});


