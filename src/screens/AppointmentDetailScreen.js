import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button, Divider } from 'react-native-paper';
import { tasksAPI } from '../services/api';
import { showToast } from '../utils/toast';

const AppointmentDetailScreen = ({ navigation, route }) => {
  const { appointmentId } = route.params;
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getTaskById(appointmentId);
      // API response: { success: true, data: { ... } }
      setAppointment(response.data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load appointment details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await tasksAPI.deleteTask(appointmentId);
      // Use replace to force a fresh load of the Dashboard
      navigation.replace('Dashboard');
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to delete appointment');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading appointment...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Appointment not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.detailCard}>
          <Text style={styles.heading}>{appointment.heading}</Text>
          <Text style={styles.summary}>{appointment.summary}</Text>
          <Divider style={styles.divider} />
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{appointment.description}</Text>
          <Divider style={styles.divider} />
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>Name: {appointment.customer?.name || '-'}</Text>
            <Text style={styles.customerPhone}>Phone: {appointment.customer?.phoneNumber || '-'}</Text>
            <Text style={styles.customerAddress}>Address: {appointment.customer?.address || '-'}</Text>
          </View>
          <Divider style={styles.divider} />
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>{new Date(appointment.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Last Updated:</Text>
            <Text style={styles.detailValue}>{new Date(appointment.updatedAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View style={[
              styles.statusBadge,
              appointment.isResolved ? styles.resolvedStatus : styles.unresolvedStatus
            ]}>
              <Text style={[
                styles.statusText,
                appointment.isResolved ? styles.resolvedStatusText : styles.unresolvedStatusText
              ]}>
                {appointment.isResolved ? "✓ Resolved" : "✗ Unresolved"}
              </Text>
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('AddEditAppointment', {
                appointmentId: appointment._id,
                isEditing: true
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
    fontSize: 16,
    color: '#666666',
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  summary: {
    fontSize: 18,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 8,
    marginTop: 12,
  },
  description: {
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 16,
    color: '#333',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
  },
  detailValue: {
    fontSize: 15,
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
    fontSize: 13,
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