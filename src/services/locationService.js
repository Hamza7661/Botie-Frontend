import * as Location from 'expo-location';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import { showToast } from '../utils/toast';

// Background task name
const LOCATION_TASK_NAME = 'background-location-task';

// Register background task
TaskManager.defineTask(LOCATION_TASK_NAME, async () => {
  try {
    const locationService = new LocationService();
    await locationService.updateLocation();
    return { success: true };
  } catch (error) {
    console.error('Background location task failed:', error);
    return { success: false };
  }
});

class LocationService {
  constructor() {
    this.locationUpdateInterval = null;
    this.isTracking = false;
    this.backgroundLocationSubscription = null;
    this.baseURL = Constants.expoConfig.extra.apiBaseUrl;
    this.updateInterval = 10000; // 10 seconds
    this.lastLocation = null;
    this.permissionStatus = null;
  }

  /**
   * Start location tracking and send periodic updates to backend
   */
  async startLocationTracking() {
    if (this.isTracking) {
      return;
    }

    // Check if user has disabled tracking
    const userDisabled = await this.isUserTrackingDisabled();
    if (userDisabled) {
      return;
    }

    try {
      // Request location permissions
      const permission = await this.requestLocationPermission();
      if (permission !== 'granted') {
        return; // Don't throw error, just return gracefully
      }

      // Request background location permissions for mobile
      if (Platform.OS !== 'web') {
        const backgroundPermission = await this.requestBackgroundLocationPermission();
        if (backgroundPermission !== 'granted') {
          // Silently handle - no console logs for iOS Expo Go
          const isExpoGo = Constants.appOwnership === 'expo';
          const isIOS = Platform.OS === 'ios';
          
          if (!(isExpoGo && isIOS)) {
            console.log('Background location permission not granted, using foreground tracking only');
          }
        }
      }

      // Get initial location
      await this.updateLocation();

      // Start foreground tracking (when app is active)
      this.locationUpdateInterval = setInterval(async () => {
        await this.updateLocation();
      }, this.updateInterval);

      // Start background location tracking for mobile
      if (Platform.OS !== 'web') {
        await this.startBackgroundLocationTracking();
      }

      this.isTracking = true;
      
      // Store tracking state
      await AsyncStorage.setItem('locationTrackingActive', 'true');
      
    } catch (error) {
      // Silently handle any errors
    }
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking() {
    // Stop foreground tracking
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }

    // Stop background location tracking
    if (this.backgroundLocationSubscription) {
      this.backgroundLocationSubscription.remove();
      this.backgroundLocationSubscription = null;
    }

    // Note: Background fetch is deprecated, using background location tracking instead

    this.isTracking = false;
    this.lastLocation = null;
    
    // Remove tracking state
    AsyncStorage.removeItem('locationTrackingActive');
  }

  /**
   * Request location permissions
   */
  async requestLocationPermission() {
    try {
      if (Platform.OS === 'web') {
        // Web implementation - try to get current position directly first
        // This should trigger the permission dialog on Safari iOS
        try {
          await this.getCurrentPosition();
          return 'granted';
        } catch (positionError) {
          // If getCurrentPosition fails, try the permissions API as fallback
          if ('permissions' in navigator) {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            this.permissionStatus = result.state;
            return result.state;
          }
          return 'denied';
        }
      } else {
        // React Native implementation
        const { status } = await Location.requestForegroundPermissionsAsync();
        this.permissionStatus = status;
        return status;
      }
    } catch (error) {
      return 'denied';
    }
  }

  /**
   * Request background location permissions (mobile only)
   */
  async requestBackgroundLocationPermission() {
    try {
      if (Platform.OS === 'web') {
        return 'granted'; // Not applicable on web
      } else {
        // Check if we're on iOS with Expo Go (which doesn't support custom permissions)
        const isExpoGo = Constants.appOwnership === 'expo';
        const isIOS = Platform.OS === 'ios';
        
        if (isExpoGo && isIOS) {
          // Silently handle iOS Expo Go limitation
          return 'denied';
        }
        
        const { status } = await Location.requestBackgroundPermissionsAsync();
        return status;
      }
    } catch (error) {
      return 'denied';
    }
  }

