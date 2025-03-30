import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import { FontAwesome5 } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container} lightColor="#f8f9fa">
      <ThemedText type="title" style={styles.title}>Profile</ThemedText>
      
      {user && (
        <ThemedView style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <FontAwesome5 name="user-circle" size={60} color="#2E8B57" />
          </View>
          <ThemedText type="defaultSemiBold" style={styles.name}>{user.name}</ThemedText>
          <View style={styles.infoRow}>
            <FontAwesome5 name="envelope" size={16} color="#6B7280" style={styles.infoIcon} />
            <ThemedText style={styles.infoText}>{user.email}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5 name={user?.userType === 'donor' ? "hands-helping" : "store"} size={16} color="#6B7280" style={styles.infoIcon} />
            <ThemedText style={styles.infoText}>
              {user?.userType === 'donor' ? 'Donor' : user?.userType === 'nonprofit' ? 'Pantry' : user?.userType}
            </ThemedText>
          </View>
        </ThemedView>
      )}
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <FontAwesome5 name="sign-out-alt" size={16} color="#FFFFFF" style={styles.logoutIcon} />
        <ThemedText style={styles.buttonText}>Logout</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
    marginTop: 60,
    color: '#2E8B57',
  },
  profileCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1F2937',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#4B5563',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    width: '80%',
  },
  logoutIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});