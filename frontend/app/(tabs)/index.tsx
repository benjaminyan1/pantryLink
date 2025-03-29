import { Image, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const { isLoggedIn, user } = useAuth();

  const handleLoginPress = () => {
    router.push('/(auth)/login');
  };

  // Show different UI based on login status
  if (isLoggedIn) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">NOT IMPLEMENTED YET</ThemedText>
        <ThemedText style={{ marginTop: 10 }}>
          Welcome back, {user?.name || "User"}!
        </ThemedText>
      </ThemedView>
    );
  }

  // Default UI when not logged in
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">PantryLink</ThemedText>
        <HelloWave />
      </ThemedView>
      
      <ThemedText style={styles.tagline}>
        Connecting food donors with pantries to fight hunger and reduce waste
      </ThemedText>
      
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">For Donors</ThemedText>
        <ThemedText>
          • Easily donate excess food that would otherwise go to waste{'\n'}
          • Connect with local food pantries in your community{'\n'}
          • Track the impact of your donations{'\n'}
          • Schedule convenient pickups for your donations
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">For Food Pantries</ThemedText>
        <ThemedText>
          • Receive notifications about available food donations{'\n'}
          • Specify the items your pantry needs most{'\n'}
          • Coordinate deliveries efficiently{'\n'}
          • Connect with more donors in your area
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.ctaContainer}>
        <ThemedText style={styles.ctaText}>
          Join our community today to help fight food insecurity
        </ThemedText>
        <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
          <ThemedText style={styles.buttonText}>Login or Register</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagline: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  ctaContainer: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
