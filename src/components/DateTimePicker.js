import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import ReactDOM from 'react-dom';

const WebDateTimePicker = ({ value, onChange, label, error, touched }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setTempDate(selectedDate);
      onChange(selectedDate);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Modal content for portal
  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.4)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={() => setShowPicker(false)}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 24,
          minWidth: 320,
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Select Date & Time</div>
        <input
          type="datetime-local"
          value={tempDate.getFullYear() + '-' + 
                 String(tempDate.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(tempDate.getDate()).padStart(2, '0') + 'T' + 
                 String(tempDate.getHours()).padStart(2, '0') + ':' + 
                 String(tempDate.getMinutes()).padStart(2, '0')}
          onChange={e => {
            const newDate = new Date(e.target.value);
            setTempDate(newDate);
            onChange(newDate);
          }}
          style={{ width: '100%', padding: 8, fontSize: 16, marginBottom: 16 }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => setShowPicker(false)}>Cancel</button>
          <button
            onClick={() => {
              onChange(tempDate);
              setShowPicker(false);
            }}
            style={{ background: '#007bff', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4 }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShowPicker(true)}>
        <TextInput
          label={label}
          value={formatDate(value)}
          mode="outlined"
          style={[styles.input, error && touched && styles.inputError]}
          error={!!(error && touched)}
          right={<TextInput.Icon icon="calendar" />}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>
      {showPicker && ReactDOM.createPortal(modalContent, document.body)}
      {error && touched && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const MobileDateTimePicker = ({ value, onChange, label, error, touched }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('datetime');

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShowPicker(true)}>
        <TextInput
          label={label}
          value={formatDate(value)}
          mode="outlined"
          style={[styles.input, error && touched && styles.inputError]}
          error={!!(error && touched)}
          right={<TextInput.Icon icon="calendar" />}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>
      {showPicker && (
        <RNDateTimePicker
          value={value || new Date()}
          mode={pickerMode}
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
      {error && touched && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const DateTimePicker = (props) => {
  if (Platform.OS === 'web') {
    return <WebDateTimePicker {...props} />;
  }
  return <MobileDateTimePicker {...props} />;
};

const styles = StyleSheet.create({
  container: {
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
    marginLeft: 12,
  },
  // Web-specific styles
  webPickerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webPickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    minWidth: 300,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  webPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  webPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
    cursor: 'pointer',
  },
  webDateTimeInput: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    fontSize: 16,
    marginBottom: 16,
  },
  webPickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#007bff',
  },
});

export default DateTimePicker; 