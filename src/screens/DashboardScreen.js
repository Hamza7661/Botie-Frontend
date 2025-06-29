import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Card, Button, Searchbar, FAB, IconButton } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { tasksAPI } from '../services/api';
import { useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

// Memoized Searchbar component
const AppointmentsSearchbar = React.memo(({ value, onChangeText, onSubmitEditing, theme, style }) => (
  <Searchbar
    placeholder="Search appointments..."
    onChangeText={onChangeText}
    value={value}
    onSubmitEditing={onSubmitEditing}
    style={[style, { borderWidth: 1, borderColor: '#000', borderRadius: 8, backgroundColor: '#fff' }]}
    iconColor="#007bff"
    theme={theme}
  />
));

// Memoized Header component
const HeaderComponent = React.memo(({ user, handleLogout, searchQuery, setSearchQuery, handleSearch, appointments, totalAppointments, theme, styles }) => (
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
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
      />
    </View>
    {/* Appointments Header */}
    <View style={styles.appointmentsHeader}>
      <Text style={styles.appointmentsTitle}>Your Appointments</Text>
      <Text style={styles.appointmentsCount} numberOfLines={1} ellipsizeMode="tail">
        {totalAppointments} appointment{totalAppointments !== 1 ? 's' : ''}
      </Text>
    </View>
  </View>
));

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const debounceTimeout = useRef();
  const isInitialLoad = useRef(true);
  const lastKnownPage = useRef(1);
  const isNavigating = useRef(false);
  const navigationTimeout = useRef();

  const limit = 2;

  const loadAppointments = useCallback(async (page = 1, isRefresh = false) => {
    // Prevent multiple simultaneous calls
    if (loading && !isRefresh) {
      return;
    }
    
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await tasksAPI.getTasks({
        page,
        limit,
        search: searchQuery.trim(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      const { tasks, pagination } = response.data.data;
      const total = pagination.totalPages;
      const totalCount = pagination.totalTasks || 0;

      // Always set appointments and use the page we requested
      setAppointments(tasks);
      setCurrentPage(page);
      lastKnownPage.current = page;
      setTotalPages(total);
      setHasMore(page < total);
      setTotalAppointments(totalCount);
    } catch (error) {
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [searchQuery, loading, currentPage]);

  useEffect(() => {
    loadAppointments();
    isInitialLoad.current = false;
    isNavigating.current = false;
    
    // Cleanup function to clear timeouts
    return () => {
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      loadAppointments(1, true);
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Reset navigation flag when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Set a longer timeout to prevent onEndReached from triggering immediately
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
      navigationTimeout.current = setTimeout(() => {
        isNavigating.current = false;
      }, 2000); // 2 seconds delay
    }, [currentPage])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadAppointments(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading && currentPage < totalPages && !isNavigating.current) {
      const nextPage = currentPage + 1;
      loadAppointments(nextPage);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadAppointments(1, true);
  };

  const handleLogout = () => {
    logout();
  };

  const renderAppointmentCard = ({ item }) => (
    <Card style={styles.appointmentCard} mode="outlined">
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.appointmentTitle} numberOfLines={1}>
            {item.heading}
          </Text>
          <View style={styles.cardActions}>
            <IconButton
              icon="eye"
              size={20}
              iconColor="#007bff"
              onPress={() => {
                isNavigating.current = true;
                // Clear any existing timeout
                if (navigationTimeout.current) {
                  clearTimeout(navigationTimeout.current);
                }
                navigation.navigate('AppointmentDetail', { appointmentId: item._id });
              }}
            />
            <IconButton
              icon="pencil"
              size={20}
              iconColor="#007bff"
              onPress={() => {
                isNavigating.current = true;
                // Clear any existing timeout
                if (navigationTimeout.current) {
                  clearTimeout(navigationTimeout.current);
                }
                navigation.navigate('AddEditAppointment', { 
                  appointmentId: item._id,
                  isEditing: true 
                });
              }}
            />
          </View>
        </View>
        
        <Text style={styles.appointmentSummary} numberOfLines={2}>
          {item.summary}
        </Text>
        
        {item.customer && (
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
        </View>
      </Card.Content>
    </Card>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#007bff" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard} mode="outlined">
      <Card.Content style={styles.emptyCardContent}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No Appointments</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery.trim() 
            ? `No appointments found for "${searchQuery}"`
            : 'You don\'t have any appointments yet'
          }
        </Text>
        <Text style={styles.emptyAction}>
          Tap the + button to create your first appointment
        </Text>
      </Card.Content>
    </Card>
  );

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
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
              appointments={appointments}
              totalAppointments={totalAppointments}
              theme={theme}
              styles={styles}
            />
          }
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.whiteListContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />

        {/* Pagination Controls */}
        <View style={styles.paginationContainer}>
          <IconButton
            icon="chevron-left"
            size={28}
            onPress={() => {
              if (currentPage > 1) loadAppointments(currentPage - 1);
            }}
            disabled={currentPage <= 1}
            style={styles.paginationIcon}
          />
          <View style={styles.pageNumbersContainer}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Text
                key={page}
                style={[
                  styles.pageNumber,
                  page === currentPage && styles.currentPageNumber
                ]}
                onPress={() => page !== currentPage && loadAppointments(page)}
              >
                {page}
              </Text>
            ))}
          </View>
          <IconButton
            icon="chevron-right"
            size={28}
            onPress={() => {
              if (currentPage < totalPages) loadAppointments(currentPage + 1);
            }}
            disabled={currentPage >= totalPages}
            style={styles.paginationIcon}
          />
        </View>

        {/* FAB for adding new appointment */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => {
            isNavigating.current = true;
            // Clear any existing timeout
            if (navigationTimeout.current) {
              clearTimeout(navigationTimeout.current);
            }
            navigation.navigate('AddEditAppointment', { isEditing: false });
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
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 4,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  paginationIcon: {
    marginHorizontal: 8,
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  pageNumber: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 16,
    color: '#007bff',
    borderRadius: 4,
    marginHorizontal: 2,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
    textAlign: 'center',
    minWidth: 32,
    cursor: 'pointer',
  },
  currentPageNumber: {
    backgroundColor: '#007bff',
    color: '#fff',
    borderColor: '#007bff',
    fontWeight: 'bold',
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
});

export default DashboardScreen; 