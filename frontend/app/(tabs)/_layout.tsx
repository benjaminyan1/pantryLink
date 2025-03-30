import { Tabs, router } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isLoggedIn } = useAuth();

  console.log("Auth state in TabLayout:", { isLoggedIn });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      {/* Always show Home tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* Explore tab - only visible when logged in */}
      <Tabs.Screen
        name="explore"
        options={{
          href: isLoggedIn ? "/explore" : null,
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
