import { StyleSheet, Image, Platform } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ExploreScreen() {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [nonprofitMarkers, setNonprofitMarkers] = useState<{ name: string, latitude: number, longitude: number }[]>([]);
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
        const res = await fetch('http://10.142.36.197:3000/api/nonprofit/addresses');
        const data: Record<string, string> = await res.json(); // data is { nonprofitId: address }
        console.log(data);
    
        const geocoded = await Promise.all(
          Object.entries(data).map(async ([nonprofitId, address]) => {
            const cleanedAddress = address
              .replace(/[’]/g, "'")
              .replace(/\s{2,}/g, ' ')
              .trim();
    
            const geoRes = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanedAddress + ', USA')}&key=AIzaSyCxiEwZYao45RGv-9Fs85jBdYxYWfvztFs`
            );
            const geoData = await geoRes.json();
            const loc = geoData.results[0]?.geometry.location;
            if (!loc) {
              console.warn('No geocode result for:', cleanedAddress);
              return null;
            }
    
            return {
              name: nonprofitId, // If you want to use the actual name, fetch that separately
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
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Explore</ThemedText>
      </ThemedView>

      {/* Map Section */}
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
              pinColor="orange"
            />
          ))}
        </MapView>
      </ThemedView>

      <ThemedText>This app includes example code to help you get started.</ThemedText>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  mapContainer: {
    height: 300,
    marginVertical: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});
