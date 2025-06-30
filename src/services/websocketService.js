import io from 'socket.io-client';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig.extra.apiBaseUrl;
// For WebSocket, we need the root URL without /api path
const WS_BASE_URL = API_BASE_URL.replace('/api', '');

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
  }

  connect(userId) {
    if (this.socket && this.isConnected) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      // Create socket connection to root namespace
      this.socket = io(WS_BASE_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      });

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Join user's personal room
        if (userId) {
          this.socket.emit('join-user-room', userId);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.isConnected = false;
        
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          this.attemptReconnect(userId);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.isConnected = false;
        this.attemptReconnect(userId);
      });

      // Task events
      this.socket.on('task-created', (data) => {
        this.emitEvent('task-created', data);
      });

      this.socket.on('task-updated', (data) => {
        this.emitEvent('task-updated', data);
      });

      this.socket.on('task-deleted', (data) => {
        this.emitEvent('task-deleted', data);
      });

      // Customer events
      this.socket.on('customer-created', (data) => {
        console.log('Customer created:', data);
        this.emitEvent('customer-created', data);
      });

      this.socket.on('customer-updated', (data) => {
        console.log('Customer updated:', data);
        this.emitEvent('customer-updated', data);
      });

      this.socket.on('customer-deleted', (data) => {
        console.log('Customer deleted:', data);
        this.emitEvent('customer-deleted', data);
      });

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  attemptReconnect(userId) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (!this.isConnected) {
        this.connect(userId);
      }
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
      console.log('WebSocket disconnected');
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emitEvent(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();
export default webSocketService; 