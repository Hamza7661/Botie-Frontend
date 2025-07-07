import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TextInput } from 'react-native-paper';
import { getUserCountryFromCoordinates } from '../config/google';
import * as Location from 'expo-location';

const GooglePlacesNative = ({ onLocationSelect, placeholder, googleApiKey }) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userCountry, setUserCountry] = useState(null);
  const timeoutRef = useRef(null);

  // Get user's country on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        // Get user's country from coordinates
        try {
          const country = await getUserCountryFromCoordinates(
            location.coords.latitude,
            location.coords.longitude
          );
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

  const searchPlaces = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setPredictions([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Build the Google Places API URL
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchQuery)}&key=${googleApiKey}&types=establishment|geocode`;
      
      // Add country restriction if available
      if (userCountry) {
        url += `&components=country:${userCountry}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        setPredictions(data.predictions.slice(0, 5)); // Limit to 5 results
        setShowResults(true);
      } else {
        setPredictions([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setPredictions([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (text) => {
    setQuery(text);
    setShowResults(false);
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce search
    timeoutRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 300);
  };

  const handlePlaceSelect = async (prediction) => {
    try {
      // Get place details
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,formatted_address,name&key=${googleApiKey}`;
      const response = await fetch(detailsUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const place = data.result;
        const location = {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          name: place.formatted_address || prediction.description,
          type: 'google_place',
          distance: null
        };
        
        onLocationSelect(location);
        setQuery(place.formatted_address || prediction.description);
        setShowResults(false);
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          mode="outlined"
          label={placeholder}
          value={query}
          onChangeText={handleInputChange}
          style={styles.input}
          theme={{ colors: { primary: '#007bff', background: '#fff', placeholder: '#999' } }}
          left={<TextInput.Icon icon="map-marker" />}
        />
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}
      </View>
      
      {showResults && predictions.length > 0 && (
        <View style={styles.resultsContainer}>
          <ScrollView style={styles.resultsList}>
            {predictions.map((prediction, index) => (
              <TouchableOpacity
                key={prediction.place_id || index}
                style={styles.resultItem}
                onPress={() => handlePlaceSelect(prediction)}
              >
                <Text style={styles.resultName} numberOfLines={2}>
                  {prediction.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {showResults && predictions.length === 0 && query.trim() && !isLoading && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>No locations found</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    position: 'relative',
  },
  input: {
    height: 50,
    fontSize: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 4,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
  },
  resultsContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 200,
  },
  resultsList: {
    borderRadius: 8,
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultName: {
    fontSize: 14,
    color: '#333',
  },
  noResults: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default GooglePlacesNative; 