import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { getUserCountryFromCoordinates } from '../config/google';

const GooglePlacesWeb = ({ onLocationSelect, placeholder, googleApiKey }) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userCountry, setUserCountry] = useState(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Load Google Places API script
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      placesService.current = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
    } else {
      loadGooglePlacesScript();
    }
    
    // Get user's country from browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const country = await getUserCountryFromCoordinates(
            position.coords.latitude,
            position.coords.longitude
          );
          setUserCountry(country);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const loadGooglePlacesScript = () => {
    if (document.getElementById('google-places-script')) return;

    const script = document.createElement('script');
    script.id = 'google-places-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      placesService.current = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
    };
    document.head.appendChild(script);
  };

  const searchPlaces = (searchQuery) => {
    if (!searchQuery.trim() || !autocompleteService.current) {
      setPredictions([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    
    const request = {
      input: searchQuery,
      types: ['establishment', 'geocode']
    };

    // Add country restriction if user country is available
    if (userCountry) {
      request.componentRestrictions = { country: userCountry };
    }

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      setIsLoading(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        setPredictions(predictions.slice(0, 5)); // Limit to 5 results
        setShowResults(true);
      } else {
        setPredictions([]);
        setShowResults(false);
      }
    });
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

  const handlePlaceSelect = (prediction) => {
    if (!placesService.current) return;

    const request = {
      placeId: prediction.place_id,
      fields: ['geometry', 'formatted_address', 'name']
    };

    placesService.current.getDetails(request, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const location = {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          name: place.formatted_address || prediction.description,
          type: 'google_place',
          distance: null
        };
        
        onLocationSelect(location);
        setQuery(place.formatted_address || prediction.description);
        setShowResults(false);
        setPredictions([]);
      }
    });
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
          {predictions.map((prediction, index) => (
            <View
              key={prediction.place_id || index}
              style={styles.resultItem}
              onClick={() => handlePlaceSelect(prediction)}
            >
              <Text style={styles.resultName} numberOfLines={2}>
                {prediction.description}
              </Text>
            </View>
          ))}
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
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    cursor: 'pointer',
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

export default GooglePlacesWeb; 