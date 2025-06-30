import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import webSocketService from '../services/websocketService';
import { showToast } from '../utils/toast';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    reconnectAttempts: 0,
  });

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      webSocketService.connect(user._id);
      
      // Update connection status
      const updateStatus = () => {
        setConnectionStatus(webSocketService.getConnectionStatus());
      };

      // Initial status update
      updateStatus();

      // Set up periodic status checks
      const statusInterval = setInterval(updateStatus, 5000);

      return () => {
        clearInterval(statusInterval);
      };
    } else if (!isAuthenticated) {
      console.log('Disconnecting WebSocket - user not authenticated');
      webSocketService.disconnect();
      setConnectionStatus({ isConnected: false, reconnectAttempts: 0 });
    }
  }, [isAuthenticated, user?._id]);

  // Listen for WebSocket events and show notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleTaskCreated = (data) => {
      // Don't show toast for WebSocket updates - user already knows they created the task
    };

    const handleTaskUpdated = (data) => {
      // Don't show toast for WebSocket updates - user already knows they updated the task
    };

    const handleTaskDeleted = (data) => {
      // Don't show toast for WebSocket updates - user already knows they deleted the task
    };

    const handleCustomerCreated = (data) => {
      // Don't show toast for WebSocket updates - user already knows they created the customer
    };

    const handleCustomerUpdated = (data) => {
      // Don't show toast for WebSocket updates - user already knows they updated the customer
    };

    const handleCustomerDeleted = (data) => {
      // Don't show toast for WebSocket updates - user already knows they deleted the customer
    };

    // Register event listeners
    webSocketService.on('task-created', handleTaskCreated);
    webSocketService.on('task-updated', handleTaskUpdated);
    webSocketService.on('task-deleted', handleTaskDeleted);
    webSocketService.on('customer-created', handleCustomerCreated);
    webSocketService.on('customer-updated', handleCustomerUpdated);
    webSocketService.on('customer-deleted', handleCustomerDeleted);

    // Cleanup event listeners
    return () => {
      webSocketService.off('task-created', handleTaskCreated);
      webSocketService.off('task-updated', handleTaskUpdated);
      webSocketService.off('task-deleted', handleTaskDeleted);
      webSocketService.off('customer-created', handleCustomerCreated);
      webSocketService.off('customer-updated', handleCustomerUpdated);
      webSocketService.off('customer-deleted', handleCustomerDeleted);
    };
  }, [isAuthenticated]);

  const value = {
    connectionStatus,
    webSocketService,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}; 