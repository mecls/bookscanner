import { Tabs } from 'expo-router';
import React, { createContext, useState } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/src/components/HapticTab';
import { IconSymbol } from '@/src/components/ui/IconSymbol';
import { Colors } from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Feather from '@expo/vector-icons/build/Feather';

export type ColorMode = 'salmon' | 'orange';
export const ColorModeContext = createContext<{
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
}>({ colorMode: 'salmon', setColorMode: () => {} });

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [colorMode, setColorMode] = useState<ColorMode>('salmon');
  const activeColor = colorMode === 'salmon' ? Colors.light.salmon : Colors.light.lightOrange;

  return (
    <ColorModeContext.Provider value={{ colorMode, setColorMode }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: activeColor, // Use context color
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: Platform.select({
            ios: {
              backgroundColor: '#fff',
              position: 'absolute',
            },
            android: {
              backgroundColor: '#fff',
            },
            default: {
              backgroundColor: '#fff',
            },
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="gallery"
          options={{
            title: 'Gallery',
            tabBarIcon: ({ color }) => <Feather name="book-open" size={24} color={color} />,
          }}
        />
      </Tabs>
    </ColorModeContext.Provider>
  );
}
