import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Card, Button, TextInput, Divider, Switch } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { userAPI, authAPI } from '../services/api';
import { showToast } from '../utils/toast';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { validatePhone } from '../utils/validation';
import CustomPhoneInput from '../components/PhoneInput';
import { getFullE164Phone } from '../components/PhoneInput';
import locationService from '../services/locationService';

const ProfileScreen = ({ navigation }) => {
  const { user, updateUser, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fetchedUser, setFetchedUser] = useState(user);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [locationStats, setLocationStats] = useState(null);
  const [locationToggleLoading, setLocationToggleLoading] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const isLargeScreen = screenWidth > 768;
  const isSmallScreen = screenWidth < 400;

  // Create styles with access to isSmallScreen
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: isSmallScreen ? 3 : 20,
      paddingBottom: isSmallScreen ? 3 : 40,
    },
    card: {
      marginBottom: 20,
      borderRadius: 12,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      backgroundColor: '#ffffff',
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#007bff',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333333',
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 14,
      color: '#666666',
      marginBottom: 4,
    },
    divider: {
      marginVertical: 15,
      backgroundColor: '#007bff',
      height: 2,
      borderRadius: 1,
    },
    dividerCompact: {
      marginVertical: 8,
      backgroundColor: '#007bff',
      height: 2,
      borderRadius: 1,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    infoLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: '#333333',
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      color: '#666666',
      flex: 2,
      textAlign: 'right',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#007bff',
      marginBottom: 20,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    input: {
      marginBottom: 0,
      backgroundColor: '#ffffff',
      fontSize: isSmallScreen ? 14 : 16,
    },
    halfInput: {
      width: '100%',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    button: {
      flex: 1,
      marginHorizontal: 5,
    },
    cancelButton: {
      borderColor: '#666666',
    },
    saveButton: {
      backgroundColor: '#007bff',
    },
    actionButton: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      backgroundColor: '#ffffff',
      borderRadius: 8,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: '#007bff',
    },
    actionButtonText: {
      fontSize: 16,
      color: '#007bff',
      textAlign: 'center',
      fontWeight: '500',
    },
    deleteButton: {
      backgroundColor: '#fff5f5',
      borderColor: '#e53e3e',
    },
    deleteButtonText: {
      color: '#e53e3e',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxWidth: 400,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#007bff',
      marginBottom: 20,
      textAlign: 'center',
    },
    centeredContainer: {
      width: '100%',
      alignItems: isSmallScreen ? undefined : 'center',
      marginTop: 0,
      marginBottom: 0,
      paddingHorizontal: isSmallScreen ? 0 : 0,
    },
    profileCard: {
      width: '100%',
      maxWidth: isSmallScreen ? '100%' : 600,
      borderRadius: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      backgroundColor: '#ffffff',
      marginBottom: 14,
      alignSelf: isSmallScreen ? 'stretch' : 'center',
      flex: isSmallScreen ? 1 : undefined,
      marginHorizontal: isSmallScreen ? 0 : 'auto',
    },
    sectionBlock: {
      marginTop: 18,
      marginBottom: 8,
    },
    sectionHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#007bff',
      marginBottom: 4,
    },
    professionValue: {
      fontSize: 18,
      color: '#222',
      fontWeight: '500',
      marginBottom: 2,
      lineHeight: 24,
    },
    professionDescValue: {
      fontSize: 16,
      color: '#444',
      lineHeight: 22,
      backgroundColor: '#f4f8ff',
      borderRadius: 8,
      padding: 10,
      marginTop: 2,
    },
    editFormCard: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      width: '100%',
      maxWidth: isSmallScreen ? '100%' : 600,
      padding: isSmallScreen ? 12 : 24,
      alignSelf: isSmallScreen ? 'stretch' : 'center',
      flex: isSmallScreen ? 1 : undefined,
      marginHorizontal: isSmallScreen ? 0 : 'auto',
    },
    errorText: {
      color: 'red',
      fontSize: 12,
      marginTop: 4,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputContainerRow: {
      marginBottom: 20,
      flex: 1,
    },
  });

  // Fetch user data from API on mount and after update
  useEffect(() => {
    const fetchUser = async () => {
      if (!user?._id) return;
      try {
        setLoading(true);
        setFetchedUser(response.data.data);
        updateUser(response.data.data);
      } catch (error) {
        // fallback to context user
        setFetchedUser(user);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode]);

  // Load location tracking stats
  useEffect(() => {
    const loadLocationStats = async () => {
      try {
        const stats = await locationService.getTrackingStats();
        setLocationStats(stats);
      } catch (error) {
        // Silently handle location stats errors
      }
    };

    loadLocationStats();
    
    // Update stats every 5 seconds
    const interval = setInterval(loadLocationStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Edit profile form
  const [editForm, setEditForm] = useState({
    firstname: user?.firstname || '',
    lastname: user?.lastname || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    profession: user?.profession || '',
    professionDescription: user?.professionDescription || '',
    selectedCountry: user?.selectedCountry || null,
  });
  const [editErrors, setEditErrors] = useState({});
  const [editTouched, setEditTouched] = useState({});

  const validateEditForm = () => {
    const newErrors = {};
    if (!editForm.firstname.trim()) {
      newErrors.firstname = 'First name is required';
    } else if (editForm.firstname.trim().length < 2) {
      newErrors.firstname = 'First name must be at least 2 characters';
    }
    if (!editForm.lastname.trim()) {
      newErrors.lastname = 'Last name is required';
    } else if (editForm.lastname.trim().length < 2) {
      newErrors.lastname = 'Last name must be at least 2 characters';
    }
    if (!editForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!editForm.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else {
      const phoneError = validatePhone(editForm.phoneNumber);
      if (phoneError) {
        newErrors.phoneNumber = phoneError;
      }
    }
    if (!editForm.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!editForm.profession.trim()) {
      newErrors.profession = 'Business name is required';
    }
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditFieldChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    if (editErrors[field]) {
      setEditErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  const handleEditFieldBlur = (field) => {
    setEditTouched(prev => ({ ...prev, [field]: true }));
  };

  // Change password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordTouched, setPasswordTouched] = useState({});

  const validatePasswordForm = () => {
    const newErrors = {};

    // Current Password validation
    if (!passwordForm.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    // New Password validation
    if (!passwordForm.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm Password validation
    if (!passwordForm.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordFieldChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordFieldBlur = (field) => {
    setPasswordTouched(prev => ({ ...prev, [field]: true }));
  };

  const updateEditForm = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = async () => {
    setEditTouched({
      firstname: true,
      lastname: true,
      email: true,
      phoneNumber: true,
      address: true,
      profession: true,
    });
    if (!validateEditForm()) {
      return;
    }

    setLoading(true);
    try {
      const { selectedCountry, ...updateData } = editForm;
      // Concatenate country code with phone number before sending to API
      const country = editForm.selectedCountry || { code: 'US', dial_code: '+1', flag: '🇺🇸', name: 'United States' };
      const fullPhoneNumber = getFullE164Phone(editForm.phoneNumber, country);
      updateData.phoneNumber = fullPhoneNumber;
      const response = await userAPI.updateUser(user._id, updateData);
      updateUser(response.data.data);
      setFetchedUser(response.data.data);
      setEditMode(false);
      showToast.success('Profile updated successfully');
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Mark all password fields as touched
    setPasswordTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setChangePasswordMode(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      setPasswordTouched({});
      showToast.success('Password changed successfully');
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteAccount = async () => {
    setLoading(true);
    try {
      await userAPI.deleteUser(user._id);
      logout();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleLocationToggle = async (enabled) => {
    setLocationToggleLoading(true);
    try {
      if (enabled) {
        const success = await locationService.enableUserTracking();
        if (success) {
          showToast.success('Location tracking enabled');
        } else {
          showToast.error('Location permission denied');
        }
      } else {
        await locationService.disableUserTracking();
        showToast.success('Location tracking disabled');
      }
      
      // Refresh location stats
      const stats = await locationService.getTrackingStats();
      setLocationStats(stats);
    } catch (error) {
      // Silently handle location toggle errors
    } finally {
      setLocationToggleLoading(false);
    }
  };

  const renderProfileInfo = () => (
    <View style={styles.centeredContainer}>
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {fetchedUser?.firstname?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {fetchedUser?.firstname} {fetchedUser?.lastname}
              </Text>
              <Text style={styles.profileEmail}>{fetchedUser?.email}</Text>
            </View>
          </View>

          <Divider style={styles.dividerCompact} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number:</Text>
            <Text style={styles.infoValue}>{fetchedUser?.phoneNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{fetchedUser?.address}</Text>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>Business Name</Text>
            <Text style={styles.professionValue}>{fetchedUser?.profession}</Text>
          </View>

          {fetchedUser?.professionDescription && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>Business Description</Text>
              <Text style={styles.professionDescValue}>{fetchedUser?.professionDescription}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since:</Text>
            <Text style={styles.infoValue}>
              {fetchedUser?.createdAt && !isNaN(Date.parse(fetchedUser.createdAt))
                ? new Date(fetchedUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
                : 'N/A'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  const renderEditForm = () => (
    <View style={styles.centeredContainer}>
      <Card style={styles.editFormCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          {isLargeScreen ? (
            <View style={styles.row}>
              <View style={[styles.inputContainerRow, { marginRight: 8 }]}> 
                <TextInput
                  label="First Name"
                  value={editForm.firstname}
                  onChangeText={(value) => handleEditFieldChange('firstname', value)}
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                  theme={{
                    colors: {
                      primary: '#007bff',
                      background: '#ffffff',
                      placeholder: '#666666',
                    },
                  }}
                  onBlur={() => handleEditFieldBlur('firstname')}
                  error={!!(editErrors.firstname && editTouched.firstname)}
                />
                {editErrors.firstname && editTouched.firstname && (
                  <Text style={styles.errorText}>{editErrors.firstname}</Text>
                )}
              </View>
              <View style={[styles.inputContainerRow]}> 
                <TextInput
                  label="Last Name"
                  value={editForm.lastname}
                  onChangeText={(value) => handleEditFieldChange('lastname', value)}
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                  theme={{
                    colors: {
                      primary: '#007bff',
                      background: '#ffffff',
                      placeholder: '#666666',
                    },
                  }}
                  onBlur={() => handleEditFieldBlur('lastname')}
                  error={!!(editErrors.lastname && editTouched.lastname)}
                />
                {editErrors.lastname && editTouched.lastname && (
                  <Text style={styles.errorText}>{editErrors.lastname}</Text>
                )}
              </View>
            </View>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  label="First Name"
                  value={editForm.firstname}
                  onChangeText={(value) => handleEditFieldChange('firstname', value)}
                  mode="outlined"
                  style={styles.input}
                  theme={{
                    colors: {
                      primary: '#007bff',
                      background: '#ffffff',
                      placeholder: '#666666',
                    },
                  }}
                  onBlur={() => handleEditFieldBlur('firstname')}
                  error={!!(editErrors.firstname && editTouched.firstname)}
                />
                {editErrors.firstname && editTouched.firstname && (
                  <Text style={styles.errorText}>{editErrors.firstname}</Text>
                )}
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  label="Last Name"
                  value={editForm.lastname}
                  onChangeText={(value) => handleEditFieldChange('lastname', value)}
                  mode="outlined"
                  style={styles.input}
                  theme={{
                    colors: {
                      primary: '#007bff',
                      background: '#ffffff',
                      placeholder: '#666666',
                    },
                  }}
                  onBlur={() => handleEditFieldBlur('lastname')}
                  error={!!(editErrors.lastname && editTouched.lastname)}
                />
                {editErrors.lastname && editTouched.lastname && (
                  <Text style={styles.errorText}>{editErrors.lastname}</Text>
                )}
              </View>
            </>
          )}
          <View style={styles.inputContainer}>
            <TextInput
              label="Email"
              value={editForm.email}
              onChangeText={(value) => handleEditFieldChange('email', value)}
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
              onBlur={() => handleEditFieldBlur('email')}
              error={!!(editErrors.email && editTouched.email)}
            />
            {editErrors.email && editTouched.email && (
              <Text style={styles.errorText}>{editErrors.email}</Text>
            )}
          </View>
          <View style={{...styles.inputContainer, zIndex: 10}}>
            <CustomPhoneInput
              value={editForm.phoneNumber}
              onChangeText={(text, country) => {
                handleEditFieldChange('phoneNumber', text);
                handleEditFieldChange('selectedCountry', country);
              }}
              error={editErrors.phoneNumber}
              placeholder="Enter phone number"
              selectedCountry={editForm.selectedCountry}
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              label="Address"
              value={editForm.address}
              onChangeText={(value) => handleEditFieldChange('address', value)}
              mode="outlined"
              style={styles.input}
              theme={{
                colors: {
                  primary: '#007bff',
                  background: '#ffffff',
                  placeholder: '#666666',
                },
              }}
              onBlur={() => handleEditFieldBlur('address')}
              error={!!(editErrors.address && editTouched.address)}
            />
            {editErrors.address && editTouched.address && (
              <Text style={styles.errorText}>{editErrors.address}</Text>
            )}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              label="Business Name"
              value={editForm.profession}
              onChangeText={(value) => handleEditFieldChange('profession', value)}
              mode="outlined"
              style={styles.input}
              theme={{
                colors: {
                  primary: '#007bff',
                  background: '#ffffff',
                  placeholder: '#666666',
                },
              }}
              onBlur={() => handleEditFieldBlur('profession')}
              error={!!(editErrors.profession && editTouched.profession)}
            />
            {editErrors.profession && editTouched.profession && (
              <Text style={styles.errorText}>{editErrors.profession}</Text>
            )}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              label="Business Description"
              value={editForm.professionDescription}
              onChangeText={(value) => handleEditFieldChange('professionDescription', value)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              theme={{
                colors: {
                  primary: '#007bff',
                  background: '#ffffff',
                  placeholder: '#666666',
                },
              }}
              onBlur={() => handleEditFieldBlur('professionDescription')}
            />
          </View>
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={() => setEditMode(false)}
              style={[styles.button, styles.cancelButton]}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleUpdateProfile}
              loading={loading}
              disabled={loading}
              style={[styles.button, styles.saveButton]}
            >
              Save
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  const renderChangePasswordForm = () => (
    <Modal
      visible={changePasswordMode}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setChangePasswordMode(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Change Password</Text>
          
          <View style={styles.inputContainer}>
          <TextInput
            label="Current Password"
            value={passwordForm.currentPassword}
              onChangeText={(value) => handlePasswordFieldChange('currentPassword', value)}
            mode="outlined"
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
            theme={{
              colors: {
                  primary: passwordErrors.currentPassword ? '#e53e3e' : '#007bff',
                background: '#ffffff',
                placeholder: '#666666',
                  error: '#e53e3e',
              },
            }}
              onBlur={() => handlePasswordFieldBlur('currentPassword')}
              error={!!(passwordErrors.currentPassword && passwordTouched.currentPassword)}
          />
            {passwordErrors.currentPassword && passwordTouched.currentPassword && (
              <Text style={styles.errorText}>{passwordErrors.currentPassword}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
          <TextInput
            label="New Password"
            value={passwordForm.newPassword}
              onChangeText={(value) => handlePasswordFieldChange('newPassword', value)}
            mode="outlined"
            secureTextEntry={!showNewPassword}
            right={
              <TextInput.Icon
                icon={showNewPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowNewPassword(!showNewPassword)}
              />
            }
            style={styles.input}
            theme={{
              colors: {
                  primary: passwordErrors.newPassword ? '#e53e3e' : '#007bff',
                background: '#ffffff',
                placeholder: '#666666',
                  error: '#e53e3e',
              },
            }}
              onBlur={() => handlePasswordFieldBlur('newPassword')}
              error={!!(passwordErrors.newPassword && passwordTouched.newPassword)}
          />
            {passwordErrors.newPassword && passwordTouched.newPassword && (
              <Text style={styles.errorText}>{passwordErrors.newPassword}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
          <TextInput
            label="Confirm New Password"
            value={passwordForm.confirmPassword}
              onChangeText={(value) => handlePasswordFieldChange('confirmPassword', value)}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            style={styles.input}
            theme={{
              colors: {
                  primary: passwordErrors.confirmPassword ? '#e53e3e' : '#007bff',
                background: '#ffffff',
                placeholder: '#666666',
                  error: '#e53e3e',
              },
            }}
              onBlur={() => handlePasswordFieldBlur('confirmPassword')}
              error={!!(passwordErrors.confirmPassword && passwordTouched.confirmPassword)}
          />
            {passwordErrors.confirmPassword && passwordTouched.confirmPassword && (
              <Text style={styles.errorText}>{passwordErrors.confirmPassword}</Text>
            )}
          </View>

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={() => {
                setChangePasswordMode(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordErrors({});
                setPasswordTouched({});
              }}
              style={[styles.button, styles.cancelButton]}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleChangePassword}
              loading={loading}
              disabled={loading}
              style={[styles.button, styles.saveButton]}
            >
              Change
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {editMode ? renderEditForm() : (
          <>
            {renderProfileInfo()}
            <View style={styles.centeredContainer}>
              <Card style={styles.profileCard}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Account Actions</Text>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setEditMode(true)}
                  >
                    <Text style={styles.actionButtonText}>Edit Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setChangePasswordMode(true)}
                  >
                    <Text style={styles.actionButtonText}>Change Password</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleDeleteAccount}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                      Delete Account
                    </Text>
                  </TouchableOpacity>
                </Card.Content>
              </Card>
            </View>

            {/* Location Tracking Status */}
            <View style={styles.centeredContainer}>
              <Card style={styles.profileCard}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Location Tracking</Text>
                  {locationStats?.platform === 'web' && (
                    <Text style={[styles.infoValue, { marginBottom: 15, fontSize: 12, color: '#666' }]}>
                      Location tracking helps provide location-based reminders. Please allow location access when prompted.
                    </Text>
                  )}
                  {locationStats ? (
                    <>
                      {/* User Toggle Control */}
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Enable Location Tracking:</Text>
                        <Switch
                          value={locationStats.userPreference?.enabled}
                          onValueChange={handleLocationToggle}
                          disabled={locationToggleLoading}
                          color="#007bff"
                        />
                      </View>
                      
                      <Divider style={styles.dividerCompact} />
                      
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Status:</Text>
                        <Text style={[
                          styles.infoValue, 
                          { color: locationStats.isTracking ? '#28a745' : '#dc3545' }
                        ]}>
                          {locationStats.isTracking ? 'Active' : 'Inactive'}
                          {locationStats.platform === 'web' && !locationStats.isTracking && !locationStats.permissionStatus?.foreground && (
                            ' (Permission needed)'
                          )}
                        </Text>
                      </View>
                      
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Foreground Permission:</Text>
                        <Text style={[
                          styles.infoValue, 
                          { color: locationStats.permissionStatus?.foreground ? '#28a745' : '#dc3545' }
                        ]}>
                          {locationStats.permissionStatus?.foreground ? 'Granted' : 'Denied'}
                        </Text>
                      </View>
                      
                      {locationStats.platform !== 'web' && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Background Permission:</Text>
                          <Text style={[
                            styles.infoValue, 
                            { color: locationStats.permissionStatus?.background ? '#28a745' : '#dc3545' }
                          ]}>
                            {locationStats.permissionStatus?.background ? 'Granted' : 'Denied'}
                          </Text>
                        </View>
                      )}
                      
                      {/* Last Location and Update Interval are hidden on web */}
                      {locationStats.platform !== 'web' && locationStats.lastLocation && 
                       locationStats.lastLocation.coords && 
                       typeof locationStats.lastLocation.coords.latitude === 'number' && 
                       typeof locationStats.lastLocation.coords.longitude === 'number' && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Last Location:</Text>
                          <Text style={styles.infoValue}>
                            {locationStats.lastLocation.coords.latitude.toFixed(4)}, {locationStats.lastLocation.coords.longitude.toFixed(4)}
                          </Text>
                        </View>
                      )}
                      
                      {locationStats.platform !== 'web' && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Update Interval:</Text>
                          <Text style={styles.infoValue}>
                            {locationStats.updateInterval / 1000}s
                          </Text>
                        </View>
                      )}
                      
                      {locationStats.platform !== 'web' && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Background Tracking:</Text>
                          <Text style={[
                            styles.infoValue, 
                            { color: locationStats.hasBackgroundSubscription ? '#28a745' : '#dc3545' }
                          ]}>
                            {locationStats.hasBackgroundSubscription ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={styles.infoValue}>
                      {locationStats?.platform === 'web' ? 'Checking location permissions...' : 'Loading location status...'}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            </View>
          </>
        )}
      </ScrollView>
      {renderChangePasswordForm()}
      <ConfirmationDialog
        visible={showDeleteConfirmation}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteConfirmation(false)}
        confirmButtonStyle="destructive"
        loading={loading}
      />
    </View>
  );
};

export default ProfileScreen; 