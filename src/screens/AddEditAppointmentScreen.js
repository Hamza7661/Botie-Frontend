import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 400;
import { TextInput, Button, Checkbox, Searchbar } from 'react-native-paper';
import { tasksAPI, remindersAPI, customerAPI, TaskType } from '../services/api';
import Preloader from '../components/Preloader';
import { showToast } from '../utils/toast';
import { validatePhone } from '../utils/validation';
import CustomPhoneInput from '../components/PhoneInput';
import MapPicker from '../components/MapPicker';
import DateTimePicker from '../components/DateTimePicker';
import { MiniTabSelector } from '../components/TabSelector';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isGooglePlacesAvailable, GOOGLE_PLACES_API_KEY } from '../config/google';
import { getFullE164Phone } from '../components/PhoneInput';

const AddEditAppointmentScreen = ({ navigation, route }) => {
  const { appointmentId, isEditing, taskType } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    heading: '',
    summary: '',
    description: '',
    reminderDateTime: null,
    coordinates: null,
    isResolved: false,
    customer: {
      name: '',
      address: '',
      phoneNumber: '',
      selectedCountry: null,
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

  useEffect(() => {
    let title = '';
    if (isEditing) {
      title = taskType === TaskType.REMINDER ? 'Edit Reminder' : 'Edit Appointment';
    } else {
      title = taskType === TaskType.REMINDER ? 'Add Reminder' : 'Add Appointment';
    }
    navigation.setOptions({ title });
  }, [isEditing, taskType, navigation]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      let response;
      
      if (taskType === TaskType.REMINDER) {
        response = await remindersAPI.getReminderById(appointmentId);
      } else {
        response = await tasksAPI.getTaskById(appointmentId);
      }
      
      const item = response.data.data;
      
      if (taskType === TaskType.REMINDER) {
        // Handle reminder data structure
        setFormData({
          heading: item.description || '',
          summary: item.locationName || '',
          description: item.description || '',
          reminderDateTime: item.reminderDateTime ? new Date(item.reminderDateTime) : null,
          coordinates: item.coordinates || null,
          isResolved: false, // Reminders don't have resolved status
          customer: {
            name: '',
            address: '',
            phoneNumber: '',
          },
        });
      } else {
        // Handle appointment data structure
        setFormData({
          heading: item.heading || '',
          summary: item.summary || '',
          description: item.description || '',
          isResolved: item.isResolved || false,
          customer: {
            name: item.customer?.name || '',
            address: item.customer?.address || '',
            phoneNumber: item.customer?.phoneNumber || '',
            selectedCountry: null,
          },
        });
      }
    } catch (error) {
      // Check if it's a 401 unauthorized error
      if (error.response?.status === 401) {
        showToast.error('Session expired. Please login to continue.');
      } else {
        showToast.error('Failed to load appointment/reminder');
      }
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
        selectedCountry: null,
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
        selectedCountry: null,
      },
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (taskType === TaskType.REMINDER) {
      // Reminder validation
      if (!formData.description.trim()) {
        newErrors.description = String('Description is required');
      }
      
      if (formData.reminderDateTime && formData.reminderDateTime < new Date()) {
        newErrors.reminderDateTime = String('Reminder date and time must be in the future');
      }

      // Location validation: either coordinates OR location name is required
      if (!formData.coordinates && !formData.summary.trim()) {
        newErrors.coordinates = 'Either location coordinates or location name is required';
      }
    } else {
      // Appointment validation
      if (!formData.heading.trim()) {
        newErrors.heading = String('Heading is required');
      } else if (formData.heading.trim().length < 3) {
        newErrors.heading = String('Heading must be at least 3 characters');
      }

      if (!formData.summary.trim()) {
        newErrors.summary = String('Summary is required');
      } else if (formData.summary.trim().length < 10) {
        newErrors.summary = String('Summary must be at least 10 characters');
      }

      if (!formData.description.trim()) {
        newErrors.description = String('Description is required');
      }

      // Customer validation only for appointments
      if (!formData.customer.name.trim()) {
        newErrors.customerName = String('Customer name is required');
      } else if (formData.customer.name.trim().length < 2) {
        newErrors.customerName = String('Customer name must be at least 2 characters');
      }

      if (!formData.customer.phoneNumber.trim()) {
        newErrors.customerPhone = String('Customer phone number is required');
      } else {
        const phoneError = validatePhone(formData.customer.phoneNumber);
        if (phoneError) {
          newErrors.customerPhone = String(phoneError);
        }
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).filter(key => key !== 'coordinates').length === 0;
    console.log('Validation errors:', newErrors);
    console.log('Form is valid:', isValid);
    return isValid;
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
    // Mark relevant fields as touched based on task type
    if (taskType === TaskType.REMINDER) {
      setTouched({
        description: true,
        reminderDateTime: true,
      });
    } else {
      setTouched({
        heading: true,
        summary: true,
        description: true,
        customerName: true,
        customerPhone: true,
      });
    }

    console.log('Form validation - coordinates:', formData.coordinates);
    console.log('Form validation - summary:', formData.summary);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form validation passed, proceeding with API call');
    setLoading(true);
    try {
      if (taskType === TaskType.REMINDER) {
        // Handle reminder data structure
        const reminderData = {
          description: formData.description,
          locationName: formData.summary,
          reminderDateTime: formData.reminderDateTime ? formData.reminderDateTime.toISOString() : null, // Already in UTC
        };

        // Add coordinates if available
        if (formData.coordinates) {
          reminderData.coordinates = formData.coordinates;
        }

        console.log('Reminder data to save:', reminderData);

        if (isEditing) {
          console.log('Updating reminder with ID:', appointmentId);
          const response = await remindersAPI.updateReminder(appointmentId, reminderData);
          const message = response?.data?.message || 'Reminder updated successfully';
          showToast.success(String(message));
        } else {
          console.log('Creating new reminder');
          const response = await remindersAPI.createReminder(reminderData);
          const message = response?.data?.message || 'Reminder created successfully';
          showToast.success(String(message));
        }
      } else {
        // Handle appointment data structure - exclude reminder-specific fields
        const appointmentData = {
          heading: formData.heading,
          summary: formData.summary,
          description: formData.description,
          isResolved: formData.isResolved,
          customer: formData.customer,
        };
        
        // Concatenate country code with phone number before sending to API
        const country = formData.customer.selectedCountry || { code: 'US', dial_code: '+1', flag: '🇺🇸', name: 'United States' };
        const fullPhoneNumber = getFullE164Phone(formData.customer.phoneNumber, country);
        
        // Create customer data without selectedCountry (API doesn't need it)
        const { selectedCountry, ...customerData } = formData.customer;
        appointmentData.customer = {
          ...customerData,
          phoneNumber: fullPhoneNumber,
        };
        
        console.log('Appointment data to save:', appointmentData);
        
        if (isEditing) {
          console.log('Updating appointment with ID:', appointmentId);
          const response = await tasksAPI.updateTask(appointmentId, appointmentData);
          const message = response?.data?.message || 'Appointment updated successfully';
          showToast.success(String(message));
        } else {
          console.log('Creating new appointment');
          const response = await tasksAPI.createTask(appointmentData);
          const message = response?.data?.message || 'Appointment created successfully';
          showToast.success(String(message));
        }
      }
      // Use goBack for updates to preserve the page, navigate for new items
      if (isEditing) {
        navigation.goBack();
      } else {
        navigation.navigate('Dashboard');
      }
    } catch (error) {
      console.log('Error during save:', error);
      console.log('Error response:', error.response);
      console.log('Error message:', error.message);
      
      // Check if it's a 401 unauthorized error
      if (error.response?.status === 401) {
        showToast.error('Session expired. Please login to continue.');
      } else {
        const errorMessage = error.response?.data?.message || `Failed to save ${taskType === TaskType.APPOINTMENT ? 'appointment' : 'reminder'}`;
        showToast.error(String(errorMessage));
      }
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
    
    // Special handling for phone number input
    if (field === 'phoneNumber') {
      return (
        <View style={{...styles.inputContainer, zIndex: 10}}>
          <CustomPhoneInput
            value={value}
            onChangeText={(text, country) => {
              updateFormData(`customer.${field}`, text);
              updateFormData('customer.selectedCountry', country);
            }}
            error={errors[errorField]}
            placeholder="Enter customer phone number"
            disabled={options.disabled}
            selectedCountry={formData.customer.selectedCountry}
          />
        </View>
      );
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

  const handleMiniTabChange = async (newTab) => {
    if (newTab === taskType) return;
    await AsyncStorage.setItem('dashboard_tab_selection', String(newTab));
    console.log('MiniTabSelector set dashboard_tab_selection:', newTab);
    navigation.replace('AddEditAppointment', {
      taskType: newTab,
      isEditing: false,
    });
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
              {!isEditing && (
                <View style={{ alignItems: 'center', marginBottom: 8 }}>
                  <MiniTabSelector
                    selectedTab={taskType}
                    onTabChange={handleMiniTabChange}
                  />
                </View>
              )}
              <Text style={styles.title}>
                {isEditing 
                  ? `Edit ${taskType === TaskType.APPOINTMENT ? 'Appointment' : 'Reminder'}`
                  : `Add New ${taskType === TaskType.APPOINTMENT ? 'Appointment' : 'Reminder'}`
                }
              </Text>

              {taskType === TaskType.REMINDER ? (
                <>
                  {renderInput('description', 'Description', {
                    multiline: true,
                    numberOfLines: 4
                  })}
                  
                  {/* DateTime Picker for Reminders */}
                  <DateTimePicker
                    value={formData.reminderDateTime}
                    onChange={(date) => updateFormData('reminderDateTime', date)}
                    label="Reminder Date & Time"
                    error={errors.reminderDateTime}
                    touched={touched.reminderDateTime}
                  />
                  
                  {/* Map Picker for Reminders */}
                  <MapPicker
                    value={formData.coordinates}
                    onChange={locationData => {
                      console.log('MapPicker onChange - locationData:', locationData);
                      console.log('MapPicker onChange - current formData.coordinates:', formData.coordinates);
                      
                      if (!locationData) {
                        console.log('MapPicker - clearing coordinates');
                        setFormData({
                          ...formData,
                          coordinates: null,
                          summary: ''
                        });
                      } else {
                        console.log('MapPicker - setting coordinates:', locationData);
                        setFormData({ 
                          ...formData, 
                          coordinates: {
                            latitude: locationData.latitude,
                            longitude: locationData.longitude
                          },
                          // Auto-populate location name if available
                          summary: locationData.locationName ? locationData.locationName : formData.summary
                        });
                      }
                      // Clear location error if set
                      if (errors.coordinates) {
                        setErrors(prev => ({ ...prev, coordinates: undefined }));
                      }
                    }}
                    initialLocationName={formData.summary}
                  />
                  {errors.coordinates && (
                    <Text style={styles.errorText}>{errors.coordinates}</Text>
                  )}
                </>
              ) : (
                <>
                  {renderInput('heading', 'Heading')}
                  {renderInput('summary', 'Summary')}
                  {renderInput('description', 'Description', {
                    multiline: true,
                    numberOfLines: 4
                  })}
                </>
              )}

              {taskType === TaskType.APPOINTMENT && (
                <>
                  <Text style={styles.sectionTitle}>Customer Information</Text>

                  {/* Customer Search */}
                  <View style={styles.customerSearchContainer}>
                    <Text style={styles.searchLabel}>Search Existing Customer to Link</Text>
                    <Searchbar
                      placeholder="Search by name or phone..."
                      onChangeText={handleCustomerSearch}
                      value={customerSearchQuery}
                      style={styles.customerSearchBar}
                      iconColor="#007bff"
                      inputStyle={{ fontSize: isSmallScreen ? 14 : 16 }}
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
                </>
              )}

              {isEditing && taskType === TaskType.APPOINTMENT && (
                <View style={styles.checkboxContainer}>
                  <Text style={styles.sectionTitle}>Status</Text>
                  <View style={styles.checkboxRow}>
                    {Platform.OS === 'web' ? (
                      <Checkbox
                        status={formData.isResolved ? 'checked' : 'unchecked'}
                        onPress={() => updateFormData('isResolved', !formData.isResolved)}
                        color="#007bff"
                      />
                    ) : (
                      <View style={{
                        borderWidth: 2,
                        borderColor: '#007bff',
                        borderRadius: 4,
                        padding: 2,
                      }}>
                        <Checkbox
                          status={formData.isResolved ? 'checked' : 'unchecked'}
                          onPress={() => updateFormData('isResolved', !formData.isResolved)}
                          color="#007bff"
                        />
                      </View>
                    )}
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
    padding: isSmallScreen ? 8 : 10,
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
    padding: isSmallScreen ? 16 : 24,
  },
  formContent: {
    width: '100%',
  },
  title: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: isSmallScreen ? 16 : 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: isSmallScreen ? 16 : 20,
    marginBottom: isSmallScreen ? 8 : 12,
  },
  inputContainer: {
    marginBottom: isSmallScreen ? 12 : 16,
  },
  input: {
    backgroundColor: '#ffffff',
    fontSize: isSmallScreen ? 14 : 16,
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
    opacity: 0.9,
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: isSmallScreen ? 11 : 12,
    marginTop: isSmallScreen ? 3 : 4,
    marginLeft: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: isSmallScreen ? 16 : 20,
    gap: isSmallScreen ? 8 : 12,
  },
  button: {
    minWidth: isSmallScreen ? 100 : 120,
    maxWidth: isSmallScreen ? 150 : 200,
    marginHorizontal: isSmallScreen ? 3 : 5,
  },
  cancelButton: {
    borderColor: '#666666',
  },
  saveButton: {
    backgroundColor: '#007bff',
    color: '#fff',
  },
  checkboxContainer: {
    marginTop: isSmallScreen ? 16 : 20,
    marginBottom: isSmallScreen ? 8 : 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: isSmallScreen ? 6 : 8,
  },
  checkboxLabel: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#333333',
    marginLeft: 8,
  },
  customerSearchContainer: {
    marginBottom: isSmallScreen ? 16 : 20,
  },
  searchLabel: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: isSmallScreen ? 6 : 8,
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
    padding: isSmallScreen ? 10 : 12,
  },
  dropdownText: {
    fontSize: isSmallScreen ? 14 : 16,
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
    fontSize: isSmallScreen ? 14 : 16,
    color: '#333333',
    marginRight: 8,
  },
  clearSelectionButton: {
    padding: isSmallScreen ? 6 : 8,
  },
  clearSelectionText: {
    fontSize: isSmallScreen ? 14 : 16,
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