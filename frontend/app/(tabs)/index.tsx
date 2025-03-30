import { Image, StyleSheet, Platform, TouchableOpacity, FlatList, Alert, Modal, TextInput, View, ScrollView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const { isLoggedIn, user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  
  // Form state
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [expirationDate, setExpirationDate] = useState('');

  const handleLoginPress = () => {
    router.push('/(auth)/login');
  };

  // Fetch donations when component mounts or user changes
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      fetchDonations();
    }
  }, [isLoggedIn, user]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/donors/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch donations');
      }
      
      const data = await response.json();
      setDonations(data.donations || []);
      
      // Add this debugging code
      console.log('Fetched donations:', data.donations);
      
      // Check if any donation is missing an _id
      const missingIds = data.donations?.filter(d => !d._id || d._id === undefined);
      
    } catch (error) {
      console.error('Error fetching donations:', error);
      Alert.alert('Error', 'Failed to load your donations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDonation = async () => {
    try {
      if (!itemName || !quantity) {
        Alert.alert('Error', 'Please provide item name and quantity');
        return;
      }
      
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          donorId: user.id,
          items: [
            {
              name: itemName,
              quantity: parseInt(quantity),
              expirationDate: expirationDate || undefined
            }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create donation');
      }
      
      setCreateModalVisible(false);
      clearForm();
      fetchDonations();
      Alert.alert('Success', 'Donation created successfully');
    } catch (error) {
      console.error('Error creating donation:', error);
      Alert.alert('Error', 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDonation = async () => {
    try {
      if (!selectedDonation || !quantity) {
        Alert.alert('Error', 'Please provide quantity');
        return;
      }
      
      // Check if item ID exists
      if (!selectedDonation.item._id) {
        console.error('Error: Item ID is undefined');
        Alert.alert('Error', 'Could not identify donation to update');
        return;
      }
      
      console.log('Attempting to update donation with item ID:', selectedDonation.item._id);
      
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');
      
      // Use the donations/by-item/:itemId endpoint with PUT method
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/donations/by-item/${selectedDonation.item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          donorId: user.id,
          quantity: parseInt(quantity),
          expirationDate: expirationDate || undefined
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update API error:', errorData);
        throw new Error('Failed to update donation');
      }
      
      setEditModalVisible(false);
      clearForm();
      fetchDonations();
      Alert.alert('Success', 'Donation updated successfully');
    } catch (error) {
      console.error('Error updating donation:', error);
      Alert.alert('Error', 'Failed to update donation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDonation = async (itemId) => {
    try {
      // Check if itemId exists
      if (!itemId) {
        console.error('Error: Item ID is undefined');
        Alert.alert('Error', 'Could not identify donation to delete');
        return;
      }
      
      console.log('Attempting to delete donation with item ID:', itemId);
      
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this donation?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                const token = await SecureStore.getItemAsync('token');
                
                // Create a custom endpoint or modify your backend to handle deletion by donor and item ID
                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/donations/by-item/${itemId}`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    donorId: user.id
                  })
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  console.error('Delete API error:', errorData);
                  throw new Error('Failed to delete donation');
                }
                
                fetchDonations();
                Alert.alert('Success', 'Donation deleted successfully');
              } catch (error) {
                console.error('Error in delete operation:', error);
                Alert.alert('Error', 'Failed to delete donation');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleDeleteDonation:', error);
      Alert.alert('Error', 'Failed to delete donation');
    }
  };

  const clearForm = () => {
    setItemName('');
    setQuantity('1');
    setExpirationDate('');
    setSelectedDonation(null);
  };

  const openEditModal = (donation) => {
    setSelectedDonation(donation);
    setQuantity(donation.quantity.toString());
    setExpirationDate(donation.expirationDate || '');
    setEditModalVisible(true);
  };

  // Show different UI based on login status
  if (isLoggedIn) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Your Donations</ThemedText>
        
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={() => setCreateModalVisible(true)}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>+ Create Donation</ThemedText>
        </TouchableOpacity>
        
        {loading && <ThemedText>Loading...</ThemedText>}
        
        {!loading && donations.length === 0 && (
          <ThemedText style={styles.emptyText}>
            You don't have any donations yet. Create one to get started!
          </ThemedText>
        )}
        
        <FlatList
          data={donations}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item, index) => item._id?.toString() || `donation-${index}`}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => (
            <ThemedView style={styles.donationItem}>
              <View style={styles.donationDetails}>
                <ThemedText style={styles.itemName}>{item.item.name}</ThemedText>
                <ThemedText>Quantity: {item.quantity}</ThemedText>
                {item.expirationDate && (
                  <ThemedText>Expires: {new Date(item.expirationDate).toLocaleDateString()}</ThemedText>
                )}
                <ThemedText>Status: {item.status}</ThemedText>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]} 
                  onPress={() => openEditModal(item)}
                >
                  <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]} 
                  onPress={() => handleDeleteDonation(item.item._id)}
                >
                  <ThemedText style={styles.actionButtonText}>Delete</ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          )}
        />
        
        {/* Create Modal */}
        <Modal
          visible={createModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setCreateModalVisible(false)}
        >
          <ThemedView style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <ThemedText type="subtitle" style={styles.modalTitle}>Create Donation</ThemedText>
              
              <TextInput
                style={styles.input}
                placeholder="Item Name (e.g., Canned Beans)"
                value={itemName}
                onChangeText={setItemName}
                placeholderTextColor="#666"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Expiration Date (YYYY-MM-DD, optional)"
                value={expirationDate}
                onChangeText={setExpirationDate}
                placeholderTextColor="#666"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setCreateModalVisible(false);
                    clearForm();
                  }}
                >
                  <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={handleCreateDonation}
                  disabled={loading}
                >
                  <ThemedText style={styles.modalButtonText}>
                    {loading ? 'Creating...' : 'Create'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </ThemedView>
        </Modal>
        
        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <ThemedView style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Edit Donation
              </ThemedText>
              
              {selectedDonation && (
                <ThemedText style={styles.itemNameHeader}>
                  {selectedDonation.item.name}
                </ThemedText>
              )}
              
              <TextInput
                style={styles.input}
                placeholder="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Expiration Date (YYYY-MM-DD, optional)"
                value={expirationDate}
                onChangeText={setExpirationDate}
                placeholderTextColor="#666"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setEditModalVisible(false);
                    clearForm();
                  }}
                >
                  <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={handleUpdateDonation}
                  disabled={loading}
                >
                  <ThemedText style={styles.modalButtonText}>
                    {loading ? 'Updating...' : 'Update'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </ThemedView>
        </Modal>
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
    padding: 20,
    paddingBottom: 0, // Remove bottom padding to give more space for the list
  },
  title: {
    marginTop: 53,
    marginBottom: 10, // Reduce the bottom margin
    textAlign: 'center',
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
  
  // New styles for donations list and forms
  list: {
    flex: 1, // Make the list take up all available space
    width: '100%',
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 100, // Add padding to the bottom of the list content
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10, // Reduce vertical padding
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10, // Reduce bottom margin
  },
  donationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  donationDetails: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    marginBottom: 20,
  },
  itemNameHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
