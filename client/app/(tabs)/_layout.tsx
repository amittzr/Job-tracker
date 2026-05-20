import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, router } from 'expo-router';
import { Pressable, View, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Colors from '@/constants/Colors';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true, // וודא שזה true
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'המשרות שלי',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* כפתור הוספת משרה */}
              <Link href="/modal" asChild>
                <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                  <FontAwesome
                    name="plus-circle"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].tint}
                    style={{ marginRight: 15 }}
                  />
                </Pressable>
              </Link>

              {/* כפתור התנתקות */}
              <Pressable 
                onPress={async () => {
                  await AsyncStorage.removeItem('user');
                  router.replace('/login');
                }}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.5 : 1,
                  marginRight: 15,
                })}>
                <FontAwesome name="sign-out" size={22} color="#FF3B30" />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
        }}
      />
    </Tabs>
  );
}