import { Image, StyleSheet, Platform, TouchableOpacity, FlatList, Alert, Modal, TextInput, View, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome5 } from "@expo/vector-icons";

export default function HomeScreen() {
  const { isLoggedIn, user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [scanningModalVisible, setScanningModalVisible] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [editNeedModalVisible, setEditNeedModalVisible] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState(null);

  // Form state
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [expirationDate, setExpirationDate] = useState('');
  const [needs, setNeeds] = useState([]);
  const [urgency, setUrgency] = useState('50'); // Default to the middle of the range

  const handleLoginPress = () => {
    router.push('/(auth)/login');
  };

  // Fetch donations when component mounts or user changes
  useEffect(() => {
    if (isLoggedIn && user?.id && user?.userType === 'donor') {
      fetchDonations();
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (isLoggedIn && user?.userType === 'nonprofit' && user?.id) {
      fetchNeeds();
    }
  }, [isLoggedIn, user]);

  const fetchNeeds = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');
      console.log('User from AuthContext:', user);
      const incrementedLastChar = (parseInt(user.id.slice(-1), 16) + 1).toString(16).padStart(1, '0');
      const incrementedId = user.id.slice(0, -1) + incrementedLastChar;
      console.log(`${process.env.EXPO_PUBLIC_API_URL}/api/nonprofit/needs/${incrementedId}`);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/nonprofit/needs/${incrementedId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch needs');
      }
      const data = await response.json();
      console.log(data);
      setNeeds(data || []);
    } catch (error) {
      console.error('Error fetching needs:', error);
      Alert.alert('Error', 'Failed to load your needs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNeed = async () => {
    try {
      if (!itemName || !quantity || !urgency) {
        Alert.alert('Error', 'Please provide item name, quantity, and urgency');
        return;
      }
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');
      const incrementedLastChar = (parseInt(user.id.slice(-1), 16) + 1).toString(16).padStart(1, '0');
      const incrementedId = user.id.slice(0, -1) + incrementedLastChar;
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/nonprofit/needs/${incrementedId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ "need": {
          "itemName": itemName,
          "quantity": parseInt(quantity),
          "urgency": urgency}
          
        })
      });
      if (!response.ok) {
        throw new Error('Failed to create need');
      }
      setCreateModalVisible(false);
      clearNeedForm();
      fetchNeeds();
      Alert.alert('Success', 'Need created successfully');
    } catch (error) {
      console.error('Error creating need:', error);
      Alert.alert('Error', 'Failed to create need');
    } finally {
      setLoading(false);
    }
  };

  const clearNeedForm = () => {
    setItemName('');
    setQuantity('1');
    setUrgency('');
  };

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');

      console.log(user);
      
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
      
      console.log('Fetched donations:', data.donations);
      
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
      
      if (!selectedDonation.item._id) {
        console.error('Error: Item ID is undefined');
        Alert.alert('Error', 'Could not identify donation to update');
        return;
      }
      
      console.log('Attempting to update donation with item ID:', selectedDonation.item._id);
      
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');
      
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

  const openEditNeedModal = (need) => {
    setSelectedNeed(need);
    setItemName(need.itemName);
    setQuantity(need.quantity.toString());
    setUrgency(need.urgency);
    setEditNeedModalVisible(true);
  };

  const handleUpdateNeed = async () => {
    try {
      if (!selectedNeed || !quantity || !urgency) {
        Alert.alert('Error', 'Please provide quantity and urgency');
        return;
      }
      
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');
      const incrementedLastChar = (parseInt(user.id.slice(-1), 16) + 1).toString(16).padStart(1, '0');
      const incrementedId = user.id.slice(0, -1) + incrementedLastChar;
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/nonprofit/needs/${incrementedId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          need: {
            itemName: selectedNeed.itemName,
            quantity: parseInt(quantity),
            urgency: urgency
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update need');
      }
      
      setEditNeedModalVisible(false);
      clearNeedForm();
      fetchNeeds();
      Alert.alert('Success', 'Need updated successfully');
    } catch (error) {
      console.error('Error updating need:', error);
      Alert.alert('Error', 'Failed to update need');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNeed = async (itemName) => {
    try {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this need?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                const token = await SecureStore.getItemAsync('token');
                const incrementedLastChar = (parseInt(user.id.slice(-1), 16) + 1).toString(16).padStart(1, '0');
                const incrementedId = user.id.slice(0, -1) + incrementedLastChar;
                
                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/nonprofit/needs/${incrementedId}`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    itemName: itemName
                  })
                });
                
                if (!response.ok) {
                  throw new Error('Failed to delete need');
                }
                
                fetchNeeds();
                Alert.alert('Success', 'Need deleted successfully');
              } catch (error) {
                console.error('Error deleting need:', error);
                Alert.alert('Error', 'Failed to delete need');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleDeleteNeed:', error);
      Alert.alert('Error', 'Failed to delete need');
    }
  };

  const pickImage = async () => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert('Permission needed', 'Camera and photo library permissions are needed to scan donations');
        return;
      }

      Alert.alert(
        'Choose Image Source',
        'Take a new photo or select from gallery?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Photo Library', onPress: selectFromGallery },
          { text: 'Take Photo', onPress: takePhoto }
        ]
      );
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to access camera or photo library');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImagePreview(result.assets[0].uri);
        setScanningModalVisible(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImagePreview(result.assets[0].uri);
        setScanningModalVisible(true);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const processImageWithGemini = async () => {
    if (!imagePreview || !user?.id) {
      Alert.alert('Error', 'No image selected or user not logged in');
      return;
    }

    setProcessingImage(true);

    try {
      const formData = new FormData();
      const filename = imagePreview.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image';

      formData.append('image', {
        uri: imagePreview,
        name: filename || 'photo.jpg',
        type
      });
      
      formData.append('donorId', user.id);

      const token = await SecureStore.getItemAsync('token');
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/donations/image-to-donation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process image');
      }

      const result = await response.json();
      
      setScanningModalVisible(false);
      setImagePreview(null);
      fetchDonations();
      
      Alert.alert(
        'Success!', 
        `Found ${result.detectedItems.length} items:\n${result.detectedItems.map(item => `• ${item.name} (${item.quantity})`).join('\n')}`
      );
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', error.message || 'Failed to process image');
    } finally {
      setProcessingImage(false);
    }
  };

  if (isLoggedIn && user?.userType === 'donor') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Your Donations</ThemedText>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.createBtn]} 
            onPress={() => setCreateModalVisible(true)}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>+ Create Donation</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.scanBtn]} 
            onPress={pickImage}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>📷 Scan Items</ThemedText>
          </TouchableOpacity>
        </View>
        
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
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]} 
                  onPress={() => openEditModal(item)}
                >
                  {/* <ThemedText style={styles.actionButtonText}>Edit</ThemedText> */}
                  <View style={styles.actionButtonContainer}>
                    <FontAwesome5 name="pen" size={13} color="#000" style={styles.editIcon} />
                    <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
                  </View>

                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]} 
                  onPress={() => handleDeleteDonation(item.item._id)}
                >
                  <View style={styles.actionButtonContainer}>
                    <FontAwesome5 name="trash" size={13} color="#000" style={styles.editIcon} />
                  <ThemedText style={styles.actionButtonText}>Delete</ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
            </ThemedView>
          )}
        />
        
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
        
        <Modal
          visible={scanningModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            if (!processingImage) {
              setScanningModalVisible(false);
              setImagePreview(null);
            }
          }}
        >
          <ThemedView style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <ThemedText type="subtitle" style={styles.modalTitle}>Scan Donations</ThemedText>
              
              {imagePreview && (
                <Image 
                  source={{ uri: imagePreview }} 
                  style={styles.imagePreview} 
                  resizeMode="contain"
                />
              )}
              
              <ThemedText style={styles.scanInfo}>
                Gemini AI will analyze this image and detect food items automatically.
              </ThemedText>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setScanningModalVisible(false);
                    setImagePreview(null);
                  }}
                  disabled={processingImage}
                >
                  <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={processImageWithGemini}
                  disabled={processingImage}
                >
                  <ThemedText style={styles.modalButtonText}>
                    {processingImage ? 'Processing...' : 'Process Image'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </ThemedView>
        </Modal>
      </ThemedView>
    );
  }
  
  if (isLoggedIn && user?.userType === 'nonprofit') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Your Needs</ThemedText>
        <TouchableOpacity 
          style={styles.createNeedButton} 
          onPress={() => setCreateModalVisible(true)}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>+ Create Need</ThemedText>
        </TouchableOpacity>
        {loading && <ThemedText>Loading...</ThemedText>}
        {!loading && needs.length === 0 && (
          <ThemedText style={styles.emptyText}>
            You don't have any needs yet. Create one to get started!
          </ThemedText>
        )}
        <FlatList
          data={needs}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item, index) => item._id?.toString() || `need-${index}`}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => (
            <ThemedView style={styles.donationItem}>
              <View style={styles.donationDetails}>
                <ThemedText style={styles.itemName}>{item.itemName}</ThemedText>
                <ThemedText>Quantity: {item.quantity}</ThemedText>
                <ThemedText>Urgency: {item.urgency}</ThemedText>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]} 
                  onPress={() => openEditNeedModal(item)}
                >
                  <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]} 
                  onPress={() => handleDeleteNeed(item.itemName)}
                >
                  <ThemedText style={styles.actionButtonText}>Delete</ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          )}
        />
        <Modal
          visible={createModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setCreateModalVisible(false)}
        >
          <ThemedView style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <ThemedText type="subtitle" style={styles.modalTitle}>Create Need</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Item Name"
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
              <ThemedText style={styles.sliderLabel}>
                Urgency: {urgency}
              </ThemedText>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={parseInt(urgency) || 0}
                onValueChange={(value) => setUrgency(value.toString())}
                minimumTrackTintColor="#4CD964"  // Light green
                maximumTrackTintColor="#FF3B30"  // Red
                thumbTintColor="#007AFF"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setCreateModalVisible(false);
                    clearNeedForm();
                  }}
                >
                  <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={handleCreateNeed}
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
        <Modal
          visible={editNeedModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditNeedModalVisible(false)}
        >
          <ThemedView style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <ThemedText type="subtitle" style={styles.modalTitle}>Edit Need</ThemedText>
              
              {selectedNeed && (
                <ThemedText style={styles.itemNameHeader}>
                  {selectedNeed.itemName}
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
              
              <ThemedText style={styles.sliderLabel}>
                Urgency: {urgency}
              </ThemedText>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={parseInt(urgency) || 0}
                onValueChange={(value) => setUrgency(value.toString())}
                minimumTrackTintColor="#4CD964"  // Light green
                maximumTrackTintColor="#FF3B30"  // Red
                thumbTintColor="#007AFF"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setEditNeedModalVisible(false);
                    clearNeedForm();
                  }}
                >
                  <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={handleUpdateNeed}
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
  
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: '#fff' }]}>
      <ThemedView style={[styles.titleContainer, { marginTop: 60, marginHorizontal: 20 }]}>        
        <ThemedText type="title">PantryLink</ThemedText>
        <HelloWave />
      </ThemedView>
      
      <ThemedText style={[styles.tagline, { marginHorizontal: 20 }]}>
        Connecting food donors with pantries to fight hunger and reduce waste
      </ThemedText>
      
      <ThemedView style={[styles.sectionContainer, { marginHorizontal: 20 }]}>
        <ThemedText type="subtitle">For Donors</ThemedText>
        <ThemedText>
          • Easily donate excess food that would otherwise go to waste{'\n'}
          • Connect with local food pantries in your community{'\n'}
          • Track the impact of your donations{'\n'}
          • Schedule convenient pickups for your donations
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={[styles.sectionContainer, { marginHorizontal: 20 }]}>
        <ThemedText type="subtitle">For Food Pantries</ThemedText>
        <ThemedText>
          • Receive notifications about available food donations{'\n'}
          • Specify the items your pantry needs most{'\n'}
          • Coordinate deliveries efficiently{'\n'}
          • Connect with more donors in your area
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={[styles.ctaContainer, { backgroundColor: '#fff' }]}>
        <ThemedText style={styles.ctaText}>
          Join our community today to help fight food insecurity
        </ThemedText>
        <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
          <ThemedText style={styles.buttonText}>Login or Register</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    marginTop: 53,
    marginBottom: 10,
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
    backgroundColor: '#4A90E2',
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
  list: {
    flex: 1,
    width: '100%',
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
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
    backgroundColor: '#4A90E2',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  createBtn: {
    backgroundColor: '#2E8B57',
    marginRight: 5,
  },
  scanBtn: {
    backgroundColor: '#9BC0B1',
    marginLeft: 5,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
  },
  scanInfo: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
    color: '#666',
  },
  createNeedButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    // alignSelf: 'flex-start',
    marginBottom: 15,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 15,
  },
  sliderLabel: {
    width: '100%',
    textAlign: 'center',
    marginVertical: 5,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIcon: {
    marginRight: 8, // spacing between icon and text
  },
  actionButtonText: {
    fontSize: 16,
    // other styles you had
  },

});

