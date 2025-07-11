import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, Checkbox, Searchbar } from 'react-native-paper';
import RNPickerSelect from 'react-native-picker-select';
import { tasksAPI, customerAPI } from '../services/api';
import Preloader from '../components/Preloader';
import { showToast } from '../utils/toast';
import { validatePhone } from '../utils/validation';

const AddEditAppointmentScreen = ({ navigation, route }) => {
  const { appointmentId, isEditing } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    heading: '',
    summary: '',
    description: '',
    isResolved: false,
    customer: {
      name: '',
      address: '',
      phoneNumber: '',
    },
  });

  // Customer search state
  const [customers, setCustomers] = useState([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Error states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (isEditing && appointmentId) {
      loadAppointment();
    }
  }, [appointmentId, isEditing]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getTaskById(appointmentId);
      const appointment = response.data.data;
      
      setFormData({
        heading: appointment.heading || '',
        summary: appointment.summary || '',
        description: appointment.description || '',
        isResolved: appointment.isResolved || false,
        customer: {
          name: appointment.customer?.name || '',
          address: appointment.customer?.address || '',
          phoneNumber: appointment.customer?.phoneNumber || '',
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load appointment');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async (query) => {
    try {
      setLoadingCustomers(true);
      const response = await customerAPI.searchCustomers(query);
      setCustomers(response.data.data.customers || []);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleCustomerSearch = (query) => {
    setCustomerSearchQuery(query);
    if (query.trim().length >= 2) {
      searchCustomers(query);
      setShowCustomerSearch(true);
    } else {
      setCustomers([]);
      setShowCustomerSearch(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery(customer.name);
    setShowCustomerSearch(false);
    
    // Auto-populate customer fields
    setFormData(prev => ({
      ...prev,
      customer: {
        name: customer.name || '',
        address: customer.address || '',
        phoneNumber: customer.phoneNumber || '',
      },
    }));
    
    // Clear customer-related errors
    setErrors(prev => ({
      ...prev,
      customerName: undefined,
      customerPhone: undefined,
    }));
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setCustomers([]);
    setShowCustomerSearch(false);
    
    // Clear customer fields
    setFormData(prev => ({
      ...prev,
      customer: {
        name: '',
        address: '',
        phoneNumber: '',
      },
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Heading validation
    if (!formData.heading.trim()) {
      newErrors.heading = String('Heading is required');
    } else if (formData.heading.trim().length < 3) {
      newErrors.heading = String('Heading must be at least 3 characters');
    }

    // Summary validation
    if (!formData.summary.trim()) {
      newErrors.summary = String('Summary is required');
    } else if (formData.summary.trim().length < 10) {
      newErrors.summary = String('Summary must be at least 10 characters');
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = String('Description is required');
    }

    // Customer name validation
    if (!formData.customer.name.trim()) {
      newErrors.customerName = String('Customer name is required');
    } else if (formData.customer.name.trim().length < 2) {
      newErrors.customerName = String('Customer name must be at least 2 characters');
    }

    // Customer phone validation
    if (!formData.customer.phoneNumber.trim()) {
      newErrors.customerPhone = String('Customer phone number is required');
    } else {
      const phoneError = validatePhone(formData.customer.phoneNumber);
      if (phoneError) {
        newErrors.customerPhone = String(phoneError);
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    let errorField;
    if (field.includes('.')) {
      // For customer fields like 'customer.name', the error field is 'customerName'
      const [parent, child] = field.split('.');
      if (child === 'phoneNumber') {
        errorField = 'customerPhone';
      } else {
        errorField = `customer${child.charAt(0).toUpperCase() + child.slice(1)}`;
      }
    } else {
      errorField = field;
    }
    
    if (errors[errorField]) {
      setErrors(prev => ({ ...prev, [errorField]: undefined }));
    }
  };

  const handleFieldBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async () => {
    // Mark all fields as touched
    setTouched({
      heading: true,
      summary: true,
      description: true,
      customerName: true,
      customerPhone: true,
    });

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        const response = await tasksAPI.updateTask(appointmentId, formData);
        const message = response?.data?.message || 'Appointment updated successfully';
        showToast.success(String(message));
        navigation.navigate('Dashboard');
      } else {
        const response = await tasksAPI.createTask(formData);
        const message = response?.data?.message || 'Appointment created successfully';
        showToast.success(String(message));
        navigation.navigate('Dashboard');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save appointment';
      showToast.error(String(errorMessage));
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

  const renderInput = (field, label, options = {}) => (
    <View style={styles.inputContainer}>
      <TextInput
        label={label}
        value={String(formData[field] || '')}
        onChangeText={(value) => updateFormData(field, value)}
        onBlur={() => handleFieldBlur(field)}
        mode="outlined"
        style={[
          styles.input,
          errors[field] && touched[field] && styles.inputError
        ]}
        theme={getInputTheme(field)}
        error={!!(errors[field] && touched[field])}
        {...options}
      />
      {errors[field] && touched[field] && errors[field] !== '' && (
        <React.Fragment>
          <Text style={styles.errorText}>{String(errors[field])}</Text>
        </React.Fragment>
      )}
    </View>
  );

  const renderCustomerInput = (field, label, options = {}) => {
    const value = String(formData.customer[field] || '');
    // Special case for phoneNumber to match validation function
    let errorField;
    if (field === 'phoneNumber') {
      errorField = 'customerPhone';
    } else {
      errorField = `customer${field.charAt(0).toUpperCase() + field.slice(1)}`;
    }
    
    return (
      <View style={styles.inputContainer}>
        <TextInput
          label={label}
          value={value}
          onChangeText={(value) => updateFormData(`customer.${field}`, value)}
          onBlur={() => handleFieldBlur(errorField)}
          mode="outlined"
          style={[
            styles.input,
            errors[errorField] && touched[errorField] && styles.inputError
          ]}
          theme={getInputTheme(errorField)}
          error={!!(errors[errorField] && touched[errorField])}
          disabled={options.disabled}
          {...options}
        />
        {errors[errorField] && touched[errorField] && errors[errorField] !== '' && (
          <React.Fragment>
            <Text style={styles.errorText}>{String(errors[errorField])}</Text>
          </React.Fragment>
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
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.formCard}>
            <View style={styles.formContent}>
              <Text style={styles.title}>
                {isEditing ? 'Edit Appointment' : 'Add New Appointment'}
              </Text>

              {renderInput('heading', 'Heading')}

              {renderInput('summary', 'Summary')}

              {renderInput('description', 'Description', {
                multiline: true,
                numberOfLines: 4
              })}

              <Text style={styles.sectionTitle}>Customer Information</Text>

              {/* Customer Search */}
              <View style={styles.customerSearchContainer}>
                <Text style={styles.searchLabel}>Search Existing Customer to Link</Text>
                <Searchbar
                  placeholder="Search customers by name or phone..."
                  onChangeText={handleCustomerSearch}
                  value={customerSearchQuery}
                  style={styles.customerSearchBar}
                  iconColor="#007bff"
                  onClearIconPress={clearCustomerSelection}
                />
                
                {showCustomerSearch && (
                  <View style={styles.customerDropdown}>
                    {loadingCustomers ? (
                      <View style={styles.dropdownItem}>
                        <Text style={styles.dropdownText}>Loading...</Text>
                      </View>
                    ) : customers.length > 0 ? (
                      customers.map((customer) => (
                        <TouchableOpacity
                          key={customer._id}
                          style={styles.dropdownItem}
                          onPress={() => handleCustomerSelect(customer)}
                        >
                          <Text style={styles.dropdownText}>
                            {customer.name} — {customer.phoneNumber}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : customerSearchQuery.trim().length >= 2 ? (
                      <View style={styles.dropdownItem}>
                        <Text style={styles.dropdownText}>No customers found</Text>
                      </View>
                    ) : null}
                  </View>
                )}
                
                {selectedCustomer && (
                  <View style={styles.selectedCustomerInfo}>
                    <Text style={styles.selectedCustomerText}>
                      Selected: {selectedCustomer.name}
                    </Text>
                    <TouchableOpacity
                      onPress={clearCustomerSelection}
                      style={styles.clearSelectionButton}
                    >
                      <Text style={styles.clearSelectionText}>Clear Selection</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {renderCustomerInput('name', 'Customer Name', {
                disabled: !!selectedCustomer
              })}

              {renderCustomerInput('phoneNumber', 'Customer Phone Number', {
                keyboardType: 'phone-pad',
                disabled: !!selectedCustomer
              })}

              {renderCustomerInput('address', 'Customer Address', {
                multiline: true,
                numberOfLines: 3,
                disabled: !!selectedCustomer
              })}

              {selectedCustomer && (
                <Text style={styles.autoFillNote}>
                  Customer fields are auto-filled from selected customer. Clear selection to edit manually.
                </Text>
              )}

              {isEditing && (
                <View style={styles.checkboxContainer}>
                  <Text style={styles.sectionTitle}>Status</Text>
                  <View style={styles.checkboxRow}>
                    <Checkbox
                      status={formData.isResolved ? 'checked' : 'unchecked'}
                      onPress={() => updateFormData('isResolved', !formData.isResolved)}
                      color="#007bff"
                    />
                    <Text style={styles.checkboxLabel}>
                      Mark as resolved
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={() => navigation.goBack()}
                  style={[styles.button, styles.cancelButton]}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={loading}
                  style={[styles.button, styles.saveButton]}
                >
                  {isEditing ? 'Update' : 'Save'}
                </Button>
              </View>
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
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 10,
    alignItems: 'center',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
    maxWidth: 600,
    padding: 24,
  },
  formContent: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    marginBottom: 12,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 12,
  },
  button: {
    minWidth: 120,
    maxWidth: 200,
    marginHorizontal: 5,
  },
  cancelButton: {
    borderColor: '#666666',
  },
  saveButton: {
    backgroundColor: '#007bff',
    color: '#fff',
  },
  checkboxContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 8,
  },
  customerSearchContainer: {
    marginBottom: 20,
  },
  searchLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  customerSearchBar: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
  },
  customerDropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007bff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
    maxHeight: 200,
    marginTop: 4,
  },
  dropdownItem: {
    padding: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333333',
  },
  dropdownSubtext: {
    fontSize: 14,
    color: '#666666',
  },
  selectedCustomerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  selectedCustomerText: {
    fontSize: 16,
    color: '#333333',
    marginRight: 8,
  },
  clearSelectionButton: {
    padding: 8,
  },
  clearSelectionText: {
    fontSize: 16,
    color: '#007bff',
  },
  autoFillNote: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    marginBottom: 20,
  },
});

export default AddEditAppointmentScreen; 