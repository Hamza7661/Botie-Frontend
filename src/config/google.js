// Google API Configuration
import Constants from 'expo-constants';

// Read API key from Expo environment variables
export const GOOGLE_PLACES_API_KEY = Constants.expoConfig?.extra?.googleApiKey || process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';

// Default Google Places API settings (without country restriction)
export const getGooglePlacesConfig = (userCountry = null) => {
  const config = {
    apiKey: GOOGLE_PLACES_API_KEY,
    language: 'en',
    types: 'establishment|geocode', // Include both places and addresses
  };

  // Add country restriction if user country is available
  if (userCountry) {
    config.components = `country:${userCountry.toLowerCase()}`;
  }

  return config;
};

// Function to get user's country from coordinates
export const getUserCountryFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'BotieApp/1.0 (contact@botie.com)'
        }
      }
    );
    const data = await response.json();
    return data.address?.country_code?.toLowerCase() || null;
  } catch (error) {
    console.error('Error getting user country:', error);
    return null;
  }
};

// Always use Google Places API if key is available
export const isGooglePlacesAvailable = () => {
  return GOOGLE_PLACES_API_KEY && 
         GOOGLE_PLACES_API_KEY.trim() !== '' && 
         GOOGLE_PLACES_API_KEY !== 'your_actual_google_api_key_here' &&
         GOOGLE_PLACES_API_KEY !== 'your_google_places_api_key_here';
};

// Log API key status for debugging (remove in production)
export const logGooglePlacesStatus = () => {
  const isAvailable = isGooglePlacesAvailable();
  console.log('🔍 Google Places API Status:');
  console.log('  - Available:', isAvailable);
  console.log('  - Key length:', GOOGLE_PLACES_API_KEY ? GOOGLE_PLACES_API_KEY.length : 0);
  console.log('  - Key starts with:', GOOGLE_PLACES_API_KEY ? GOOGLE_PLACES_API_KEY.substring(0, 10) + '...' : 'N/A');
  
  if (!isAvailable) {
    console.log('⚠️  Google Places API is not available. Please check:');
    console.log('  1. EXPO_PUBLIC_GOOGLE_API_KEY is set in your .env file');
    console.log('  2. The API key is valid and not a placeholder');
    console.log('  3. Places API is enabled in Google Cloud Console');
  }
  
  return isAvailable;
};

// Validate API key format (basic validation)
export const validateGoogleApiKey = () => {
  if (!GOOGLE_PLACES_API_KEY) {
    return { valid: false, error: 'API key is not set' };
  }
  
  if (GOOGLE_PLACES_API_KEY.includes('your_') || GOOGLE_PLACES_API_KEY.includes('placeholder')) {
    return { valid: false, error: 'API key appears to be a placeholder' };
  }
  
  if (GOOGLE_PLACES_API_KEY.length < 20) {
    return { valid: false, error: 'API key appears to be too short' };
  }
  
  return { valid: true, error: null };
}; 