import React from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';

const Preloader = ({ visible }) => {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size={Platform.OS === 'web' ? 60 : 'large'} color="#007bff" />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
});

export default Preloader; 