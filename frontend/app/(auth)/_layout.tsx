import { Stack, router } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function AuthLayout() {
  return (
    <ThemedView style={styles.container}>
      <Stack>
        <Stack.Screen 
          name="login" 
          options={{ 
            title: 'Login',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="donor-login" 
          options={{ 
            title: 'Donor Login',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="pantry-login" 
          options={{ 
            title: 'Pantry Login',
            headerShown: true 
          }} 
        />
      </Stack>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.replace('/(tabs)')}
      >
        <ThemedText style={styles.buttonText}>Back to Main</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 