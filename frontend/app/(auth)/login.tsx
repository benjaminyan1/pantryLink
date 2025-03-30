import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome5 } from "@expo/vector-icons";

export default function LoginScreen() {
  const handleDonorLogin = () => {
    router.push('/(auth)/donor-login');
  };

  const handlePantryLogin = () => {
    router.push('/(auth)/pantry-login');
  };
  
  const handleBackToHome = () => {
    router.replace('/(tabs)', {});
  };

  return (
    <ThemedView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackToHome}
      >
        <FontAwesome5 name="arrow-left" size={20} color="#007AFF" />
        <ThemedText style={styles.backButtonText}>Back to Home</ThemedText>
      </TouchableOpacity>
      
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 8,
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