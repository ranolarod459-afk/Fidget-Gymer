import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  PressStart2P_400Regular,
} from "@expo-google-fonts/press-start-2p";
import { VT323_400Regular } from "@expo-google-fonts/vt323";

import { preloadSounds } from "./src/utils/sounds";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { ScanlineOverlay } from "./src/components/ScanlineOverlay";
import { colors } from "./src/theme/colors";

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
    VT323_400Regular,
  });
  useEffect(() => {
    void preloadSounds();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" backgroundColor={colors.bg} />
        <RootNavigator />
        <ScanlineOverlay />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
