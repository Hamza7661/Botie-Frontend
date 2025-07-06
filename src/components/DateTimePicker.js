import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import { format } from 'date-fns';

const DateTimePicker = ({ value, onChange, label, error, touched }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  // Format date for display
  const getDisplayValue = (date) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd hh:mm a');
  };

  const handleDateConfirm = ({ date }) => {
    setShowDatePicker(false);
    if (date) {
      setTempDate(date);
      setShowTimePicker(true);
    }
  };

  const handleTimeConfirm = ({ hours, minutes }) => {
    setShowTimePicker(false);
    if (typeof hours === 'number' && typeof minutes === 'number') {
      const newDate = new Date(tempDate);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      onChange(newDate);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <TextInput
          label={label}
          value={getDisplayValue(value)}
          mode="outlined"
          style={styles.input}
          error={!!(error && touched)}
          right={
            <TextInput.Icon
              icon="calendar"
              onPress={() => setShowDatePicker(true)}
            />
          }
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>
      <DatePickerModal
        locale="en"
        mode="single"
        visible={showDatePicker}
        onDismiss={() => setShowDatePicker(false)}
        date={value || new Date()}
        onConfirm={handleDateConfirm}
        saveLabel="OK"
        label="First select date, then time"
        animationType="slide"
      />
      <TimePickerModal
        visible={showTimePicker}
        onDismiss={() => setShowTimePicker(false)}
        onConfirm={handleTimeConfirm}
        hours={tempDate.getHours()}
        minutes={tempDate.getMinutes()}
        label="Pick time"
        cancelLabel="Cancel"
        confirmLabel="OK"
        animationType="fade"
      />
      {error && touched && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  input: {
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
});

export default DateTimePicker; 