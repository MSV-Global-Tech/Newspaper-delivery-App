import { Stack } from 'expo-router';
import '../global.css';
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, StatusBar } from 'react-native';
import { store } from '../utils/store';
import { getSessionUser } from '../utils/session';
import { checkForUpdate, type RemoteVersionInfo } from '../utils/updateChecker';
import { Linking } from 'react-native';

export default function RootLayout() {
  const bootedRef = useRef(false);
  const [updateInfo, setUpdateInfo] = useState<RemoteVersionInfo | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(true);

  // Restore the session user into the store once (covers deep-link entries).
  // All boot routing (onboarding vs login vs home) is handled by app/index.tsx
  // BEFORE it renders anything, so returning users never see the tour flash.
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    // Check for updates first (blocking)
    checkForUpdate().then((info) => {
      setCheckingUpdate(false);
      if (info) {
        console.log('[RootLayout] Update available:', info.version);
        setUpdateInfo(info);
      } else {
        console.log('[RootLayout] No update available');
        // Only restore session if no mandatory update
        restoreSession();
      }
    }).catch((error) => {
      console.error('[RootLayout] Update check failed:', error);
      setCheckingUpdate(false);
      // Allow app to continue if update check fails
      restoreSession();
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

  // If checking for update, show loading
  if (checkingUpdate) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Checking for updates...</Text>
      </View>
    );
  }

  // If mandatory update is available, show blocking modal
  if (updateInfo && updateInfo.mandatory) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.updateOverlay}>
            <View style={styles.updateCard}>
              <View style={styles.updateIcon}>
                <Text style={{ fontSize: 48 }}>🚀</Text>
              </View>
              <Text style={styles.updateTitle}>Update Required</Text>
              <Text style={styles.updateSubtitle}>
                A new version ({updateInfo.version}) is available. You must update to continue using the app.
              </Text>

              {!!updateInfo.releaseNotes && (
                <View style={styles.updateNotesBox}>
                  <Text style={styles.updateNotesTitle}>What's new</Text>
                  <Text style={styles.updateNotesText}>{updateInfo.releaseNotes}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.updateBtn}
                activeOpacity={0.85}
                onPress={handleDownloadUpdate}
              >
                <Text style={styles.updateBtnText}>Update Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Otherwise, render the app normally
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
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
  updateNotesBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  updateNotesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  updateNotesText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
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
