import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { authAPI } from '../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await authAPI.forgotPassword(email);
      setMessage(response.data.message || 'If a user with that email exists, a password reset link has been sent.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              theme={{
                colors: {
                  primary: '#007bff',
                  background: '#ffffff',
                  placeholder: '#666666',
                },
              }}
            />

            {message ? (
              <Text style={[
                styles.message,
                message.includes('Failed') ? styles.errorMessage : styles.successMessage
              ]}>
                {message}
              </Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleForgotPassword}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Send Reset Email
            </Button>
          </View>

          {/* Back to Login */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
    maxWidth: 350,
  },
  input: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
  },
  button: {
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 30,
  },
  backButtonText: {
    color: '#007bff',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
    lineHeight: 20,
    fontWeight: 'bold',
  },
  successMessage: {
    color: '#22c55e',
  },
  errorMessage: {
    color: '#e53e3e',
  },
});

export default ForgotPasswordScreen; 