import { Tabs, router } from "expo-router";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isLoggedIn, isDonor } = useAuth();

  // Define a cohesive color palette
  const tabColors = {
    active: "#2E8B57", // Primary green
    inactive: "#8E9AAB", // Muted slate gray
    background: colorScheme === "dark" ? "#1F2937" : "#FFFFFF"
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabColors.active,
        tabBarInactiveTintColor: tabColors.inactive,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          position: Platform.OS === "ios" ? "absolute" : undefined,
          elevation: 0,
          borderTopWidth: 0,
          paddingTop: 10,
          backgroundColor: tabColors.background,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontWeight: '500',
          fontSize: 12,
        }
      }}
    >
      {/* Always show Home tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="home" size={24} color={color} />
          ),
        }}
      />

      {/* Explore tab - only visible when logged in AND user is a donor */}
      <Tabs.Screen
        name="explore"
        options={{
          href: isDonor() ? "/explore" : null,
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="compass" size={24} color={color} />
          ),
        }}
      />

      {/* Profile tab - only visible when logged in */}
      <Tabs.Screen
        name="profile"
        options={{
          href: isLoggedIn ? "/profile" : null,
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="user-circle" size={24} color={color} />
          ),
        }}
      />

      {/* Login tab - only visible when NOT logged in */}
      <Tabs.Screen
        name="login"
        options={{
          href: isLoggedIn ? null : "/login",
          title: "Login",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="sign-in-alt" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
