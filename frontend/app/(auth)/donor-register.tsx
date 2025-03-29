import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function DonorRegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleRegister = async () => {
    // Basic validation
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Password validation (at least 8 characters)
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    
    try {
      const registerResponse = await fetch(`http://10.142.47.118:3000/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          phone,
          userType: 'donor' // Using the updated schema with userType
        }),
      });
      
      const registerData = await registerResponse.json();
      
      if (!registerResponse.ok) {
        throw new Error(registerData.error || registerData.details || 'Registration failed');
      }
      
      Alert.alert(
        'Registration Successful',
        'Your donor account has been created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/donor-login')
          }
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed', 
        error instanceof Error ? error.message : 'Please try again later'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Donor Registration</ThemedText>
        
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#666"
          value={fullName}
          onChangeText={setFullName}
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
          placeholder="Phone Number (optional)"
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
            {loading ? 'Registering...' : 'Register'}
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
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
});