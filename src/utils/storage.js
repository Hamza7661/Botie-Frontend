import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskType } from '../services/api';

const TAB_SELECTION_KEY = 'dashboard_tab_selection';

export const TabStorage = {
  // Get the selected tab from storage, default to APPOINTMENT
  getSelectedTab: async () => {
    try {
      const storedTab = await AsyncStorage.getItem(TAB_SELECTION_KEY);
      if (storedTab !== null) {
        const tabValue = parseInt(storedTab, 10);
        // Validate that the stored value is a valid task type
        if (Object.values(TaskType).includes(tabValue)) {
          return tabValue;
        }
      }
      // Default to APPOINTMENT if no valid value is stored
      return TaskType.APPOINTMENT;
    } catch (error) {
      console.error('Error getting selected tab:', error);
      return TaskType.APPOINTMENT;
    }
  },

  // Save the selected tab to storage
  setSelectedTab: async (tabType) => {
    try {
      await AsyncStorage.setItem(TAB_SELECTION_KEY, tabType.toString());
    } catch (error) {
      console.error('Error saving selected tab:', error);
    }
  },

  // Clear the stored tab selection
  clearSelectedTab: async () => {
    try {
      await AsyncStorage.removeItem(TAB_SELECTION_KEY);
    } catch (error) {
      console.error('Error clearing selected tab:', error);
    }
  }
}; 