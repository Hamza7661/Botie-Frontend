import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { TaskType } from '../services/api';

const TabSelector = ({ selectedTab, onTabChange, theme }) => {
  const tabs = [
    { id: TaskType.APPOINTMENT, label: 'Appointments', icon: '📅' },
    { id: TaskType.REMINDER, label: 'Reminders', icon: '⏰' },
  ];

  const slideAnim = useRef(new Animated.Value(0)).current;
  const activeTabIndex = tabs.findIndex(tab => tab.id === selectedTab);
  const [containerWidth, setContainerWidth] = React.useState(0);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTabIndex,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [selectedTab, activeTabIndex, slideAnim]);

  return (
    <View style={styles.container}>
      <View 
        style={styles.tabContainer}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setContainerWidth(width);
        }}
      >
        {/* Animated sliding background */}
        <Animated.View
          style={[
            styles.slidingBackground,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, containerWidth * 0.5], // Use half the container width
                  }),
                },
              ],
            },
          ]}
        />
        
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              { width: '50%' },
            ]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.8}
            delayPressIn={0}
          >
            <View style={styles.tabContent}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  selectedTab === tab.id && styles.activeTabLabel,
                ]}
              >
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  slidingBackground: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: '#007bff',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1,
    width: '48%',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabLabel: {
    color: '#ffffff',
  },
});

export const MiniTabSelector = ({ selectedTab, onTabChange, theme, style }) => {
  const tabs = [
    { id: TaskType.APPOINTMENT, label: 'Appointments', icon: '📅' },
    { id: TaskType.REMINDER, label: 'Reminders', icon: '⏰' },
  ];
  return (
    <View style={[miniStyles.container, style]}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[miniStyles.tab, selectedTab === tab.id && miniStyles.activeTab]}
          onPress={() => onTabChange(tab.id)}
        >
          <Text style={[miniStyles.tabText, selectedTab === tab.id && miniStyles.activeTabText]}>
            {tab.icon} {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const miniStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4fa',
    borderRadius: 16,
    padding: 2,
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 8,
    marginRight: 8,
  },
  tab: {
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#007bff',
  },
  tabText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
});

export default TabSelector; 