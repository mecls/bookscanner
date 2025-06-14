import '@/src/config/firebase'; // Import Firebase config
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/src/hooks/useColorScheme';

// Create a custom theme with light beige background
const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F5F5F0', // Light beige color
    card: '#FFFFFF',
  },
};

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F5F5F0', // Keep the same light beige for dark mode too
    card: '#FFFFFF',
  },
};

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('onboarding' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    }
  }, [user, loading]);

  if (loading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LightTheme}>
      <View style={{ flex: 1, backgroundColor: '#F5F5F0' }}>
        <Stack screenOptions={{ 
          contentStyle: { backgroundColor: '#F5F5F0' },
        }}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Helvetica: require('../../assets/fonts/helvetica-255/Helvetica.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
