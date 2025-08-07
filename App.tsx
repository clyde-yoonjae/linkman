import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Button } from "@/components";
import { COLORS, SIZES } from "@/constants";

export default function App() {
  const handlePress = () => {
    console.log("Button pressed!");
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="auto" />
          <View style={styles.content}>
            <Text style={styles.title}>LinkMan</Text>
            <Text style={styles.subtitle}>
              링크 관리 앱에 오신 것을 환영합니다!
            </Text>
            <Button
              title="시작하기"
              onPress={handlePress}
              style={styles.button}
            />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SIZES.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: SIZES.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: SIZES.xl,
  },
  button: {
    marginTop: SIZES.md,
  },
});
