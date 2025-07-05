import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Card, Button, Searchbar, FAB, IconButton } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { tasksAPI, remindersAPI, TaskType } from '../services/api';
import { useTheme } from 'react-native-paper';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { usePagination } from '../hooks/usePagination';
import { showToast } from '../utils/toast';
import { TabStorage } from '../utils/storage';
import TabSelector from '../components/TabSelector';

// Module-level variable to store dashboard page
let savedDashboardPage = null;

// Memoized Searchbar component
const AppointmentsSearchbar = React.memo(({ value, onChangeText, onSubmitEditing, theme, style, selectedTab }) => (
  <Searchbar
    placeholder={`Search ${selectedTab === TaskType.APPOINTMENT ? 'appointments' : 'reminders'}...`}
    onChangeText={onChangeText}
    value={value}
    onSubmitEditing={onSubmitEditing}
    style={[style, { borderWidth: 1, borderColor: '#000', borderRadius: 8, backgroundColor: '#fff' }]}
    iconColor="#007bff"
    theme={theme}
  />
));

// Memoized Header component
const HeaderComponent = React.memo(({ user, handleLogout, handleProfile, searchQuery, setSearchQuery, handleSearch, appointments, totalAppointments, selectedTab, onTabChange, theme, styles }) => (
  <View style={styles.headerCard}>
    <View style={styles.headerContent}>
      <View style={styles.userInfo}>
        <Text style={styles.greeting}>
          Welcome, {user?.firstname || 'User'}!
        </Text>
        <Text style={styles.subtitle}>
          Manage your appointments and stay organized
        </Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={handleProfile} style={styles.profileButton}>
          <Text style={styles.profileText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
    {/* Twilio Phone Number Display */}
    <View style={styles.phoneSection}>
      <Text style={styles.phoneLabel}>Your Assigned Number:</Text>
      <Text style={styles.phoneNumber}>
        {user?.twilioPhoneNumber || 'Not assigned'}
      </Text>
    </View>
    {/* Search Bar */}
    <View style={styles.searchContainer}>
      <AppointmentsSearchbar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
        style={styles.searchBar}
        theme={theme}
        selectedTab={selectedTab}
      />
    </View>
    {/* Tab Selector */}
    <TabSelector
      selectedTab={selectedTab}
      onTabChange={onTabChange}
      theme={theme}
    />
    {/* Appointments Header */}
    <View style={styles.appointmentsHeader}>
      <Text style={styles.appointmentsTitle}>
        Your {selectedTab === TaskType.APPOINTMENT ? 'Appointments' : 'Reminders'}
      </Text>
      <Text style={styles.appointmentsCount} numberOfLines={1} ellipsizeMode="tail">
        {totalAppointments} {selectedTab === TaskType.APPOINTMENT ? 'appointment' : 'reminder'}{totalAppointments !== 1 ? 's' : ''}
      </Text>
    </View>
  </View>
));

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { webSocketService, connectionStatus } = useWebSocket();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(null);
  const debounceTimeout = useRef();
  const route = useRoute();
  const lastSearchQuery = useRef(searchQuery);
  const initialLoadDone = useRef(false);
  const [tabSwitching, setTabSwitching] = useState(false);

  const limit = 2;

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchTasks = useCallback((params) => {
    if (selectedTab === TaskType.APPOINTMENT) {
      return tasksAPI.getTasks(params);
    } else {
      // Default to reminders (TaskType.REMINDER or null)
      return remindersAPI.getReminders(params);
    }
  }, [selectedTab]);

  // Create a dummy function for when selectedTab is null
  const dummyFetch = useCallback(() => {
    return Promise.resolve({ data: { data: { tasks: [], pagination: { totalPages: 1, totalTasks: 0 } } } });
  }, []);

  // Use the pagination hook with type parameter
  const {
    data: appointments,
    loading,
    setLoading,
    refreshing,
    currentPage,
    totalPages,
    totalItems: totalAppointments,
    hasMore,
    error,
    loadData,
    refresh,
    loadMore,
    goToPage,
    reset,
  } = usePagination(selectedTab !== null ? fetchTasks : dummyFetch, 1, limit);

  // Load selected tab from storage on component mount and when screen comes into focus
  useEffect(() => {
    const loadSelectedTab = async () => {
      const storedTab = await TabStorage.getSelectedTab();
      setSelectedTab(storedTab);
    };
    loadSelectedTab();
  }, []);

  // Initial data load
  useEffect(() => {
    if (!initialLoadDone.current && selectedTab !== null) {
      initialLoadDone.current = true;
      refresh(searchQuery);
    }
  }, [selectedTab, refresh, searchQuery]);

  // Handle tab change
  const handleTabChange = async (newTab) => {
    if (newTab !== selectedTab) {
      setSelectedTab(newTab);
      await TabStorage.setSelectedTab(newTab);
      // Reset to first page when changing tabs
      reset();
    }
  };

  // WebSocket event handlers for real-time updates
  useEffect(() => {
    const handleTaskCreated = (data) => {
      // Refresh the current page to show the new task
      refresh(searchQuery);
    };

    const handleTaskUpdated = (data) => {
      // Refresh the current page to show updated task
      refresh(searchQuery);
    };

    const handleTaskDeleted = (data) => {
      // Refresh the current page to remove deleted task
      refresh(searchQuery);
    };

    // Register WebSocket event listeners
    webSocketService.on('task-created', handleTaskCreated);
    webSocketService.on('task-updated', handleTaskUpdated);
    webSocketService.on('task-deleted', handleTaskDeleted);

    // Cleanup event listeners
    return () => {
      webSocketService.off('task-created', handleTaskCreated);
      webSocketService.off('task-updated', handleTaskUpdated);
      webSocketService.off('task-deleted', handleTaskDeleted);
    };
  }, [webSocketService, refresh, searchQuery]);

  // Debounced search effect
  useEffect(() => {
    if (lastSearchQuery.current === searchQuery) {
      return;
    }
    lastSearchQuery.current = searchQuery;
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      refresh(searchQuery);
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [searchQuery, refresh]);

  // Handle errors
  useEffect(() => {
    if (error) {
      // Check if it's a 401 unauthorized error
      if (error.response?.status === 401) {
        showToast.error('Session expired. Please login to continue.');
      } else {
      showToast.error('Failed to load appointments');
      }
    }
  }, [error]);

  const handleRefresh = () => {
    refresh(searchQuery);
  };

  const handleLoadMore = () => {
    loadMore(searchQuery);
  };

  const handleSearch = () => {
    refresh(searchQuery);
  };

  const handleLogout = () => {
    logout();
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  // Combined focus effect: handle saved page restoration and tab changes
  useFocusEffect(
    React.useCallback(() => {
      // Always refresh data when dashboard comes into focus
      refresh(searchQuery);

      // Restore saved page if needed
      if (savedDashboardPage) {
        goToPage(savedDashboardPage, searchQuery);
        savedDashboardPage = null;
      }

      // Check for tab change
      (async () => {
        const storedTab = await TabStorage.getSelectedTab();
        if (storedTab !== selectedTab) {
          setSelectedTab(storedTab);
          reset();
        }
      })();
    }, [searchQuery, selectedTab, reset, refresh, goToPage])
  );

  useEffect(() => {
    if (selectedTab !== null && initialLoadDone.current) {
      setTabSwitching(true);
      loadData(1, true, searchQuery).finally(() => setTabSwitching(false));
    }
  }, [selectedTab, loadData, searchQuery]);

  const renderAppointmentCard = ({ item }) => (
    <Card style={styles.appointmentCard} mode="outlined">
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.appointmentTitle} numberOfLines={1}>
            {selectedTab === TaskType.REMINDER ? item.description : item.heading}
          </Text>
          <View style={styles.cardActions}>
            <IconButton
              icon="eye"
              size={20}
              iconColor="#007bff"
              onPress={() => {
                savedDashboardPage = currentPage;
                navigation.navigate('AppointmentDetail', { 
                  appointmentId: item._id,
                  taskType: selectedTab
                });
              }}
            />
            <IconButton
              icon="pencil"
              size={20}
              iconColor="#007bff"
              onPress={() => {
                savedDashboardPage = currentPage;
                navigation.navigate('AddEditAppointment', { 
                  appointmentId: item._id,
                  isEditing: true,
                  taskType: selectedTab
                });
              }}
            />
          </View>
        </View>
        
        <Text style={styles.appointmentSummary} numberOfLines={2}>
          {selectedTab === TaskType.REMINDER 
            ? (item.locationName ? `📍 ${item.locationName}` : item.description)
            : item.summary
          }
        </Text>
        
        {selectedTab === TaskType.REMINDER && item.reminderDateTime && (
          <Text style={styles.reminderDateTime}>
            ⏰ {new Date(item.reminderDateTime).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </Text>
        )}
        
        {selectedTab === TaskType.APPOINTMENT && item.customer && (
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              Customer: {item.customer.name}
            </Text>
            <Text style={styles.customerPhone}>
              {item.customer.phoneNumber}
            </Text>
          </View>
        )}
        
        <View style={styles.appointmentFooter}>
          <Text style={styles.appointmentDate}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          {selectedTab === TaskType.APPOINTMENT && (
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
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderFooter = () => {
    // Only show footer loading when there's data (for pagination)
    if (!loading || appointments.length === 0) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#007bff" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const renderLoadingState = () => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginVertical: 32,
      }}
    >
      <ActivityIndicator size="small" color="#007bff" />
      <Text style={{ marginLeft: 10, fontSize: 16, color: '#666' }}>
        Loading {selectedTab === TaskType.APPOINTMENT ? 'appointments' : 'reminders'}...
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <Card style={styles.emptyCard} mode="outlined">
      <Card.Content style={styles.emptyCardContent}>
        <Text style={styles.emptyIcon}>
          {selectedTab === TaskType.APPOINTMENT ? '📅' : '⏰'}
        </Text>
        <Text style={styles.emptyTitle}>
          No {selectedTab === TaskType.APPOINTMENT ? 'Appointments' : 'Reminders'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery.trim() 
            ? `No ${selectedTab === TaskType.APPOINTMENT ? 'appointments' : 'reminders'} found for "${searchQuery}"`
            : `You don't have any ${selectedTab === TaskType.APPOINTMENT ? 'appointments' : 'reminders'} yet`
          }
        </Text>
        <Text style={styles.emptyAction}>
          Tap the + button to create your first {selectedTab === TaskType.APPOINTMENT ? 'appointment' : 'reminder'}
        </Text>
      </Card.Content>
    </Card>
  );

  // Reset pagination state on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        <FlatList
          data={appointments}
          renderItem={renderAppointmentCard}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={
            <HeaderComponent
              user={user}
              handleLogout={handleLogout}
              handleProfile={handleProfile}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
              appointments={appointments}
              totalAppointments={totalAppointments}
              selectedTab={selectedTab}
              onTabChange={handleTabChange}
              theme={theme}
              styles={styles}
            />
          }
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.whiteListContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={loading || tabSwitching ? renderLoadingState : renderEmptyState}
        />

        {/* Pagination Controls - Always show, even if only 1 page */}
        <View style={styles.paginationCard}>
          <View style={styles.paginationBar}>
            <TouchableOpacity
              onPress={() => currentPage > 1 && goToPage(currentPage - 1, searchQuery)}
            disabled={currentPage <= 1}
              style={[styles.arrowButton, currentPage <= 1 && styles.arrowButtonDisabled]}
            >
              <Text style={[styles.arrowText, currentPage <= 1 && styles.arrowTextDisabled]}>&lt;</Text>
            </TouchableOpacity>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <TouchableOpacity
                key={page}
                style={[
                  styles.pagePill,
                  page === currentPage ? styles.pagePillActive : styles.pagePillInactive
                ]}
                onPress={() => page !== currentPage && goToPage(page, searchQuery)}
              >
                <Text style={[
                  styles.pagePillText,
                  page === currentPage ? styles.pagePillTextActive : styles.pagePillTextInactive
                ]}>
                {page}
              </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => currentPage < totalPages && goToPage(currentPage + 1, searchQuery)}
              disabled={currentPage >= totalPages}
              style={[styles.arrowButton, currentPage >= totalPages && styles.arrowButtonDisabled]}
            >
              <Text style={[styles.arrowText, currentPage >= totalPages && styles.arrowTextDisabled]}>&gt;</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAB for adding new appointment/reminder */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => {
            navigation.navigate('AddEditAppointment', { 
              isEditing: false,
              taskType: selectedTab 
            });
          }}
          color="#ffffff"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mainContainer: {
    flex: 1,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
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
  listContainer: {
    paddingBottom: 80,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 15,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  logoutText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  phoneSection: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
    marginBottom: 20,
  },
  phoneLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    backgroundColor: '#ffffff',
    elevation: 2,
    borderRadius: 8,
  },
  appointmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    marginRight: 10,
  },
  appointmentsCount: {
    fontSize: 14,
    color: '#666666',
    flexShrink: 1,
    textAlign: 'right',
  },
  appointmentCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#fff',
  },
  cardContent: {
    justifyContent: 'center',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    marginRight: 10,
  },
  cardActions: {
    flexDirection: 'row',
  },
  appointmentSummary: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  customerInfo: {
    marginBottom: 8,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
  },
  customerPhone: {
    fontSize: 12,
    color: '#666666',
  },
  reminderDateTime: {
    fontSize: 13,
    color: '#007bff',
    fontWeight: '500',
    marginBottom: 8,
  },
  appointmentDate: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fab: {
    position: 'fixed',
    margin: 16,
    right: 0,
    bottom: 20,
    width: 'max-content',
    backgroundColor: '#007bff',
  },
  whiteListContainer: {
    backgroundColor: 'transparent',
    paddingBottom: 0,
  },
  paginationCard: {
    marginHorizontal: 16,
    marginBottom: 25,
    marginTop: 8,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
  },
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  arrowButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  arrowButtonDisabled: {
    backgroundColor: 'transparent',
  },
  arrowText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  arrowTextDisabled: {
    color: '#bbb',
  },
  pagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  pagePillActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  pagePillInactive: {
    backgroundColor: '#fff',
    borderColor: '#007bff',
  },
  pagePillText: {
    fontSize: 16,
    color: '#007bff',
  },
  pagePillTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pagePillTextInactive: {
    color: '#007bff',
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
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
  emptyCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
  },
  emptyCardContent: {
    padding: 20,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    color: '#007bff',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  emptyAction: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#007bff',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  profileText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default DashboardScreen; 