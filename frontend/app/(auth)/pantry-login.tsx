import { useState } from "react";
import { Image, StyleSheet, TextInput, TouchableOpacity, Alert, View } from "react-native";
import { router } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { FontAwesome5 } from "@expo/vector-icons";

export default function PantryLoginScreen() {
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
      await login(email, password, 'nonprofit');
      
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
    router.push("/(auth)/pantry-register");
  };

  return (
    <ThemedView style={styles.container} lightColor="#f8f9fa">
        <Image 
          source={require('@/assets/images/IMG_4699.jpeg')} 
          style={styles.logoImage} 
          resizeMode="contain"
        />
      <View style={styles.logoContainer}>
        <ThemedText type="title" style={styles.title}>
          PantryLink
        </ThemedText>
        <ThemedText style={styles.subtitle}>Non-Profit Login</ThemedText>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <FontAwesome5 name="envelope" size={16} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8A9CAB"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome5 name="lock" size={16} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#8A9CAB"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? "Logging in..." : "Log In"}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.registerLink}
          onPress={handleRegister}
        >
          <ThemedText style={styles.registerLinkText}>
            Don't have an account? <ThemedText style={styles.registerLinkHighlight}>Register</ThemedText>
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
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    color: "#2E8B57", 
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 8,
  },
  formContainer: {
    width: "100%",
    maxWidth: 340,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 56,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#1F2937",
    paddingRight: 16,
  },
  button: {
    backgroundColor: "#2E8B57",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    marginTop: 8,
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
  buttonDisabled: {
    backgroundColor: "#9BC0B1",
  },
  registerLink: {
    marginTop: 24,
    padding: 8,
    alignItems: "center",
  },
  registerLinkText: {
    color: "#6B7280",
    fontSize: 14,
  },
  registerLinkHighlight: {
    color: "#2E8B57",
    fontWeight: "600",
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