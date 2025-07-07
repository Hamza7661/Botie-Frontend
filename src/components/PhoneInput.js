import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Pressable, Platform } from 'react-native';
import { countries } from '../utils/countries';
import MaskInput from 'react-native-mask-input';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { detectUserCountry } from '../utils/locationUtils';
import { GOOGLE_PLACES_API_KEY } from '../config/google';

// Only import createPortal on web
let createPortal = null;
if (Platform.OS === 'web') {
  // eslint-disable-next-line
  createPortal = require('react-dom').createPortal;
}

const countryMasks = {
  US: ['(', /\d/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/],
  CA: ['(', /\d/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/],
  GB: [/\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/],
  PK: [/\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/],
  IN: [/\d/, /\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, /\d/],
  AU: [/\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/],
  // Add more as needed
};

const defaultMask = [/\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];

// Helper to get raw phone number (digits only, with leading + if present)
export function getRawPhoneNumber(maskedValue) {
  if (!maskedValue) return '';
  // Remove all non-digit except leading +
  return maskedValue.replace(/(?!^)[^\d]/g, '');
}

// Helper to get full E.164 phone number for saving
export function getFullE164Phone(localValue, country) {
  if (!localValue || !country) return '';
  // Remove all non-digit characters
  const digits = localValue.replace(/\D/g, '');
  return country.dial_code + digits;
}

// Helper to validate phone number (E.164)
export function validatePhoneNumber(localValue, country) {
  if (!localValue || !country) return false;
  const e164 = getFullE164Phone(localValue, country);
  return isValidPhoneNumber(e164);
}

function getCountryByDialCode(phone) {
  if (!phone) return null;
  // Remove spaces/dashes for matching
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Try to match the longest dial code
  let match = null;
  for (const country of countries) {
    if (
      cleaned.startsWith(country.dial_code) &&
      (!match || country.dial_code.length > match.dial_code.length)
    ) {
      match = country;
    }
  }
  return match;
}

export default function PhoneInput({
  value,
  onChangeText,
  placeholder = 'Phone number',
  style,
  error,
  defaultCountry = 'US',
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find((c) => c.code === defaultCountry) || countries[0]
  );
  const [localValue, setLocalValue] = useState(value && value.startsWith('+') ? '' : value || '');
  const [isDetectingCountry, setIsDetectingCountry] = useState(false);
  const [hasAttemptedDetection, setHasAttemptedDetection] = useState(false);
  const buttonRef = useRef();
  const containerRef = useRef();
  const dropdownRef = useRef();
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 220 });

  // Detect user's country on component mount
  useEffect(() => {
    const detectCountry = async () => {
      // Only detect if we have a Google API key and haven't attempted detection yet
      if (GOOGLE_PLACES_API_KEY && !hasAttemptedDetection) {
        setHasAttemptedDetection(true);
        setIsDetectingCountry(true);
        try {
          const detectedCountry = await detectUserCountry(countries, GOOGLE_PLACES_API_KEY);
          if (detectedCountry) {
            setSelectedCountry(detectedCountry);
            // Notify parent of the country change
            if (onChangeText) onChangeText(localValue, detectedCountry);
          }
        } catch (error) {
          console.log('Error detecting country:', error);
          // Keep the default country if detection fails
        } finally {
          setIsDetectingCountry(false);
        }
      }
    };

    detectCountry();
  }, []); // Only run once on mount

  // Auto-select country and set local part when value changes (if dial code matches)
  useEffect(() => {
    if (value && value.startsWith('+')) {
      const match = getCountryByDialCode(value);
      if (match) {
        setSelectedCountry(match);
        // Remove dial code from value for local input
        const local = value.replace(match.dial_code, '');
        setLocalValue(local.replace(/\D/g, ''));
      }
    } else if (value !== localValue) {
      setLocalValue(value || '');
    }
    // eslint-disable-next-line
  }, [value]);

  // Calculate dropdown position for web portal
  useEffect(() => {
    if (Platform.OS === 'web' && showDropdown && buttonRef.current && containerRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: buttonRect.bottom - containerRect.top,
        left: buttonRect.left - containerRect.left,
        width: Math.max(buttonRect.width, 220),
      });
    }
  }, [showDropdown]);

  // Close dropdown on outside click (web only)
  useEffect(() => {
    function handleClick(e) {
      if (
        showDropdown &&
        Platform.OS === 'web' &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown && Platform.OS === 'web') {
      window.addEventListener('mousedown', handleClick);
      return () => window.removeEventListener('mousedown', handleClick);
    }
  }, [showDropdown]);

  const mask = countryMasks[selectedCountry.code] || defaultMask;

  // When user types, update localValue and propagate up
  const handleChange = (masked, raw) => {
    setLocalValue(masked);
    if (onChangeText) onChangeText(masked, selectedCountry);
  };

  // Handle country selection
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowDropdown(false);
    
    // Notify parent of the change
    if (onChangeText) onChangeText(localValue, country);
  };

  const dropdown = (
    <View
      ref={dropdownRef}
      style={
        Platform.OS === 'web'
          ? [
              styles.dropdownOverlay,
              {
                position: 'absolute',
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
                minWidth: 220,
              },
            ]
          : styles.dropdownOverlay
      }
    >
      <ScrollView style={styles.dropdownList}>
        {countries.map((country) => (
          <TouchableOpacity
            key={country.code}
            style={[
              styles.dropdownItem,
              selectedCountry.code === country.code && styles.selectedItem,
            ]}
            onPress={() => {
              handleCountrySelect(country);
            }}
          >
            <Text style={styles.dropdownFlag}>{country.flag}</Text>
            <View style={styles.dropdownCountryInfo}>
              <Text style={styles.dropdownCountryName}>{country.name}</Text>
              <Text style={styles.dropdownCountryDialCode}>{country.dial_code}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, style]} ref={containerRef}>
      <View style={styles.inputContainer}>
        <Pressable
          ref={buttonRef}
          style={styles.countryButton}
          onPress={() => setShowDropdown((v) => !v)}
          disabled={isDetectingCountry}
        >
          <Text style={styles.flag}>
            {isDetectingCountry ? '⏳' : selectedCountry.flag}
          </Text>
          <Text style={styles.countryCode}>
            {isDetectingCountry ? 'Detecting...' : selectedCountry.dial_code}
          </Text>
          <Text style={styles.dropdownArrow}>
            {isDetectingCountry ? '' : (showDropdown ? '▲' : '▼')}
          </Text>
        </Pressable>
        <MaskInput
          style={[styles.input, error && styles.inputError]}
          value={localValue}
          onChangeText={handleChange}
          mask={mask}
          keyboardType="phone-pad"
          placeholder={placeholder}
          placeholderTextColor="#ccc"
          placeholderFillCharacter={'_'}
          showObfuscatedValue={false}
        />
      </View>
      {showDropdown &&
        (Platform.OS === 'web' && createPortal
          ? createPortal(dropdown, containerRef.current)
          : dropdown)}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
    zIndex: 10,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    backgroundColor: '#f8f9fa',
    minWidth: 80,
  },
  flag: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 4,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#666',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 220,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  dropdownList: {
    paddingVertical: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedItem: {
    backgroundColor: '#f0f8ff',
  },
  dropdownFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  dropdownCountryInfo: {
    flex: 1,
  },
  dropdownCountryName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  dropdownCountryDialCode: {
    fontSize: 12,
    color: '#666',
  },
}); 