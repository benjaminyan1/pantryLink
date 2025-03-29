import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Config } from "@/constants/Config";

export default function PantryRegisterScreen() {
  const [organizationName, setOrganizationName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Basic validation
    if (!organizationName || !email || !password || !address) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    // Password validation
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      // Register with Auth0 and create nonprofit profile
      const registerResponse = await fetch(
        `http://10.142.45.101:3000/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: organizationName, // Use organization name as the name
            email,
            password,
            phone,
            userType: "nonprofit",
            organizationName,
            address,
          }),
        }
      );

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(
          registerData.error || registerData.details || "Registration failed"
        );
      }

      Alert.alert(
        "Registration Successful",
        "Your pantry account has been created successfully!",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/pantry-login"),
          },
        ]
      );
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert(
        "Registration Failed",
        error instanceof Error ? error.message : "Please try again later"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Pantry Registration
        </ThemedText>

        <TextInput
          style={styles.input}
          placeholder="Organization Name"
          placeholderTextColor="#666"
          value={organizationName}
          onChangeText={setOrganizationName}
        />

        <TextInput
          style={styles.input}
          placeholder="Address"
          placeholderTextColor="#666"
          value={address}
          onChangeText={setAddress}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? "Registering..." : "Register"}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    backgroundColor: "#CCCCCC",
  },
});