  /**
   * Check if location permission is granted
   */
  async checkLocationPermission() {
    try {
      if (Platform.OS === 'web') {
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          return result.state === 'granted';
        }
        return true;
      } else {
        const { status } = await Location.getForegroundPermissionsAsync();
        return status === 'granted';
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if background location permission is granted (mobile only)
   */
  async checkBackgroundLocationPermission() {
    try {
      if (Platform.OS === 'web') {
        return false; // Not applicable on web
      } else {
        const { status } = await Location.getBackgroundPermissionsAsync();
        return status === 'granted';
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get comprehensive permission status
   */
  async getPermissionStatus() {
    const foreground = await this.checkLocationPermission();
    const background = Platform.OS === 'web' ? false : await this.checkBackgroundLocationPermission();
    
    return {
      foreground,
      background,
      canTrackInBackground: foreground && background,
      canTrackInForeground: foreground
    };
  }

  /**
   * Check if user has disabled location tracking
   */
  async isUserTrackingDisabled() {
    try {
      const disabled = await AsyncStorage.getItem('userLocationTrackingDisabled');
      return disabled === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Enable location tracking (user preference)
   */
  async enableUserTracking() {
    try {
      await AsyncStorage.removeItem('userLocationTrackingDisabled');
      
      // If we're not currently tracking, start tracking
      if (!this.isTracking) {
        // On web, request permission when user tries to enable tracking
        if (Platform.OS === 'web') {
          const permission = await this.requestLocationPermission();
          if (permission !== 'granted') {
            return false; // Permission denied
          }
        }
        await this.startLocationTracking();
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Disable location tracking (user preference)
   */
  async disableUserTracking() {
    try {
      await AsyncStorage.setItem('userLocationTrackingDisabled', 'true');
      
      // Stop current tracking
      this.stopLocationTracking();
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user tracking preference
   */
  async getUserTrackingPreference() {
    try {
      const disabled = await AsyncStorage.getItem('userLocationTrackingDisabled');
      return {
        enabled: disabled !== 'true',
        disabled: disabled === 'true'
      };
    } catch (error) {
      return { enabled: true, disabled: false };
    }
  }

  /**
   * Initialize location service
   */
  async initialize() {
    try {
      // Check if tracking was previously active
      const wasActive = await AsyncStorage.getItem('locationTrackingActive');
      const userDisabled = await this.isUserTrackingDisabled();
      
      if (wasActive === 'true' && !userDisabled) {
        await this.startLocationTracking();
      }
    } catch (error) {
      // Silently handle initialization errors
    }
  }

  /**
   * Check if tracking should be active (for app resume scenarios)
   */
  async shouldTrackOnResume() {
    try {
      const disabled = await AsyncStorage.getItem('userLocationTrackingDisabled');
      return disabled !== 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Update current location and send to backend
   */
  async updateLocation() {
    try {
      const position = await this.getCurrentPosition();
      
      // Check if location has changed significantly (optional optimization)
      if (this.hasLocationChangedSignificantly(position)) {
        this.lastLocation = position;
        await this.sendLocationToBackend(position.coords.latitude, position.coords.longitude);
      }
    } catch (error) {
      // Silently handle location update errors
    }
  }

  /**
   * Get current position
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'web') {
        // Web implementation
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser'));
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
          }
        );
      } else {
        // React Native implementation
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
          maximumAge: 30000
        })
        .then(resolve)
        .catch(reject);
      }
    });
  }

  /**
   * Start background location tracking (mobile only)
   */
  async startBackgroundLocationTracking() {
    try {
      if (Platform.OS === 'web') {
        return; // Not applicable on web
      }

      // Check if background location is enabled
      const backgroundPermission = await Location.getBackgroundPermissionsAsync();
      if (backgroundPermission.status !== 'granted') {
        return;
      }

      // Start background location updates
      this.backgroundLocationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: this.updateInterval,
          distanceInterval: 10, // Update every 10 meters
          foregroundService: {
            notificationTitle: 'Location Tracking',
            notificationBody: 'Tracking your location for reminders',
            notificationColor: '#007bff',
          },
          // Background location settings
          activityType: Location.ActivityType.AutomotiveNavigation,
          showsBackgroundLocationIndicator: true,
        },
        async (location) => {
          // This callback runs in the background
          try {
            await this.sendLocationToBackend(location.coords.latitude, location.coords.longitude);
          } catch (error) {
            // Silently handle background callback errors
          }
        }
      );

      // Note: Background fetch is deprecated, using background location tracking instead
    } catch (error) {
      // Silently handle background tracking errors
    }
  }

  /**
   * Check if location has changed significantly (more than 10 meters)
   */
  hasLocationChangedSignificantly(newPosition) {
    if (!this.lastLocation) return true;
    
    const lat1 = this.lastLocation.coords.latitude;
    const lon1 = this.lastLocation.coords.longitude;
    const lat2 = newPosition.coords.latitude;
    const lon2 = newPosition.coords.longitude;
    
    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return distance > 10; // 10 meters threshold
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Send location update to backend
   */
  async sendLocationToBackend(latitude, longitude) {
    try {
      const authToken = await this.getAuthToken();
      if (!authToken) {
        return;
      }

      const response = await fetch(`${this.baseURL}/reminders/location-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          latitude, 
          longitude
        })
      });

      if (response.ok) {
        // Location update sent successfully
      } else {
        // If unauthorized, stop tracking
        if (response.status === 401) {
          this.stopLocationTracking();
        }
      }
    } catch (error) {
      // Silently handle location update errors
    }
  }

  /**
   * Get authentication token
   */
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current tracking status
   */
  isLocationTrackingActive() {
    return this.isTracking;
  }

  /**
   * Get last known location
   */
  getLastLocation() {
    return this.lastLocation;
  }

  /**
   * Resume tracking if it was active before
   */
  async resumeTrackingIfNeeded() {
    try {
      const wasTracking = await AsyncStorage.getItem('locationTrackingActive');
      if (wasTracking === 'true') {
        await this.startLocationTracking();
      }
    } catch (error) {
      // Silently handle resume errors
    }
  }

  /**
   * Update tracking interval (for testing or user preferences)
   */
  updateTrackingInterval(newInterval) {
    if (this.isTracking) {
      // Stop current interval
      if (this.locationUpdateInterval) {
        clearInterval(this.locationUpdateInterval);
      }
      
      // Start new interval
      this.updateInterval = newInterval;
      this.locationUpdateInterval = setInterval(async () => {
        await this.updateLocation();
      }, this.updateInterval);
    } else {
      this.updateInterval = newInterval;
    }
  }

  /**
   * Get tracking statistics
   */
  async getTrackingStats() {
    const permissionStatus = await this.getPermissionStatus();
    const userPreference = await this.getUserTrackingPreference();
    
    return {
      isTracking: this.isTracking,
      lastLocation: this.lastLocation,
      permissionStatus,
      updateInterval: this.updateInterval,
      hasBackgroundSubscription: !!this.backgroundLocationSubscription,
      platform: Platform.OS,
      userPreference
    };
  }
}

// Create singleton instance
const locationService = new LocationService();

export default locationService; 