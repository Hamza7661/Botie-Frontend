import Toast, { BaseToast } from 'react-native-toast-message';
import React from 'react';

// Custom toast config to increase description font size
export const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#22c55e' }}
      text1Style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: '#222',
        includeFontPadding: false,
        textAlignVertical: 'center',
        lineHeight: 26,
      }}
      text2Style={{
        fontSize: 18,
        color: '#333',
        includeFontPadding: false,
        textAlignVertical: 'center',
        lineHeight: 24,
      }}
      numberOfLines={2}
    />
  ),
  error: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#ef4444' }}
      text1Style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: '#222',
        includeFontPadding: false,
        textAlignVertical: 'center',
        lineHeight: 26,
      }}
      text2Style={{
        fontSize: 18,
        color: '#333',
        includeFontPadding: false,
        textAlignVertical: 'center',
        lineHeight: 24,
      }}
      numberOfLines={2}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#3b82f6' }}
      text1Style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: '#222',
        includeFontPadding: false,
        textAlignVertical: 'center',
        lineHeight: 26,
      }}
      text2Style={{
        fontSize: 18,
        color: '#333',
        includeFontPadding: false,
        textAlignVertical: 'center',
        lineHeight: 24,
      }}
      numberOfLines={2}
    />
  ),
  warning: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#f59e42' }}
      text1Style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: '#222',
        includeFontPadding: false,
        textAlignVertical: 'center',
        lineHeight: 26,
      }}
      text2Style={{
        fontSize: 18,
        color: '#333',
        includeFontPadding: false,
        textAlignVertical: 'center',
        lineHeight: 24,
      }}
      numberOfLines={2}
    />
  ),
};

export const showToast = {
  success: (response, title = 'Success') => {
    const message = String(response?.message || response || 'Success');
    Toast.show({
      type: 'success',
      text1: String(title),
      text2: String(message),
      position: 'top',
      topOffset: 50,
      visibilityTime: 3000,
    });
  },

  error: (response, title = 'Error') => {
    const message = String(response?.message || response || 'Error');
    Toast.show({
      type: 'error',
      text1: String(title),
      text2: String(message),
      position: 'top',
      topOffset: 50,
      visibilityTime: 4000,
    });
  },

  info: (response, title = 'Info') => {
    const message = String(response?.message || response || 'Info');
    Toast.show({
      type: 'info',
      text1: String(title),
      text2: String(message),
      position: 'top',
      topOffset: 50,
      visibilityTime: 3000,
    });
  },

  warning: (response, title = 'Warning') => {
    const message = String(response?.message || response || 'Warning');
    Toast.show({
      type: 'error',
      text1: String(title),
      text2: String(message),
      position: 'top',
      topOffset: 50,
      visibilityTime: 4000,
    });
  },
}; 