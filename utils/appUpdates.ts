import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';

export interface UpdateInfo {
  isAvailable: boolean;
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
}

export const checkForUpdates = async (): Promise<UpdateInfo> => {
  try {
    if (!__DEV__) {
      const update = await Updates.checkForUpdateAsync();
      return {
        isAvailable: update.isAvailable,
        isUpdateAvailable: update.isAvailable,
        isUpdatePending: false,
      };
    }
    return {
      isAvailable: false,
      isUpdateAvailable: false,
      isUpdatePending: false,
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return {
      isAvailable: false,
      isUpdateAvailable: false,
      isUpdatePending: false,
    };
  }
};

export const fetchAndApplyUpdate = async (): Promise<boolean> => {
  try {
    if (!__DEV__) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error fetching update:', error);
    return false;
  }
};

export const showUpdateAvailableAlert = async (): Promise<void> => {
  try {
    const updateInfo = await checkForUpdates();
    
    if (updateInfo.isUpdateAvailable) {
      Alert.alert(
        'Update Available',
        'A new version of the app is available. Would you like to update now?',
        [
          {
            text: 'Later',
            style: 'cancel',
          },
          {
            text: 'Update Now',
            onPress: async () => {
              const success = await fetchAndApplyUpdate();
              if (!success) {
                Alert.alert('Update Failed', 'Failed to apply the update. Please try again later.');
              }
            },
          },
        ]
      );
    }
  } catch (error) {
    console.error('Error showing update alert:', error);
  }
};

export const checkAndShowUpdateAlert = async (): Promise<void> => {
  try {
    const updateInfo = await checkForUpdates();
    
    if (updateInfo.isUpdateAvailable) {
      await showUpdateAvailableAlert();
    }
  } catch (error) {
    console.error('Error checking and showing update alert:', error);
  }
};

export const getRuntimeVersion = async (): Promise<string> => {
  try {
    return Updates.runtimeVersion || 'unknown';
  } catch (error) {
    console.error('Error getting runtime version:', error);
    return 'unknown';
  }
};

export const checkForUpdatesSilent = async (): Promise<boolean> => {
  try {
    if (!__DEV__) {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking for updates silently:', error);
    return false;
  }
};