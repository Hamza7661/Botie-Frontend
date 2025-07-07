import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import LocationSearch from './LocationSearch';
import * as Location from 'expo-location';
import { isGooglePlacesAvailable, GOOGLE_PLACES_API_KEY } from '../config/google';

// MapController to force map to center on marker
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

export default function MapPicker({ value, onChange, readOnly, initialLocationName }) {
  const defaultLat = 31.5204, defaultLng = 74.3587;
  const isEditMode = value && value.latitude && value.longitude;
  // Only use state for add mode
  const [position, setPosition] = useState([defaultLat, defaultLng]);
  const [mapCenter, setMapCenter] = useState([defaultLat, defaultLng]);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  
  // Store initial coordinates in a ref to prevent circular dependency
  const initialCoordinatesRef = useRef(value ? { latitude: value.latitude, longitude: value.longitude } : null);

  // Add mode: get current location
  useEffect(() => {
    if (!isEditMode) {
      const getCurrentLocation = async () => {
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
            const newPosition = [currentLocation.latitude, currentLocation.longitude];
            setPosition(newPosition);
            setMapCenter(newPosition);
            setShouldRenderMap(true);
            onChange && onChange(currentLocation);
          }
        } catch (error) {
          console.error('Error getting current location:', error);
          setShouldRenderMap(true);
        }
      };
      getCurrentLocation();
    } else {
      setShouldRenderMap(true);
    }
  }, [isEditMode]);

  // In the render, always use value for marker and center in edit mode
  const markerPosition = isEditMode ? [value.latitude, value.longitude] : position;
  const mapCenterToUse = isEditMode ? [value.latitude, value.longitude] : mapCenter;

  if (!shouldRenderMap) {
    return (
      <div style={{ width: '100%' }}>
        {!readOnly && (
          <div style={{ marginBottom: 15 }}>
            <LocationSearch 
              onLocationSelect={location => {
                if (location) {
                  setPosition([location.latitude, location.longitude]);
                  setMapCenter([location.latitude, location.longitude]);
                  onChange && onChange(location);
                } else {
                  // Clear coordinates when location is null
                  onChange && onChange(null);
                }
              }}
              placeholder="Search for a location..."
              initialValue={initialLocationName}
              initialCoordinates={initialCoordinatesRef.current}
              useGooglePlaces={isGooglePlacesAvailable()}
              googleApiKey={GOOGLE_PLACES_API_KEY}
            />
          </div>
        )}
        <div style={{ height: 300, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {!readOnly && (
        <div style={{ marginBottom: 15 }}>
          <LocationSearch 
            onLocationSelect={location => {
              if (location) {
                setPosition([location.latitude, location.longitude]);
                setMapCenter([location.latitude, location.longitude]);
                onChange && onChange(location);
              } else {
                // Clear coordinates when location is null
                onChange && onChange(null);
              }
            }}
            placeholder="Search for a location..."
            initialValue={initialLocationName}
            initialCoordinates={initialCoordinatesRef.current}
            useGooglePlaces={isGooglePlacesAvailable()}
            googleApiKey={GOOGLE_PLACES_API_KEY}
          />
        </div>
      )}
      <div style={{ height: 300, width: '100%', position: 'relative' }}>
        <MapContainer center={mapCenterToUse} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={markerPosition} />
          <MapController center={mapCenterToUse} />
        </MapContainer>
      </div>
    </div>
  );
} 