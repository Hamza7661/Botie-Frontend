import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Button } from 'react-native-paper';

const ConfirmationDialog = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmButtonStyle = 'destructive',
  loading = false,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const isLargeScreen = screenWidth > 768;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, isLargeScreen && styles.dialogLarge]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={onCancel}
              disabled={loading}
              style={[styles.button, styles.cancelButton]}
              textColor="#666666"
            >
              {cancelText}
            </Button>
            <Button
              mode="contained"
              onPress={onConfirm}
              loading={loading}
              disabled={loading}
              style={[
                styles.button,
                confirmButtonStyle === 'destructive' ? styles.destructiveButton : styles.confirmButton
              ]}
              buttonColor={confirmButtonStyle === 'destructive' ? '#e53e3e' : '#007bff'}
            >
              {confirmText}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  dialogLarge: {
    maxWidth: 500,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },
  content: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    borderColor: '#666666',
  },
  confirmButton: {
    backgroundColor: '#007bff',
  },
  destructiveButton: {
    backgroundColor: '#e53e3e',
  },
});

export default ConfirmationDialog; 