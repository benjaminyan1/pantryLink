import { useState } from 'react';
import { Image, StyleSheet, TextInput, TouchableOpacity, Alert, View } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Config } from '@/constants/Config';
import { useAuth } from '@/context/AuthContext';

export default function DonorLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      await login(email, password, 'donor');
      
      // Navigate to main app
      router.replace('/');
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        error instanceof Error
          ? error.message
          : "Please check your credentials and try again"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push("/(auth)/donor-register");
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.logoContainer}>
        
        <Image 
          source={require('@/assets/images/IMG_4699.jpeg')} 
          style={styles.logoImage} 
          resizeMode="contain"
        />
        <ThemedText type="title" style={styles.title}>
          PantryLink
        </ThemedText>
        <ThemedText style={styles.subtitle}>Donor Login</ThemedText>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8A9CAB"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8A9CAB"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? "Logging in..." : "Log In"}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <ThemedText style={styles.registerButtonText}>
            Don't have an account? <ThemedText style={styles.registerLink}>Register</ThemedText>
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F9F9FB",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    color: "#2E8B57", // Primary brand color
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 10,
  },
  formContainer: {
    width: "100%",
    maxWidth: 340,
  },
  input: {
    width: "100%",
    height: 56,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    backgroundColor: "#2E8B57", // Primary brand color
    padding: 16,
    borderRadius: 12,
    width: "100%",
    marginTop: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  registerButton: {
    marginTop: 24,
    padding: 8,
    alignItems: "center",
  },
  registerButtonText: {
    color: "#6B7280",
    fontSize: 14,
  },
  registerLink: {
    color: "#2E8B57",
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#9BC0B1",
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