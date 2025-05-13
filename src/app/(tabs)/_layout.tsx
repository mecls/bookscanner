import { Tabs } from 'expo-router';
import React, { createContext, useState } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/src/components/HapticTab';
import { IconSymbol } from '@/src/components/ui/IconSymbol';
import { useColorScheme } from '@/src/hooks/useColorScheme';

export type ColorMode = 'salmon' | 'blue';
export const ColorModeContext = createContext<{
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
}>({ colorMode: 'salmon', setColorMode: () => {} });

const SALMON = '#F08080';
const LIGHT_BLUE = '#7EC8E3';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [colorMode, setColorMode] = useState<ColorMode>('salmon');
  const activeColor = colorMode === 'salmon' ? SALMON : LIGHT_BLUE;

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
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
          }}
        />
      </Tabs>
    </ColorModeContext.Provider>
  );
}
