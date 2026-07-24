import { Tabs } from 'expo-router';
import { Home, Newspaper, Calendar as CalendarIcon, User, Settings } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { store } from '../../../utils/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const [user, setUser] = useState(store.getUser());
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setUser(store.getUser());
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
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <CalendarIcon size={22} color={color} />,
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
