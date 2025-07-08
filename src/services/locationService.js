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
      console.log('Location tracking already active');
      return;
    }

    // Check if user has disabled tracking
    const userDisabled = await this.isUserTrackingDisabled();
    if (userDisabled) {
      console.log('Location tracking disabled by user');
      return;
    }

    try {
      console.log('Starting location tracking...');
      
      // Request location permissions
      const permission = await this.requestLocationPermission();
      if (permission !== 'granted') {
        throw new Error('Location permission denied');
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
      console.error('Error starting location tracking:', error);
      // Don't throw error to prevent app crash, just log it
      // showToast.error('Failed to start location tracking. Please check your location permissions.');
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
    
    console.log('Location tracking stopped');
  }

  /**
   * Request location permissions
   */
  async requestLocationPermission() {
    try {
      if (Platform.OS === 'web') {
        // Web implementation
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          this.permissionStatus = result.state;
          return result.state;
        }
        return 'granted';
      } else {
        // React Native implementation
        const { status } = await Location.requestForegroundPermissionsAsync();
        this.permissionStatus = status;
        return status;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
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
      // Silently handle iOS permission errors
      if (Platform.OS === 'ios' && error.message && error.message.includes('NSLocation*UsageDescription')) {
        return 'denied';
      }
      
      // Only log non-iOS errors
      if (Platform.OS !== 'ios') {
        console.error('Error requesting background location permission:', error);
      }
      
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
      console.error('Error checking location permission:', error);
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
      console.error('Error checking background location permission:', error);
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
      console.error('Error checking user tracking preference:', error);
      return false;
    }
  }

  /**
   * Enable location tracking (user preference)
   */
  async enableUserTracking() {
    try {
      await AsyncStorage.removeItem('userLocationTrackingDisabled');
      console.log('User enabled location tracking');
      
      // If we're not currently tracking, start tracking
      if (!this.isTracking) {
        await this.startLocationTracking();
      }
      
      return true;
    } catch (error) {
      console.error('Error enabling user tracking:', error);
      return false;
    }
  }

  /**
   * Disable location tracking (user preference)
   */
  async disableUserTracking() {
    try {
      await AsyncStorage.setItem('userLocationTrackingDisabled', 'true');
      console.log('User disabled location tracking');
      
      // Stop current tracking
      this.stopLocationTracking();
      
      return true;
    } catch (error) {
      console.error('Error disabling user tracking:', error);
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
      console.error('Error getting user tracking preference:', error);
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
        console.log('Resuming previous location tracking session');
        await this.startLocationTracking();
      }
    } catch (error) {
      console.error('Error initializing location service:', error);
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
      console.error('Error checking if should track on resume:', error);
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
      console.error('Error updating location:', error);
    }
  }

  /**
   * Get current position
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'web') {
        // Web implementation
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
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
            console.log('Background location update:', location.coords);
            await this.sendLocationToBackend(location.coords.latitude, location.coords.longitude);
          } catch (error) {
            console.error('Error in background location callback:', error);
          }
        }
      );

      // Note: Background fetch is deprecated, using background location tracking instead
      console.log('Background location tracking started (background fetch disabled)');

      console.log('Background location tracking started');
    } catch (error) {
      console.error('Error starting background location tracking:', error);
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
        console.log('No auth token available, skipping location update');
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
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to send location update:', response.status, errorData);
        
        // If unauthorized, stop tracking
        if (response.status === 401) {
          console.log('Unauthorized, stopping location tracking');
          this.stopLocationTracking();
        }
      }
    } catch (error) {
      console.error('Error sending location update:', error);
    }
  }

  /**
   * Get authentication token
   */
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting auth token:', error);
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
        console.log('Resuming location tracking...');
        await this.startLocationTracking();
      }
    } catch (error) {
      console.error('Error resuming location tracking:', error);
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
      
      console.log(`Location tracking interval updated to ${newInterval}ms`);
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