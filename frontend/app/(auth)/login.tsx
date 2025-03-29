import { StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function LoginScreen() {
  const handleDonorLogin = () => {
    router.push('/(auth)/donor-login');
  };

  const handlePantryLogin = () => {
    router.push('/(auth)/pantry-login');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Welcome to PantryLink</ThemedText>
      <ThemedText style={styles.subtitle}>Please select your account type</ThemedText>
      
      <TouchableOpacity style={styles.button} onPress={handleDonorLogin}>
        <ThemedText style={styles.buttonText}>I am a Donor</ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handlePantryLogin}>
        <ThemedText style={styles.buttonText}>I am a Pantry</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 