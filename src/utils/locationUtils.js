import { Platform } from 'react-native';
import * as Location from 'expo-location';

// Default country if location detection fails
const DEFAULT_COUNTRY = { code: 'US', dial_code: '+1', flag: '🇺🇸', name: 'United States' };

/**
 * Get user's current location and detect their country
 * Works on both web and mobile using Expo Location API
 */
export const getUserLocation = async () => {
  try {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Location permission denied');
      return null;
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.log('Error getting location:', error);
    return null;
  }
};

/**
 * Get country from coordinates using Google Geocoding API
 */
export const getCountryFromCoordinates = async (latitude, longitude, googleApiKey) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      
      // Find the country component
      const countryComponent = result.address_components.find(
        component => component.types.includes('country')
      );
      
      if (countryComponent) {
        return {
          name: countryComponent.long_name,
          shortName: countryComponent.short_name,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.log('Error getting country from coordinates:', error);
    return null;
  }
};

/**
 * Find country object from countries array by country code or name
 */
export const findCountryByCodeOrName = (countryCode, countryName, countries) => {
  // First try to find by country code
  let country = countries.find(c => c.code === countryCode);
  
  if (!country && countryName) {
    // Try to find by country name
    country = countries.find(c => 
      c.name.toLowerCase() === countryName.toLowerCase() ||
      c.name.toLowerCase().includes(countryName.toLowerCase()) ||
      countryName.toLowerCase().includes(c.name.toLowerCase())
    );
  }
  
  return country || DEFAULT_COUNTRY;
};

/**
 * Detect user's country and return the corresponding country object
 */
export const detectUserCountry = async (countries, googleApiKey) => {
  try {
    // Get user's location
    const location = await getUserLocation();
    
    if (!location) {
      console.log('Could not get user location, using default country');
      return DEFAULT_COUNTRY;
    }

    // Get country from coordinates
    const countryInfo = await getCountryFromCoordinates(
      location.latitude, 
      location.longitude, 
      googleApiKey
    );
    
    if (!countryInfo) {
      console.log('Could not detect country from coordinates, using default country');
      return DEFAULT_COUNTRY;
    }

    // Find the country object from our countries array
    const detectedCountry = findCountryByCodeOrName(
      countryInfo.shortName, 
      countryInfo.name, 
      countries
    );

    console.log('Detected country:', detectedCountry);
    return detectedCountry;
    
  } catch (error) {
    console.log('Error detecting user country:', error);
    return DEFAULT_COUNTRY;
  }
};

/**
 * Get user's timezone to help with country detection (fallback method)
 */
export const getUserTimezone = () => {
  try {
    if (Platform.OS === 'web') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    // For mobile, we'll rely on location detection
    return null;
  } catch (error) {
    console.log('Error getting timezone:', error);
    return null;
  }
}; 