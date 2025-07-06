import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

// Import global styles for web
import './src/styles/global.css';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AppointmentDetailScreen from './src/screens/AppointmentDetailScreen';
import AddEditAppointmentScreen from './src/screens/AddEditAppointmentScreen';

// Import context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WebSocketProvider } from './src/context/WebSocketContext';

const Stack = createStackNavigator();

// Loading Screen Component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007bff" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// Updated theme with white as primary and blue as secondary
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007bff',
    background: '#ffffff',
    surface: '#ffffff',
    text: '#333333',
    placeholder: '#666666',
    border: '#e0e0e0',
    accent: '#007bff',
    card: '#ffffff',
    level3: '#f4f4f4',
  },
};

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          // Auth screens
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
              options={{ title: 'Create Account' }}
            />
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPasswordScreen} 
              options={{ title: 'Forgot Password' }}
            />
            <Stack.Screen 
              name="ResetPassword" 
              component={ResetPasswordScreen} 
              options={{ title: 'Reset Password' }}
            />
          </>
        ) : (
          // Main app screens
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
              options={{ 
                headerTitle: () => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#fff',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 8,
                      }}
                    >
                      <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 20 }}>B</Text>
                    </View>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>Botie</Text>
                  </View>
                ),
                headerStyle: {
                  backgroundColor: '#007bff',
                },
                headerTitleAlign: 'center',
              }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ title: 'Profile' }}
            />
            <Stack.Screen 
              name="AppointmentDetail" 
              component={AppointmentDetailScreen} 
              options={{ title: 'Appointment Details' }}
            />
            <Stack.Screen 
              name="AddEditAppointment" 
              component={AddEditAppointmentScreen} 
              options={{ title: 'Add Appointment' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
});

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <WebSocketProvider>
          <AppNavigator />
          <StatusBar style="dark" />
          <Toast />
        </WebSocketProvider>
      </AuthProvider>
    </PaperProvider>
  );
} 