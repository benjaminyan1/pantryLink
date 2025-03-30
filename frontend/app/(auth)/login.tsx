import { StyleSheet, TouchableOpacity, View, Image } from 'react-native';
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
    <ThemedView style={styles.container} lightColor="#f8f9fa">
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackToHome}
      >
        <FontAwesome5 name="arrow-left" size={20} color="#2E8B57" />
        <ThemedText style={styles.backButtonText}>Back to Home</ThemedText>
      </TouchableOpacity>
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/IMG_4699.jpeg')} 
          style={styles.logoImage} 
          resizeMode="contain"
        />
        <ThemedText type="title" style={styles.title}>PantryLink</ThemedText>
        <ThemedText style={styles.subtitle}>Please select your account type</ThemedText>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleDonorLogin}>
          <FontAwesome5 name="hands-helping" size={20} color="#fff" style={styles.buttonIcon} />
          <ThemedText style={styles.buttonText}>I am a Donor</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handlePantryLogin}>
          <FontAwesome5 name="store" size={20} color="#fff" style={styles.buttonIcon} />
          <ThemedText style={styles.buttonText}>I am a Non-Profit</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonText: {
    color: '#2E8B57',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#2E8B57',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 340,
  },
  button: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: 16,
    borderRadius: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: 16,
    borderRadius: 10,
  },
});