import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import LocationSearch from './LocationSearch';
import * as Location from 'expo-location';
import { isGooglePlacesAvailable, GOOGLE_PLACES_API_KEY } from '../config/google';

export default function MapPicker({ value, onChange }) {
  const defaultLat = 31.5204, defaultLng = 74.3587;
  const [region, setRegion] = useState({
    latitude: value?.latitude || defaultLat,
    longitude: value?.longitude || defaultLng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [marker, setMarker] = useState(value || {
    latitude: defaultLat,
    longitude: defaultLng,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const mapRef = useRef(null);
  
  // Store initial coordinates in a ref to prevent circular dependency
  const initialCoordinatesRef = useRef(value ? { latitude: value.latitude, longitude: value.longitude } : null);

  // Get current location on component mount if no value is provided
  useEffect(() => {
    const getCurrentLocation = async () => {
      // Only get current location if no specific location is already selected
      if (!value && !isInitialized) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            
            const currentLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            
            const newRegion = {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            
            setRegion(newRegion);
            setMarker(currentLocation);
            setIsInitialized(true);
            
            // Trigger the onChange callback to update the parent component
            onChange && onChange(currentLocation);
          }
        } catch (error) {
          console.error('Error getting current location:', error);
          setIsInitialized(true);
        }
      } else {
        setIsInitialized(true);
      }
      
      // Render the map after location is determined
      setShouldRenderMap(true);
    };

    getCurrentLocation();
  }, [value, isInitialized, onChange]);

  useEffect(() => {
    if (value) {
      setMarker(value);
      // Update region to center on the value
      setRegion({
        latitude: value.latitude,
        longitude: value.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [value]);

  const handleLocationSelect = (location) => {
    if (location) {
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setMarker(location);
      // Pass the full location object including address information
      onChange && onChange(location);
      
      // Animate to the selected location
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } else {
      // Clear coordinates when location is null
      onChange && onChange(null);
    }
  };

  const handleMyLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        const newRegion = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        setRegion(newRegion);
        setMarker(currentLocation);
        onChange && onChange(currentLocation);
        
        // Animate to current location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Don't render map until we have determined the initial location
  if (!shouldRenderMap) {
    return (
      <View style={{ width: '100%' }}>
        <View style={{ marginBottom: 15 }}>
          <LocationSearch 
            onLocationSelect={handleLocationSelect}
            placeholder="Search for a location..."
            useGooglePlaces={isGooglePlacesAvailable()}
            googleApiKey={GOOGLE_PLACES_API_KEY}
          />
        </View>
        <View style={{ height: 300, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading map...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ width: '100%' }}>
      <View style={{ marginBottom: 15 }}>
        <LocationSearch 
          onLocationSelect={handleLocationSelect}
          placeholder="Search for a location..."
          useGooglePlaces={isGooglePlacesAvailable()}
          googleApiKey={GOOGLE_PLACES_API_KEY}
        />
      </View>
      <View style={{ height: 300, width: '100%', position: 'relative' }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          region={region}
          onPress={e => {
            const coord = e.nativeEvent.coordinate;
            setMarker(coord);
            onChange && onChange(coord);
          }}
        >
          <Marker coordinate={marker} draggable onDragEnd={e => {
            const coord = e.nativeEvent.coordinate;
            setMarker(coord);
            onChange && onChange(coord);
          }} />
        </MapView>
        
        {/* My Location Button */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={handleMyLocation}
          activeOpacity={0.8}
        >
          <Text style={styles.myLocationIcon}>
            {isLoadingLocation ? '⏳' : '📍'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  myLocationButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  myLocationIcon: {
    fontSize: 20,
  },
}); 