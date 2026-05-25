import { Stack } from "expo-router";
import { ThemeProvider, useTheme } from "../components/ThemeContext";
import { AccidentDetectionProvider } from "../components/AccidentDetectionContext";
import AccidentCountdownOverlay from "../components/AccidentCountdownOverlay";
import { StatusBar, View } from "react-native";
import Animated, { useAnimatedStyle, withTiming, useSharedValue, interpolateColor } from "react-native-reanimated";
import { useEffect, useState } from "react";
import { registerForPushNotificationsAsync } from "../utils/notificationHelper";

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { currentTheme, colors, isDarkMode } = useTheme();
  const opacity = useSharedValue(1);
  const bgProgress = useSharedValue(1);
  const [prevBg, setPrevBg] = useState(colors.background);
  const [currBg, setCurrBg] = useState(colors.background);

  useEffect(() => {
    setPrevBg(currBg);
    setCurrBg(colors.background);
    bgProgress.value = 0;
    bgProgress.value = withTiming(1, { duration: 500 });

    opacity.value = 0.5;
    opacity.value = withTiming(1, { duration: 500 });
  }, [currentTheme]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      bgProgress.value,
      [0, 1],
      [prevBg, currBg]
    );
    return {
      flex: 1,
      opacity: opacity.value,
      backgroundColor,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      {children}
    </Animated.View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <ThemeProvider>
      <AccidentDetectionProvider>
        <ThemeWrapper>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="accident-detection" />
          </Stack>
          <AccidentCountdownOverlay />
        </ThemeWrapper>
      </AccidentDetectionProvider>
    </ThemeProvider>
  );
}
