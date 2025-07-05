import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, FlatList, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import * as Location from 'expo-location';

export default function LocationSearch({ onLocationSelect, placeholder = "Search for a location...", initialValue, initialCoordinates }) {
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
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(initialSelectedLocation);
  const [dirty, setDirty] = useState(false);
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

  // Only run search effect if dirty is true and selectedLocation is not set
  useEffect(() => {
    if (!dirty || selectedLocation) {
      return;
    }
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        searchLocations(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [query, currentLocation, selectedLocation, dirty]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const searchLocations = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Build search URL with stronger location bias
      let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10`;
      
      // Add location bias if we have current location
      if (currentLocation) {
        // Reduce radius to 25km for more local results
        searchUrl += `&lat=${currentLocation.latitude}&lon=${currentLocation.longitude}&radius=25000`;
      }
      
      // Add country bias for Pakistan
      searchUrl += '&countrycodes=pk';
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      const formattedResults = data.map(item => ({
        id: item.place_id,
        name: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        type: item.type,
        distance: currentLocation ? calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          parseFloat(item.lat),
          parseFloat(item.lon)
        ) : null
      }));
      
      // Sort by distance if we have current location
      if (currentLocation) {
        formattedResults.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
      
      // Filter out results that are too far (more than 50km)
      const filteredResults = currentLocation 
        ? formattedResults.filter(item => !item.distance || item.distance <= 50)
        : formattedResults;
      
      setResults(filteredResults.slice(0, 5)); // Show only top 5 results
      setShowResults(true);
    } catch (error) {
      console.error('Error searching locations:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate distance between two points in kilometers
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleLocationSelect = (location) => {
    console.log('LocationSearch handleLocationSelect - called with:', location);
    // Return both coordinates and address information
    onLocationSelect({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.name, // Full address from search result
      locationName: extractLocationName(location.name) // Extract a shorter location name
    });
    setQuery(location.name);
    setSelectedLocation(location);
    setShowResults(false);
    setResults([]); // Clear results
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

  const handleInputFocus = () => {
    // Don't show results if a location is already selected
    if (selectedLocation) {
      return;
    }
    
    // Only show results if there's a query
    if (query.trim()) {
      setShowResults(true);
    }
  };

  const handleInputChange = (text) => {
    setQuery(text);
    setDirty(true);
    // Clear selected location when user starts typing
    if (selectedLocation) {
      setSelectedLocation(null);
    }
    // If the field is cleared, signal no location selected
    if (!text.trim()) {
      console.log('LocationSearch - calling onLocationSelect(null) because field is cleared');
      onLocationSelect(null);
    }
  };

  const renderResultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleLocationSelect(item)}
    >
      <Text style={styles.resultName} numberOfLines={2}>
        {item.name}
      </Text>
      <View style={styles.resultMeta}>
        <Text style={styles.resultType}>
          {item.type}
        </Text>
        {item.distance ? (
          <Text style={styles.resultDistance}>
            {item.distance < 1 
              ? `${Math.round(item.distance * 1000)}m away`
              : `${item.distance.toFixed(1)}km away`
            }
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          mode="outlined"
          label={placeholder}
          value={query}
          onChangeText={handleInputChange}
          onFocus={handleInputFocus}
          style={styles.paperInput}
          theme={{ colors: { primary: '#007bff', background: '#fff', placeholder: '#999' } }}
          left={<TextInput.Icon icon="map-marker" />}
        />
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}
      </View>
      
      {showResults && results.length > 0 && !selectedLocation && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            renderItem={renderResultItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
      
      {showResults && results.length === 0 && query.trim() && !isLoading && !selectedLocation && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>No locations found nearby</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    position: 'relative',
  },
  paperInput: {
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
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  resultDistance: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
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