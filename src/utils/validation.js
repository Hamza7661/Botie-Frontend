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
  
  // Check if it's a valid phone number format
  // Supports both local format (e.g., 03174014512) and international format (e.g., +923174014512)
  if (digits.length < 10 || digits.length > 15) {
    return 'Please enter a valid phone number (10-15 digits)';
  }
  
  // Additional validation for Pakistani numbers
  // If it starts with 0, it should be followed by 3 digits (mobile codes)
  if (digits.startsWith('0') && digits.length === 11) {
    const mobileCode = digits.substring(1, 4);
    const validMobileCodes = ['300', '301', '302', '303', '304', '305', '306', '307', '308', '309', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323', '324', '325', '326', '327', '328', '329', '330', '331', '332', '333', '334', '335', '336', '337', '338', '339', '340', '341', '342', '343', '344', '345', '346', '347', '348', '349', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '360', '361', '362', '363', '364', '365', '366', '367', '368', '369', '370', '371', '372', '373', '374', '375', '376', '377', '378', '379', '380', '381', '382', '383', '384', '385', '386', '387', '388', '389', '390', '391', '392', '393', '394', '395', '396', '397', '398', '399'];
    if (!validMobileCodes.includes(mobileCode)) {
      return 'Please enter a valid Pakistani mobile number';
    }
  }
  
  // If it starts with 92 (international format for Pakistan), it should be followed by valid mobile code
  if (digits.startsWith('92') && digits.length === 12) {
    const mobileCode = digits.substring(2, 5);
    const validMobileCodes = ['300', '301', '302', '303', '304', '305', '306', '307', '308', '309', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323', '324', '325', '326', '327', '328', '329', '330', '331', '332', '333', '334', '335', '336', '337', '338', '339', '340', '341', '342', '343', '344', '345', '346', '347', '348', '349', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '360', '361', '362', '363', '364', '365', '366', '367', '368', '369', '370', '371', '372', '373', '374', '375', '376', '377', '378', '379', '380', '381', '382', '383', '384', '385', '386', '387', '388', '389', '390', '391', '392', '393', '394', '395', '396', '397', '398', '399'];
    if (!validMobileCodes.includes(mobileCode)) {
      return 'Please enter a valid Pakistani mobile number';
    }
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