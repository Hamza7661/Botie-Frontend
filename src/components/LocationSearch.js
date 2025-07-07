import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { TextInput } from 'react-native-paper';
import * as Location from 'expo-location';
import GooglePlacesWeb from './GooglePlacesWeb';
import GooglePlacesNative from './GooglePlacesNative';
import { isGooglePlacesAvailable, GOOGLE_PLACES_API_KEY, logGooglePlacesStatus, validateGoogleApiKey, getGooglePlacesConfig, getUserCountryFromCoordinates } from '../config/google';

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 400;

export default function LocationSearch({ 
  onLocationSelect, 
  placeholder = "Search for a location...", 
  initialValue, 
  initialCoordinates,
  useGooglePlaces = true, // New prop to control which API to use
  googleApiKey = null // New prop for Google API key
}) {
  const initialSelectedLocation = (initialValue && initialCoordinates)
    ? {
        latitude: initialCoordinates.latitude,
        longitude: initialCoordinates.longitude,
        name: initialValue,
        type: 'saved',
        distance: null
      }
    : null;
  const [query, setQuery] = useState(initialValue || '');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(initialSelectedLocation);
  const [useGoogle, setUseGoogle] = useState(useGooglePlaces && googleApiKey);
  const [userCountry, setUserCountry] = useState(null);
  const hasInitializedWithInitialValue = useRef(!!(initialValue && initialCoordinates));

  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);



  // On mount, if initialValue and initialCoordinates are present, set selectedLocation and call onLocationSelect
  useEffect(() => {
    if (initialValue && initialCoordinates) {
      setSelectedLocation({
        latitude: initialCoordinates.latitude,
        longitude: initialCoordinates.longitude,
        name: initialValue,
        type: 'saved',
        distance: null
      });
      onLocationSelect({
        latitude: initialCoordinates.latitude,
        longitude: initialCoordinates.longitude,
        address: initialValue,
        locationName: extractLocationName(initialValue)
      });
    } else if (!initialValue && !initialCoordinates) {
      // If both are null/undefined, clear the selection
      setSelectedLocation(null);
      setQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue, initialCoordinates]);

  // Ensure query updates if initialValue changes (e.g., when editing)
  useEffect(() => {
    if (initialValue && initialValue !== query) {
      setQuery(initialValue);
    }
  }, [initialValue]);



  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(coords);
        
        // Get user's country from coordinates
        try {
          const country = await getUserCountryFromCoordinates(coords.latitude, coords.longitude);
          if (country && typeof country === 'string') {
            setUserCountry(country);
          }
        } catch (error) {
          console.error('Error getting user country:', error);
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };



  const handleLocationSelect = (location) => {
    // Return both coordinates and address information
    onLocationSelect({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.name, // Full address from search result
      locationName: extractLocationName(location.name) // Extract a shorter location name
    });
    setQuery(location.name);
    setSelectedLocation(location);
  };



  // Extract a shorter, more readable location name from the full address
  const extractLocationName = (fullAddress) => {
    if (!fullAddress) return '';
    
    // Split the address by commas
    const parts = fullAddress.split(',');
    
    // Take the first 2-3 parts for a shorter name
    // This usually gives us the most relevant part (e.g., "UMT University, Lahore")
    const relevantParts = parts.slice(0, Math.min(3, parts.length));
    
    return relevantParts.join(', ').trim();
  };

  const handleInputChange = (text) => {
    setQuery(text);
    // Clear selected location when user starts typing
    if (selectedLocation) {
      setSelectedLocation(null);
    }
    // If the field is cleared, signal no location selected
    if (!text.trim()) {
      onLocationSelect(null);
    }
  };

  // Use Google Places API - different implementation for web and mobile
  if (useGoogle && googleApiKey && googleApiKey.trim() !== '') {
    if (Platform.OS === 'web') {
      return (
        <GooglePlacesWeb
          onLocationSelect={handleLocationSelect}
          placeholder={placeholder}
          googleApiKey={googleApiKey}
        />
      );
    } else {
      return (
        <GooglePlacesNative
          onLocationSelect={handleLocationSelect}
            placeholder={placeholder}
          googleApiKey={googleApiKey}
          />
      );
    }
  }

  // Show message if Google API key is not available
  const validation = validateGoogleApiKey();
  let message = "Google Places API key required";
  let errorMessage = validation.error || "Please set EXPO_PUBLIC_GOOGLE_API_KEY environment variable to enable location search";
  
  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        label={placeholder}
        value={message}
        style={[styles.paperInput, { backgroundColor: '#f8f9fa' }]}
        theme={{ colors: { primary: '#999', background: '#f8f9fa', placeholder: '#999' } }}
        left={<TextInput.Icon icon="map-marker" />}
        editable={false}
      />
      <Text style={styles.errorText}>
        {errorMessage}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  paperInput: {
    height: 50,
    fontSize: isSmallScreen ? 14 : 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 4,
  },
}); 