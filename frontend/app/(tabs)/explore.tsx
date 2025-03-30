import { StyleSheet, View, ScrollView, Switch, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useEffect, useState, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { Table, Row, Rows } from 'react-native-table-component';
import { useAuth } from '@/context/AuthContext';
import { FontAwesome5 } from "@expo/vector-icons";

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const tableStyles = StyleSheet.create({
  headerText: {
    fontWeight: 'bold',
    color: '#4B5563',
  },
});

const { width, height } = Dimensions.get('window');

export default function ExploreScreen() {
  const { user } = useAuth();
  const [filterMatches, setFilterMatches] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [nonprofitMarkers, setNonprofitMarkers] = useState<
    { id: string; name: string; latitude: number; longitude: number }[]
  >([]);

  const [selectedNonprofitId, setSelectedNonprofitId] = useState<string | null>(null);
  const [selectedNonprofitName, setSelectedNonprofitName] = useState<string | null>(null);
  const [nonprofitNeeds, setNonprofitNeeds] = useState<any[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [markersReady, setMarkersReady] = useState(false);
  const [mapHeight, setMapHeight] = useState(400);

  // Location tracking effect - only runs once on mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          const coords = location.coords;
          setUserLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        }
      );

      return () => {
        subscription?.remove();
      };
    })();
  }, []); // Empty dependency array means this only runs once on mount

  // Fit the map to show all markers when they're ready
  const fitMapToMarkers = useCallback(() => {
    if (mapRef.current && nonprofitMarkers.length > 0 && mapReady) {
      console.log('Fitting map to markers:', nonprofitMarkers.length);
      
      try {
        const points = [
          ...nonprofitMarkers.map(marker => ({
            latitude: marker.latitude, 
            longitude: marker.longitude
          }))
        ];
        
        // Add user location if available
        if (userLocation) {
          points.push(userLocation);
        }
        
        // Only proceed if we have valid points
        if (points.length > 0) {
          mapRef.current.fitToCoordinates(points, {
            edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
            animated: true
          });
        }
      } catch (error) {
        console.error('Error fitting map to markers:', error);
      }
    }
  }, [nonprofitMarkers, mapReady, userLocation]);

  // Effect to fit map when markers or map readiness changes
  useEffect(() => {
    if (markersReady && mapReady) {
      // Add a small delay to make sure the map is fully ready
      const timer = setTimeout(fitMapToMarkers, 300);
      return () => clearTimeout(timer);
    }
  }, [markersReady, mapReady, fitMapToMarkers]);

  // Separate effect for fetching nonprofits based on filter
  useEffect(() => {
    const fetchNonprofits = async () => {
      try {
        console.log("Fetching nonprofits, filter:", filterMatches);
        const queryParam = filterMatches && user?.id ? `?donorId=${user.id}` : '';
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/nonprofit/addresses${queryParam}`);
        const data: Record<string, string> = await res.json();
        
        console.log("Nonprofit data:", Object.keys(data).length, "entries");

        const geocoded = await Promise.all(
          Object.entries(data).map(async ([nonprofitId, address]) => {
            try {
              const profileRes = await fetch(
                process.env.EXPO_PUBLIC_API_URL + `/api/nonprofit/profile/${nonprofitId}`
              );
              const profileData = await profileRes.json();
              const nonprofitName = profileData.organizationName || nonprofitId;

              const cleanedAddress = address
                .replace(/[']/g, "'")
                .replace(/\s{2,}/g, ' ')
                .trim();

              const geoRes = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                  cleanedAddress + ', USA'
                )}&key=AIzaSyCxiEwZYao45RGv-9Fs85jBdYxYWfvztFs`
              );
              const geoData = await geoRes.json();
              const loc = geoData.results[0]?.geometry.location;
              if (!loc) {
                console.warn('No geocode result for:', cleanedAddress);
                return null;
              }

              return {
                id: nonprofitId,
                name: nonprofitName,
                latitude: loc.lat,
                longitude: loc.lng,
              };
            } catch (error) {
              console.error('Error processing nonprofit:', nonprofitId, error);
              return null;
            }
          })
        );

        const validMarkers = geocoded.filter(Boolean) as typeof nonprofitMarkers;
        console.log("Valid markers:", validMarkers.length);
        setNonprofitMarkers(validMarkers);
        setMarkersReady(true);
      } catch (err) {
        console.error('Failed to fetch nonprofits:', err);
      }
    };

    fetchNonprofits();
  }, [filterMatches, user?.id]);

  const handleMarkerPress = async (nonprofitId: string, nonprofitName: string) => {
    setSelectedNonprofitId(nonprofitId);
    setSelectedNonprofitName(nonprofitName);
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/nonprofit/needs/${nonprofitId}`
      );
      const data = await res.json();
      setNonprofitNeeds(data || []);
      
      // Adjust map height when showing needs
      setMapHeight(250); // Reduce map height to make room for the needs card
      
      // Wait for state to update, then fit map to selected marker
      setTimeout(() => {
        if (mapRef.current) {
          const selectedMarker = nonprofitMarkers.find(m => m.id === nonprofitId);
          if (selectedMarker) {
            mapRef.current.animateToRegion({
              latitude: selectedMarker.latitude,
              longitude: selectedMarker.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02
            }, 500);
          }
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to fetch needs:', error);
    }
  };

  const handleCloseNeeds = () => {
    setSelectedNonprofitId(null);
    setSelectedNonprofitName(null);
    setNonprofitNeeds([]);
    setMapHeight(400); // Reset map height
    fitMapToMarkers(); // Reset map view to show all markers
  };

  const handleMapReady = () => {
    console.log('Map is ready');
    setMapReady(true);
  };

  return (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
    >
      <ThemedView style={styles.container} lightColor="#f8f9fa">
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>Explore Pantries</ThemedText>
          
          <ThemedView style={styles.filterContainer}>
            <ThemedText style={styles.filterLabel}>Show Matching Pantries</ThemedText>
            <Switch
              value={filterMatches}
              onValueChange={setFilterMatches}
              trackColor={{ false: '#D1D5DB', true: '#9BC0B1' }}
              thumbColor={filterMatches ? '#2E8B57' : '#f4f3f4'}
            />
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.viewToggleContainer}>
          <TouchableOpacity 
            style={[
              styles.viewToggleButton, 
              viewMode === 'map' && styles.viewToggleButtonActive
            ]}
            onPress={() => setViewMode('map')}
          >
            <FontAwesome5 
              name="map-marked-alt" 
              size={16} 
              color={viewMode === 'map' ? "#fff" : "#4B5563"} 
            />
            <ThemedText style={[
              styles.viewToggleText,
              viewMode === 'map' && styles.viewToggleTextActive
            ]}>Map</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.viewToggleButton,
              viewMode === 'list' && styles.viewToggleButtonActive
            ]}
            onPress={() => setViewMode('list')}
          >
            <FontAwesome5 
              name="list" 
              size={16} 
              color={viewMode === 'list' ? "#fff" : "#4B5563"}
            />
            <ThemedText style={[
              styles.viewToggleText,
              viewMode === 'list' && styles.viewToggleTextActive
            ]}>List</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {viewMode === 'map' && (
          <View>
            <ThemedView style={styles.mapContainer}>
              <MapView 
                style={[styles.map, { height: mapHeight }]}
                ref={mapRef}
                preserveClusterPressBehavior={true}
                toolbarEnabled={false}
                onMapReady={handleMapReady}
                onLayout={() => console.log('Map layout completed')}
              >
                {userLocation && (
                  <Circle
                    center={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                    radius={30}
                    fillColor="rgba(46, 139, 87, 0.3)" // #2E8B57 with opacity
                    strokeColor="rgba(46, 139, 87, 0.5)" // #2E8B57 with opacity
                  />
                )}
                {nonprofitMarkers.map((marker, idx) => (
                  <Marker
                    key={idx}
                    coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                    title={marker.name}
                    onPress={() => handleMarkerPress(marker.id, marker.name)}
                    pinColor="#2E8B57" // Use our primary green
                  />
                ))}
              </MapView>
            </ThemedView>
            
            {selectedNonprofitId && nonprofitNeeds.length > 0 && (
              <ThemedView style={styles.needsCard}>
                <View style={styles.needsCardHeader}>
                  <ThemedText type="subtitle" style={styles.cardTitle}>
                    {selectedNonprofitName}'s Needs
                  </ThemedText>
                  <TouchableOpacity onPress={handleCloseNeeds} style={styles.closeButton}>
                    <FontAwesome5 name="times" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <View style={styles.tableContainer}>
                  <Table>
                    <Row
                      data={['Item', 'Quantity', 'Urgency']}
                      style={styles.tableHeader}
                      textStyle={tableStyles.headerText}
                    />
                    <Rows
                      data={nonprofitNeeds.map((need) => [
                        need.itemName,
                        need.quantity,
                        need.urgency,
                      ])}
                      textStyle={styles.tableText}
                    />
                  </Table>
                </View>
              </ThemedView>
            )}
          </View>
        )}

        {viewMode === 'list' && (
          <ScrollView style={styles.listContainer}>
            {nonprofitMarkers.map((marker, idx) => (
              <ThemedView key={idx} style={styles.nonprofitCard}>
                <TouchableOpacity
                  style={styles.nonprofitHeader}
                  onPress={async () => {
                    if (expandedIndex === idx) {
                      setExpandedIndex(null);
                    } else {
                      try {
                        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/nonprofit/needs/${marker.id}`);
                        const data = await res.json();
                        setNonprofitNeeds(data || []);
                        setExpandedIndex(idx);
                      } catch (error) {
                        console.error('Failed to fetch needs:', error);
                      }
                    }
                  }}
                >
                  <FontAwesome5 
                    name="store" 
                    size={16} 
                    color="#2E8B57" 
                    style={styles.nonprofitIcon}
                  />
                  <ThemedText type="defaultSemiBold" style={styles.nonprofitName}>
                    {marker.name}
                  </ThemedText>
                  <FontAwesome5 
                    name={expandedIndex === idx ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#6B7280" 
                    style={styles.expandIcon}
                  />
                </TouchableOpacity>

                {expandedIndex === idx && nonprofitNeeds.length > 0 && (
                  <View style={styles.expandedContent}>
                    <ThemedText style={styles.sectionTitle}>Needs List</ThemedText>
                    <View style={styles.tableContainer}>
                      <Table>
                        <Row
                          data={['Item', 'Quantity', 'Urgency']}
                          style={styles.tableHeader}
                          textStyle={tableStyles.headerText}
                        />
                        <Rows
                          data={nonprofitNeeds.map((need) => [
                            need.itemName,
                            need.quantity,
                            need.urgency,
                          ])}
                          textStyle={styles.tableText}
                        />
                      </Table>
                    </View>
                  </View>
                )}
              </ThemedView>
            ))}
          </ScrollView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2E8B57',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  viewToggleContainer: {
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    flex: 1,
  },
  viewToggleButtonActive: {
    backgroundColor: '#2E8B57',
  },
  viewToggleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  viewToggleTextActive: {
    color: 'white',
  },
  mapContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  map: {
    width: '100%',
  },
  needsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  needsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeButton: {
    padding: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E8B57',
  },
  tableContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    height: 40,
    backgroundColor: '#F3F4F6',
  },
  tableText: {
    margin: 6,
    color: '#4B5563',
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  nonprofitCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  nonprofitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  nonprofitIcon: {
    marginRight: 10,
  },
  nonprofitName: {
    flex: 1,
    fontSize: 16,
  },
  expandIcon: {
    marginLeft: 8,
  },
  expandedContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
});