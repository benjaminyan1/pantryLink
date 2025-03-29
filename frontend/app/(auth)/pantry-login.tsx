import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function PantryLoginScreen() {
  const handleLogin = () => {
    // TODO: Implement actual login logic
    console.log('Pantry login attempted');
  };

  const handleRegister = () => {
    // TODO: Navigate to register screen
    console.log('Navigate to pantry register');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Pantry Login</ThemedText>
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#666"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <ThemedText style={styles.buttonText}>Login</ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.back()}>
        <ThemedText style={styles.backButton}>Back</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <ThemedText style={styles.registerButtonText}>Don't have an account? Register</ThemedText>
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
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    color: '#007AFF',
  },
  registerButton: {
    marginTop: 15,
    padding: 10,
  },
  registerButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
}); 