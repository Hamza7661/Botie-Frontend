// Validation utility for forms
export const validateEmail = (email) => {
  if (!email.trim()) {
    return 'Email is required';
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return 'Please enter a valid email address';
  }
  return '';
};

export const validatePassword = (password) => {
  if (!password.trim()) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return 'Password must contain uppercase, lowercase, and number';
  }
  return '';
};

export const validateRequired = (value, fieldName) => {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  return '';
};

export const validateMinLength = (value, fieldName, minLength) => {
  if (value.trim().length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return '';
};

export const validatePhone = (phone) => {
  if (!phone.trim()) {
    return 'Phone number is required';
  }
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return 'Please enter a valid phone number';
  }
  return '';
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword.trim()) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return '';
};

// Helper function to get input theme based on error state
export const getInputTheme = (hasError) => ({
  colors: {
    primary: hasError ? '#e53e3e' : '#007bff',
    background: '#ffffff',
    placeholder: '#666666',
    error: '#e53e3e',
  },
});

// Helper function to get input styles based on error state
export const getInputStyles = (baseStyle, hasError) => [
  baseStyle,
  hasError && { borderColor: '#e53e3e' }
];

// Error text style
export const errorTextStyle = {
  color: '#e53e3e',
  fontSize: 12,
  marginTop: 4,
  marginLeft: 4,
}; 