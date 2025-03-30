import { StyleSheet, View, ScrollView, Button } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import { Table, Row, Rows } from 'react-native-table-component';
import { useAuth } from '@/context/AuthContext';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const tableStyles = StyleSheet.create({
  headerText: {
    fontWeight: 'bold',
  },
});

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
          console.log('[LOCATION UPDATE]', coords.latitude, coords.longitude);
          mapRef.current?.animateToRegion(
            {
              latitude: coords.latitude,
              longitude: coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            1000
          );
        }
      );

      return () => {
        subscription?.remove();
      };
    })();

    const fetchNonprofits = async () => {
      try {
        const queryParam = filterMatches && user?.id ? `?donorId=${user.id}` : '';
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/nonprofit/addresses${queryParam}`);
        const data: Record<string, string> = await res.json();

        const geocoded = await Promise.all(
          Object.entries(data).map(async ([nonprofitId, address]) => {
            const profileRes = await fetch(
              process.env.EXPO_PUBLIC_API_URL + `/api/nonprofit/profile/${nonprofitId}`
            );
            const profileData = await profileRes.json();
            const nonprofitName = profileData.organizationName || nonprofitId;

            const cleanedAddress = address
              .replace(/[’]/g, "'")
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
          })
        );

        setNonprofitMarkers(geocoded.filter(Boolean) as typeof nonprofitMarkers);
      } catch (err) {
        console.error('Failed to fetch nonprofits:', err);
      }
    };

    fetchNonprofits();
  }, [filterMatches]);

  const handleMarkerPress = async (nonprofitId: string, nonprofitName: string) => {
    setSelectedNonprofitId(nonprofitId);
    setSelectedNonprofitName(nonprofitName);
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/nonprofit/needs/${nonprofitId}`
      );
      const data = await res.json();
      setNonprofitNeeds(data || []);
    } catch (error) {
      console.error('Failed to fetch needs:', error);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: '#fff' }}>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Explore</ThemedText>
      </ThemedView>

      <ThemedView style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginTop: 10 }}>
        <Button title="Map View" onPress={() => setViewMode('map')} />
        <Button title="List View" onPress={() => setViewMode('list')} />
      </ThemedView>

      {viewMode === 'map' && (
        <>
          <ThemedView style={styles.mapContainer}>
            <MapView style={styles.map} ref={mapRef}>
              {userLocation && (
                <Circle
                  center={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                  radius={30}
                  fillColor="rgba(0, 122, 255, 0.3)"
                  strokeColor="rgba(0, 122, 255, 0.5)"
                />
              )}
              {nonprofitMarkers.map((marker, idx) => (
                <Marker
                  key={idx}
                  coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                  title={marker.name}
                  onPress={() => handleMarkerPress(marker.id, marker.name)}
                  pinColor="orange"
                />
              ))}
            </MapView>
            {selectedNonprofitId && nonprofitNeeds.length > 0 && (
              <ThemedView style={{ marginTop: 20 }}>
                <ThemedText type="subtitle">
                  {selectedNonprofitName}'s Needs
                </ThemedText>
                <View style={{ backgroundColor: 'white', padding: 10, borderRadius: 8 }}>
                  <Table>
                    <Row
                      data={['Item ID', 'Quantity', 'Urgency']}
                      style={{ height: 40 }}
                      textStyle={tableStyles.headerText}
                    />
                    <Rows
                      data={nonprofitNeeds.map((need) => [
                        need.itemName,
                        need.quantity,
                        need.urgency,
                      ])}
                    />
                  </Table>
                </View>
              </ThemedView>
            )}
          </ThemedView>
        </>
      )}

      {viewMode === 'list' && (
        <ThemedView style={{ paddingHorizontal: 16, marginTop: 20 }}>
          {nonprofitMarkers
            .filter(marker => {
              if (!filterMatches || !user?.id) return true;
              return true;
            })
            .map((marker, idx) => (
              <View key={idx} style={{ marginBottom: 10, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                <ThemedText
                  type="subtitle"
                  onPress={async () => {
                    if (expandedIndex === idx) {
                      setExpandedIndex(null);
                    } else {
                      try {
                        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/nonprofit/needs/${marker.id}`);
                        console.log(`${process.env.EXPO_PUBLIC_API_URL}/api/nonprofit/needs/${marker.id}`);
                        const data = await res.json();
                        setNonprofitNeeds(data || []);
                        setExpandedIndex(idx);
                      } catch (error) {
                        console.error('Failed to fetch needs:', error);
                      }
                    }
                  }}
                >
                  {`${idx + 1}. ${marker.name}`}
                </ThemedText>

                {expandedIndex === idx && nonprofitNeeds.length > 0 && (
                  <View style={{ backgroundColor: 'white', padding: 10, marginTop: 10, borderRadius: 8 }}>
                    <Table>
                      <Row
                        data={['Item', 'Quantity', 'Urgency']}
                        style={{ height: 40 }}
                        textStyle={tableStyles.headerText}
                      />
                      <Rows
                        data={nonprofitNeeds.map((need) => [
                          need.itemName,
                          need.quantity,
                          need.urgency,
                        ])}
                      />
                    </Table>
                  </View>
                )}
              </View>
            ))}
        </ThemedView>
      )}

      <ThemedView style={{ paddingHorizontal: 16, marginTop: 20, marginBottom: 40 }}>
        <Button
          title={filterMatches ? 'Show All Nonprofits' : 'Show Matching Needs Only'}
          onPress={() => setFilterMatches(prev => !prev)}
        />
      </ThemedView>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 100,
    paddingHorizontal: 16,
  },
  mapContainer: {
    width: '90%',
    aspectRatio: 1,
    alignSelf: 'center',
    marginVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});