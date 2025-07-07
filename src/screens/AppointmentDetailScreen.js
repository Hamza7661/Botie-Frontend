import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Button, Divider } from 'react-native-paper';
import { tasksAPI, remindersAPI, TaskType } from '../services/api';
import { showToast } from '../utils/toast';
import ConfirmationDialog from '../components/ConfirmationDialog';
import MapPicker from '../components/MapPicker';

const isSmallScreen = Dimensions.get('window').width < 400;

const AppointmentDetailScreen = ({ navigation, route }) => {
  const { appointmentId, taskType } = route.params;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      let response;
      
      if (taskType === TaskType.REMINDER) {
        response = await remindersAPI.getReminderById(appointmentId);
      } else {
        response = await tasksAPI.getTaskById(appointmentId);
      }
      
      setItem(response.data.data);
    } catch (error) {
      // Check if it's a 401 unauthorized error
      if (error.response?.status === 401) {
        showToast.error('Session expired. Please login to continue.');
      } else {
        showToast.error(`Failed to load ${taskType === TaskType.REMINDER ? 'reminder' : 'appointment'} details`);
      }
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    try {
      if (taskType === TaskType.REMINDER) {
        await remindersAPI.deleteReminder(appointmentId);
        showToast.success('Reminder deleted successfully');
      } else {
      await tasksAPI.deleteTask(appointmentId);
      showToast.success('Appointment deleted successfully');
      }
      navigation.replace('Dashboard');
    } catch (error) {
      // Check if it's a 401 unauthorized error
      if (error.response?.status === 401) {
        showToast.error('Session expired. Please login to continue.');
      } else {
        showToast.error(error.response?.data?.message || `Failed to delete ${taskType === TaskType.REMINDER ? 'reminder' : 'appointment'}`);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading {taskType === TaskType.REMINDER ? 'reminder' : 'appointment'}...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{taskType === TaskType.REMINDER ? 'Reminder' : 'Appointment'} not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.detailCard}>
          {taskType === TaskType.REMINDER ? (
            <>
              <Text style={styles.heading}>{item.description}</Text>
              <Text style={styles.summary}>📍 {item.locationName}</Text>
              <Divider style={styles.divider} />
              <Text style={styles.sectionTitle}>Reminder Details</Text>
              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Created:</Text>
                <Text style={styles.detailValue}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Last Updated:</Text>
                <Text style={styles.detailValue}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
              </View>
              {item.reminderDateTime && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailLabel}>Reminder Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(item.reminderDateTime).toLocaleString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </Text>
                </View>
              )}
              {item.coordinates && (
                <>
                  <Divider style={styles.divider} />
                  <Text style={styles.sectionTitle}>Location</Text>
                  <View style={{ marginVertical: 12 }}>
                    <MapPicker
                      value={item.coordinates}
                      readOnly={true}
                    />
                  </View>
                </>
              )}
            </>
          ) : (
            <>
              <Text style={styles.heading}>{item.heading}</Text>
              <Text style={styles.summary}>{item.summary}</Text>
          <Divider style={styles.divider} />
          <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{item.description}</Text>
          <Divider style={styles.divider} />
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerInfo}>
                <Text style={styles.customerName}>Name: {item.customer?.name || '-'}</Text>
                <Text style={styles.customerPhone}>Phone: {item.customer?.phoneNumber || '-'}</Text>
                <Text style={styles.customerAddress}>Address: {item.customer?.address || '-'}</Text>
          </View>
          <Divider style={styles.divider} />
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Created:</Text>
                <Text style={styles.detailValue}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Last Updated:</Text>
                <Text style={styles.detailValue}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View style={[
              styles.statusBadge,
                  item.isResolved ? styles.resolvedStatus : styles.unresolvedStatus
            ]}>
              <Text style={[
                styles.statusText,
                    item.isResolved ? styles.resolvedStatusText : styles.unresolvedStatusText
              ]}>
                    {item.isResolved ? "✓ Resolved" : "✗ Unresolved"}
              </Text>
            </View>
          </View>
            </>
          )}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('AddEditAppointment', {
                appointmentId: item._id,
                isEditing: true,
                taskType: taskType
              })}
              style={styles.editButton}
            >
              Edit
            </Button>
            <Button
              mode="outlined"
              onPress={handleDelete}
              style={styles.deleteButton}
              textColor="#e53e3e"
            >
              Delete
            </Button>
          </View>
        </View>
      </ScrollView>
      <ConfirmationDialog
        visible={showDeleteConfirmation}
        title={`Delete ${taskType === TaskType.REMINDER ? 'Reminder' : 'Appointment'}`}
        message={`Are you sure you want to delete this ${taskType === TaskType.REMINDER ? 'reminder' : 'appointment'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirmation(false)}
        confirmButtonStyle="destructive"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 40,
    alignItems: 'center',
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
    maxWidth: 700,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  errorText: {
    fontSize: isSmallScreen ? 13 : 16,
    color: '#666666',
  },
  heading: {
    fontSize: isSmallScreen ? 20 : 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  summary: {
    fontSize: isSmallScreen ? 14 : 18,
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 18,
    backgroundColor: '#007bff',
    height: 2,
    borderRadius: 1,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 15 : 20,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 8,
    marginTop: 12,
  },
  description: {
    fontSize: isSmallScreen ? 13 : 16,
    color: '#333',
    marginBottom: 8,
  },
  customerInfo: {
    backgroundColor: '#f4f8ff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  customerName: {
    fontSize: isSmallScreen ? 13 : 16,
    fontWeight: '500',
    color: '#222',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: isSmallScreen ? 13 : 16,
    color: '#333',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: isSmallScreen ? 13 : 16,
    color: '#333',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: isSmallScreen ? 12 : 15,
    fontWeight: '500',
    color: '#222',
  },
  detailValue: {
    fontSize: isSmallScreen ? 12 : 15,
    color: '#555',
  },
  buttonContainer: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  editButton: {
    minWidth: 120,
    maxWidth: 200,
    marginRight: 8,
    backgroundColor: '#007bff',
  },
  deleteButton: {
    minWidth: 120,
    maxWidth: 200,
    borderColor: '#e53e3e',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolvedStatus: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  unresolvedStatus: {
    backgroundColor: '#fef2f2',
    borderColor: '#e53e3e',
  },
  statusText: {
    fontSize: isSmallScreen ? 11 : 13,
    fontWeight: 'bold',
  },
  resolvedStatusText: {
    color: '#22c55e',
  },
  unresolvedStatusText: {
    color: '#e53e3e',
  },
});

export default AppointmentDetailScreen; 