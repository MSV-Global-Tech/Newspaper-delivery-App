import { Tabs } from 'expo-router';
import { Home, Newspaper, Calendar as CalendarIcon, User, Settings, Package, Receipt } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { store } from '../../../utils/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

export default function TabLayout() {
  const getInitialUser = () => {
    const u = store.getUser();
    if (!u) return null;
    const admins = store.getAdminNumbers();
    const updatedAdmin = admins.some(a => a.phone === u.phone);
    return { ...u, isAdmin: updatedAdmin };
  };

  const [user, setUser] = useState(getInitialUser());
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const u = store.getUser();
      // Ensure we fetch the updated admin list from the store
      const admins = store.getAdminNumbers();
      const updatedAdmin = u ? admins.some(a => a.phone === u.phone) : false;
      setUser(u ? { ...u, isAdmin: updatedAdmin } : null);
    });
    return unsubscribe;
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0F172A',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (navigation.isFocused()) {
              e.preventDefault();
            }
          },
        })}
      />
      <Tabs.Screen
        name="papers"
        options={{
          title: 'My Papers',
          tabBarIcon: ({ color }) => <Newspaper size={22} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (navigation.isFocused()) {
              e.preventDefault();
            }
          },
        })}
      />

      <Tabs.Screen
        name="bills"
        options={{
          title: 'My Bills',
          tabBarIcon: ({ color }) => (
            <View>
              <Receipt size={22} color={color} />
              {user?.hasNewBill && (
                <View style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 10,
                  height: 10,
                  backgroundColor: '#EF4444',
                  borderRadius: 5,
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                }} />
              )}
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (navigation.isFocused()) {
              e.preventDefault();
            }
          },
        })}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          href: null, // Hidden from tab bar
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (navigation.isFocused()) {
              e.preventDefault();
            }
          },
        })}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
          href: user?.isAdmin ? undefined : null,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (navigation.isFocused()) {
              e.preventDefault();
            }
          },
        })}
      />
    </Tabs>
  );
}
