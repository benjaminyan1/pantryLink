import { Stack } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { ThemedView } from "@/components/ThemedView";

export default function AuthLayout() {
  return (
    <ThemedView style={styles.container} lightColor="#f8f9fa">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationTypeForReplace: 'pop',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="donor-login" />
        <Stack.Screen name="donor-register" />
        <Stack.Screen name="pantry-login" />
        <Stack.Screen name="pantry-register" />
      </Stack>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
