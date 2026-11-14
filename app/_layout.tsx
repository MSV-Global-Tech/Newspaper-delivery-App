import { Stack } from 'expo-router';
import '../global.css';
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, StatusBar } from 'react-native';
import { store } from '../utils/store';
import { getSessionUser } from '../utils/session';
import { checkForUpdate, type RemoteVersionInfo } from '../utils/updateChecker';
import { Linking } from 'react-native';

export default function RootLayout() {
  const bootedRef = useRef(false);
  const [updateInfo, setUpdateInfo] = useState<RemoteVersionInfo | null>(null);

  // Restore the session user into the store once (covers deep-link entries).
  // All boot routing (login vs home) is handled by app/index.tsx
  // BEFORE it renders anything, so returning users never see the tour flash.
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    // Restore session immediately (no blocking)
    restoreSession();

    // Check for updates in background (non-blocking)
    checkForUpdate().then((info) => {
      if (info) {
        console.log('[RootLayout] Update available:', info.version);
        setUpdateInfo(info);
      } else {
        console.log('[RootLayout] No update available');
      }
    }).catch((error) => {
      console.error('[RootLayout] Update check failed:', error);
    });
  }, []);

  const restoreSession = () => {
    getSessionUser()
      .then((sessionUser) => {
        if (sessionUser) {
          console.log('[RootLayout] Session user found:', sessionUser.phone);
          if (!store.getUser()) {
            store.setUser(sessionUser as any);
          }
        } else {
          console.log('[RootLayout] No session user found');
        }
      })
      .catch((error) => {
        console.error('[RootLayout] Failed to get session user:', error);
      });
  };

  const handleDownloadUpdate = () => {
    if (updateInfo?.downloadUrl) {
      Linking.openURL(updateInfo.downloadUrl);
    }
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="customer/login" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="vendor" options={{ headerShown: false }} />
      </Stack>

      {/* Show update modal only if mandatory update is available */}
      {updateInfo && updateInfo.mandatory && (
        <Modal visible={true} transparent animationType="fade">
          <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
          <View style={styles.updateOverlay}>
            <View style={styles.updateCard}>
              <View style={styles.updateIcon}>
                <Text style={{ fontSize: 48 }}>🚀</Text>
              </View>
              <Text style={styles.updateTitle}>Update Required</Text>
              <Text style={styles.updateSubtitle}>
                Download the latest version of newspaper delivery
              </Text>

              <TouchableOpacity
                style={styles.updateBtn}
                activeOpacity={0.85}
                onPress={handleDownloadUpdate}
              >
                <Text style={styles.updateBtnText}>Download Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  updateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  updateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  updateIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  updateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  updateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  updateBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
