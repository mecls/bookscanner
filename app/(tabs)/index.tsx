import AccessCamera from '@/components/AccessCamera';
import { HelloWave } from '@/components/HelloWave';
import ImagePicker from '@/components/ImagePicker';
import ScansComp from '@/components/ScansComp';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function HomeScreen() {
  return (

    <SafeAreaView style={{ flex: 1, marginTop: 50, margin: 20, backgroundColor: 'transparent' }}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Hi, Mecls1</ThemedText>
        <HelloWave />
      </ThemedView>
      <View style={styles.stepContainer}>
        <ThemedText type="subtitle">Your last scans</ThemedText>
        <ScansComp />
      </View>
      <ThemedView style={styles.stepContainer2}>
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
          <ImagePicker />
          <AccessCamera />
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
    marginTop: 50,
    backgroundColor: 'transparent',
    gap: 8,
  },
  stepContainer2: {
    marginTop: 280,
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
