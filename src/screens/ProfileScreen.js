import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Card, Button, TextInput, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { userAPI, authAPI } from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const { user, updateUser, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Edit profile form
  const [editForm, setEditForm] = useState({
    firstname: user?.firstname || '',
    lastname: user?.lastname || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    profession: user?.profession || '',
    professionDescription: user?.professionDescription || '',
  });

  // Change password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const updateEditForm = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const updatePasswordForm = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = async () => {
    if (!editForm.firstname || !editForm.lastname || !editForm.email || !editForm.address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.updateUser(user._id, editForm);
      updateUser(response.data);
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
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
      Alert.alert('Success', 'Password changed successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await userAPI.deleteUser(user._id);
              logout();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete account');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderProfileInfo = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstname?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.firstname} {user?.lastname}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Text style={styles.profileProfession}>{user?.profession}</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone Number:</Text>
          <Text style={styles.infoValue}>{user?.phoneNumber}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Address:</Text>
          <Text style={styles.infoValue}>{user?.address}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Profession:</Text>
          <Text style={styles.infoValue}>{user?.profession}</Text>
        </View>

        {user?.professionDescription && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description:</Text>
            <Text style={styles.infoValue}>{user?.professionDescription}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since:</Text>
          <Text style={styles.infoValue}>
            {new Date(user?.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEditForm = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Edit Profile</Text>
        
        <View style={styles.row}>
          <TextInput
            label="First Name"
            value={editForm.firstname}
            onChangeText={(value) => updateEditForm('firstname', value)}
            mode="outlined"
            style={[styles.input, styles.halfInput]}
            theme={{
              colors: {
                primary: '#007bff',
                background: '#ffffff',
                placeholder: '#666666',
              },
            }}
          />
          <TextInput
            label="Last Name"
            value={editForm.lastname}
            onChangeText={(value) => updateEditForm('lastname', value)}
            mode="outlined"
            style={[styles.input, styles.halfInput]}
            theme={{
              colors: {
                primary: '#007bff',
                background: '#ffffff',
                placeholder: '#666666',
              },
            }}
          />
        </View>

        <TextInput
          label="Email"
          value={editForm.email}
          onChangeText={(value) => updateEditForm('email', value)}
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

        <TextInput
          label="Phone Number"
          value={editForm.phoneNumber}
          onChangeText={(value) => updateEditForm('phoneNumber', value)}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
          theme={{
            colors: {
              primary: '#007bff',
              background: '#ffffff',
              placeholder: '#666666',
            },
          }}
        />

        <TextInput
          label="Address"
          value={editForm.address}
          onChangeText={(value) => updateEditForm('address', value)}
          mode="outlined"
          style={styles.input}
          theme={{
            colors: {
              primary: '#007bff',
              background: '#ffffff',
              placeholder: '#666666',
            },
          }}
        />

        <TextInput
          label="Profession"
          value={editForm.profession}
          onChangeText={(value) => updateEditForm('profession', value)}
          mode="outlined"
          style={styles.input}
          theme={{
            colors: {
              primary: '#007bff',
              background: '#ffffff',
              placeholder: '#666666',
            },
          }}
        />

        <TextInput
          label="Profession Description"
          value={editForm.professionDescription}
          onChangeText={(value) => updateEditForm('professionDescription', value)}
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
        />

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
            Save Changes
          </Button>
        </View>
      </Card.Content>
    </Card>
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
          
          <TextInput
            label="Current Password"
            value={passwordForm.currentPassword}
            onChangeText={(value) => updatePasswordForm('currentPassword', value)}
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
                primary: '#007bff',
                background: '#ffffff',
                placeholder: '#666666',
              },
            }}
          />

          <TextInput
            label="New Password"
            value={passwordForm.newPassword}
            onChangeText={(value) => updatePasswordForm('newPassword', value)}
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
                primary: '#007bff',
                background: '#ffffff',
                placeholder: '#666666',
              },
            }}
          />

          <TextInput
            label="Confirm New Password"
            value={passwordForm.confirmPassword}
            onChangeText={(value) => updatePasswordForm('confirmPassword', value)}
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
                primary: '#007bff',
                background: '#ffffff',
                placeholder: '#666666',
              },
            }}
          />

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={() => setChangePasswordMode(false)}
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
              Change Password
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <LinearGradient
      colors={['#007bff', '#0056b3']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {editMode ? renderEditForm() : renderProfileInfo()}

        <Card style={styles.card}>
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
      </ScrollView>

      {renderChangePasswordForm()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  profileProfession: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  divider: {
    marginVertical: 15,
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
    color: '#333333',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  halfInput: {
    width: '48%',
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
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default ProfileScreen; 