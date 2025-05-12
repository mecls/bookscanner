import AccessCamera from '@/src/components/AccessCamera';
import { HelloWave } from '@/src/components/HelloWave';
import ImagePicker from '@/src/components/ImagePicker';
import ISBNScanner from '@/src/components/ISBNScanner';
import ScansComp from '@/src/components/ScansComp';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
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
          <ImagePicker />
          <AccessCamera />
          <ISBNScanner />
        </View>
      </ThemedView>
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
});
