import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import Preloader from '../components/Preloader';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  
  // Error states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const { login, getPendingVerificationEmail, clearPendingVerification, resendVerification } = useAuth();
  const passwordRef = useRef(null);

  useEffect(() => {
    checkPendingVerification();
    
    // Check for verification message from navigation params
    if (route.params?.verificationMessage) {
      setVerificationMessage(route.params.verificationMessage);
      // Clear the params to avoid showing the message again
      navigation.setParams({ verificationMessage: undefined });
    }
  }, [route.params?.verificationMessage]);

  const checkPendingVerification = async () => {
    const pendingEmail = await getPendingVerificationEmail();
    if (pendingEmail) {
      setVerificationMessage(`Please check your email (${pendingEmail}) to verify your account before signing in.`);
      setEmail(pendingEmail);
      await clearPendingVerification();
    }

    // Check for verification message from registration
    try {
      const storedMessage = await AsyncStorage.getItem('verificationMessage');
      if (storedMessage) {
        setVerificationMessage(storedMessage);
        await AsyncStorage.removeItem('verificationMessage');
      }
    } catch (error) {
      console.error('Error checking verification message:', error);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      showToast.error('Please enter your email address first');
      return;
    }

    setLoading(true);
    try {
      const result = await resendVerification(email);
      if (result.success) {
        showToast.success(result.message);
      } else {
        showToast.error(result.error);
      }
    } catch (error) {
      showToast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    if (field === 'email') {
      setEmail(value);
    } else if (field === 'password') {
      setPassword(value);
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFieldBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleLogin = async () => {
    // Mark all fields as touched
    setTouched({ email: true, password: true });

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        if (result.requiresVerification) {
          setVerificationMessage(result.error);
        } else {
          showToast.error(result.error);
        }
      }
    } catch (error) {
      // Handle any unexpected errors that might occur outside of the login function
      showToast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInputTheme = (fieldName) => ({
    colors: {
      primary: errors[fieldName] ? '#e53e3e' : '#007bff',
      background: '#ffffff',
      placeholder: '#666666',
      error: '#e53e3e',
    },
  });

  return (
    <View style={styles.container}>
      <Preloader visible={loading} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            {/* Logo/Title Section */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo}>B</Text>
              </View>
              <Text style={styles.title}>Botie</Text>
              <Text style={styles.subtitle}>Welcome back!</Text>
              <Text style={styles.description}>
                Sign in to manage your appointments
              </Text>
            </View>

            {/* Login Form */}
            <View style={styles.form}>
              {verificationMessage ? (
                <View style={styles.verificationContainer}>
                  <Text style={styles.verificationMessage}>{verificationMessage}</Text>
                  <View style={styles.verificationButtons}>
                    <TouchableOpacity
                      onPress={handleResendVerification}
                      style={[styles.verificationButton, styles.resendButton]}
                      disabled={loading}
                    >
                      <Text style={styles.resendButtonText}>
                        {loading ? 'Sending...' : 'Resend Email'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setVerificationMessage('')}
                      style={[styles.verificationButton, styles.dismissButton]}
                    >
                      <Text style={styles.dismissText}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={(value) => handleFieldChange('email', value)}
                  onBlur={() => handleFieldBlur('email')}
                  onSubmitEditing={() => {
                    // Focus the password field when Enter is pressed on email
                    if (passwordRef.current) {
                      passwordRef.current.focus();
                    }
                  }}
                  returnKeyType="next"
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    errors.email && touched.email && styles.inputError
                  ]}
                  theme={getInputTheme('email')}
                  error={!!(errors.email && touched.email)}
                />
                {errors.email && touched.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  ref={passwordRef}
                  label="Password"
                  value={password}
                  onChangeText={(value) => handleFieldChange('password', value)}
                  onBlur={() => handleFieldBlur('password')}
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  style={[
                    styles.input,
                    errors.password && touched.password && styles.inputError
                  ]}
                  theme={getInputTheme('password')}
                  error={!!(errors.password && touched.password)}
                />
                {errors.password && touched.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
                labelStyle={styles.loginButtonLabel}
              >
                Sign In
              </Button>

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPassword}
              >
                <Text style={styles.forgotPasswordText}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Section */}
            <View style={styles.signupSection}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#666666',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 350,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  loginButtonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#007bff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  signupSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    color: '#666666',
    fontSize: 16,
  },
  signupLink: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  verificationContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  verificationMessage: {
    color: '#2c5aa0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  verificationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  verificationButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  resendButton: {
    backgroundColor: '#007bff',
  },
  resendButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dismissButton: {
    backgroundColor: '#6c757d',
  },
  dismissText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default LoginScreen; 