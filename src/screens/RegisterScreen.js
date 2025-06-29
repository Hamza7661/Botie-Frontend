import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import Preloader from '../components/Preloader';
import { validatePhone } from '../utils/validation';

const RegisterScreen = ({ navigation }) => {
  const screenWidth = Dimensions.get('window').width;
  const isLargeScreen = screenWidth > 768; // Tablet/desktop breakpoint

  // Refs for field navigation
  const lastnameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const addressRef = useRef(null);
  const professionRef = useRef(null);
  const professionDescRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phoneNumber: '',
    address: '',
    password: '',
    confirmPassword: '',
    profession: '',
    professionDescription: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Error states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const { register } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    // First Name validation
    if (!formData.firstname.trim()) {
      newErrors.firstname = 'First name is required';
    } else if (formData.firstname.trim().length < 2) {
      newErrors.firstname = 'First name must be at least 2 characters';
    }

    // Last Name validation
    if (!formData.lastname.trim()) {
      newErrors.lastname = 'Last name is required';
    } else if (formData.lastname.trim().length < 2) {
      newErrors.lastname = 'Last name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone Number validation
    const phoneError = validatePhone(formData.phoneNumber);
    if (phoneError) {
      newErrors.phoneNumber = phoneError;
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Profession validation
    if (!formData.profession.trim()) {
      newErrors.profession = 'Profession is required';
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm Password validation
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFieldBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleRegister = async () => {
    // Mark all fields as touched
    setTouched({
      firstname: true,
      lastname: true,
      email: true,
      phoneNumber: true,
      address: true,
      profession: true,
      password: true,
      confirmPassword: true,
    });

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await register(registerData);
      
      if (result.success) {
        showToast.success('Account created successfully! Please sign in.');
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      } else {
        showToast.error(result.error);
      }
    } catch (error) {
      // Handle any unexpected errors that might occur outside of the register function
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

  const renderInput = (field, label, options = {}) => {
    // Determine the next field to focus
    const getNextField = () => {
      const fieldOrder = [
        'firstname', 'lastname', 'email', 'phoneNumber', 
        'address', 'profession', 'professionDescription', 
        'password', 'confirmPassword'
      ];
      const currentIndex = fieldOrder.indexOf(field);
      const nextField = fieldOrder[currentIndex + 1];
      
      if (nextField === 'lastname') return lastnameRef;
      if (nextField === 'email') return emailRef;
      if (nextField === 'phoneNumber') return phoneRef;
      if (nextField === 'address') return addressRef;
      if (nextField === 'profession') return professionRef;
      if (nextField === 'professionDescription') return professionDescRef;
      if (nextField === 'password') return passwordRef;
      if (nextField === 'confirmPassword') return confirmPasswordRef;
      
      return null; // Last field
    };

    const nextFieldRef = getNextField();
    const isLastField = field === 'confirmPassword';

    return (
      <View style={options.inputContainerStyle || styles.inputContainer}>
        <TextInput
          ref={options.ref}
          label={label}
          value={formData[field]}
          onChangeText={(value) => updateFormData(field, value)}
          onBlur={() => handleFieldBlur(field)}
          onSubmitEditing={() => {
            if (isLastField) {
              handleRegister();
            } else if (nextFieldRef?.current) {
              nextFieldRef.current.focus();
            }
          }}
          returnKeyType={isLastField ? 'done' : 'next'}
          mode="outlined"
          style={[
            styles.input,
            options.style,
            errors[field] && touched[field] && styles.inputError
          ]}
          theme={getInputTheme(field)}
          error={!!(errors[field] && touched[field])}
          {...options}
        />
        {errors[field] && touched[field] && (
          <Text style={styles.errorText}>{errors[field]}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Preloader visible={loading} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          alwaysBounceVertical={true}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo}>B</Text>
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join Botie today</Text>
            </View>

            {/* Registration Form */}
            <View style={styles.form}>
              {isLargeScreen ? (
                <View style={styles.row}>
                  {renderInput('firstname', 'First Name', { 
                    style: styles.halfInput, 
                    inputContainerStyle: [styles.inputContainerRow, { marginRight: 8 }] 
                  })}
                  {renderInput('lastname', 'Last Name', { 
                    style: styles.halfInput, 
                    inputContainerStyle: styles.inputContainerRow,
                    ref: lastnameRef
                  })}
                </View>
              ) : (
                <>
                  {renderInput('firstname', 'First Name')}
                  {renderInput('lastname', 'Last Name', { ref: lastnameRef })}
                </>
              )}

              {renderInput('email', 'Email', {
                keyboardType: 'email-address',
                autoCapitalize: 'none',
                ref: emailRef
              })}

              {renderInput('phoneNumber', 'Phone Number', {
                keyboardType: 'phone-pad',
                ref: phoneRef
              })}

              {renderInput('address', 'Address', {
                multiline: true,
                numberOfLines: 4,
                ref: addressRef
              })}

              {renderInput('profession', 'Profession', {
                ref: professionRef
              })}

              {renderInput('professionDescription', 'Profession Description', {
                multiline: true,
                numberOfLines: 4,
                ref: professionDescRef
              })}

              {renderInput('password', 'Password', {
                secureTextEntry: !showPassword,
                ref: passwordRef,
                right: (
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                )
              })}

              {renderInput('confirmPassword', 'Confirm Password', {
                secureTextEntry: !showConfirmPassword,
                ref: confirmPasswordRef,
                right: (
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                )
              })}

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.registerButton}
                contentStyle={styles.registerButtonContent}
                labelStyle={styles.registerButtonLabel}
              >
                Create Account
              </Button>
            </View>

            {/* Sign In Section */}
            <View style={styles.signinSection}>
              <Text style={styles.signinText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signinLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Extra space to ensure scrolling */}
            <View style={styles.extraSpace} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 100,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  form: {
    width: '100%',
    maxWidth: 700,
  },
  inputContainer: {
    marginBottom: 20,
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
  registerButton: {
    marginTop: 8,
    marginBottom: 30,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  registerButtonContent: {
    paddingVertical: 8,
  },
  registerButtonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signinSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  signinText: {
    color: '#666666',
    fontSize: 16,
  },
  signinLink: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  extraSpace: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '100%',
  },
  inputContainerRow: {
    marginBottom: 20,
    flex: 1,
  },
});

export default RegisterScreen; 