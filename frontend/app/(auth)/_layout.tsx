import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide the default header
        animation: 'slide_from_left', // Animation for pushing to next screen
        animationTypeForReplace: 'pop', // Animation for going back
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="donor-login" />
      <Stack.Screen name="donor-register" />
      <Stack.Screen name="pantry-login" />
      <Stack.Screen name="pantry-register" />
    </Stack>
  );
}
