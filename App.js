import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import LoginScreen from './src/screens/LoginScreen'
import SignupScreen from './src/screens/SignupScreen'
import WorkerDashboardScreen from './src/screens/WorkerDashboardScreen'
import AdminDashboardScreen from './src/screens/AdminDashboardScreen'
import CalculationScreen from './src/screens/CalculationScreen'
import MessagesScreen from './src/screens/MessagesScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import { onAuthStateChanged, fetchUserProfile } from './services/firebase'
import AsyncStorage from '@react-native-async-storage/async-storage'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function AppTabs({ user, profile, theme, onThemeChange }) {
  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme === 'dark' ? '#4dabf7' : '#007AFF'} />
        <Text style={{ marginTop: 10, color: theme === 'dark' ? '#ccc' : '#666' }}>Loading profile...</Text>
      </View>
    )
  }

  if (profile.role === 'admin') {
    const activeColor = theme === 'dark' ? '#4dabf7' : '#007AFF'
    const inactiveColor = theme === 'dark' ? '#aaa' : '#ccc'
    const tabBarBg = theme === 'dark' ? '#121212' : '#fff'

    return (
      <Tab.Navigator screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName
          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline'
          } else if (route.name === 'Calculation') {
            iconName = focused ? 'calculator' : 'calculator'
          } else if (route.name === 'Messages') {
            iconName = focused ? 'email' : 'email-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline'
          }
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: { backgroundColor: tabBarBg },
      })}>
        <Tab.Screen name="Dashboard" options={{ title: 'Dashboard' }}>
          {props => <AdminDashboardScreen {...props} user={user} />}
        </Tab.Screen>
        <Tab.Screen name="Calculation" options={{ title: 'Calculation' }}>
          {props => <CalculationScreen {...props} user={user} />}
        </Tab.Screen>
        <Tab.Screen name="Messages" options={{ title: 'Messages' }}>
          {props => <MessagesScreen {...props} user={user} profile={profile} />}
        </Tab.Screen>
        <Tab.Screen name="Profile" options={{ title: 'Profile' }}>
          {props => <ProfileScreen {...props} user={user} profile={profile} theme={theme} onThemeChange={onThemeChange} />}
        </Tab.Screen>
      </Tab.Navigator>
    )
  }

  const activeColor = theme === 'dark' ? '#4dabf7' : '#007AFF'
  const inactiveColor = theme === 'dark' ? '#aaa' : '#ccc'
  const tabBarBg = theme === 'dark' ? '#121212' : '#fff'

  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName
        if (route.name === 'Dashboard') {
          iconName = focused ? 'view-dashboard' : 'view-dashboard-outline'
        } else if (route.name === 'Messages') {
          iconName = focused ? 'email' : 'email-outline'
        } else if (route.name === 'Profile') {
          iconName = focused ? 'account' : 'account-outline'
        }
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />
      },
      tabBarActiveTintColor: activeColor,
      tabBarInactiveTintColor: inactiveColor,
      tabBarStyle: { backgroundColor: tabBarBg },
    })}>
      <Tab.Screen name="Dashboard" options={{ title: 'Dashboard' }}>
        {props => <WorkerDashboardScreen {...props} user={user} profile={profile} />}
      </Tab.Screen>
      <Tab.Screen name="Messages" options={{ title: 'Messages' }}>
        {props => <MessagesScreen {...props} user={user} profile={profile} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ title: 'Profile' }}>
        {props => <ProfileScreen {...props} user={user} profile={profile} theme={theme} onThemeChange={onThemeChange} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('app_theme')
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme)
        }
      } catch (e) {
        console.warn('[Theme] Failed to load theme preference:', e.message)
      }
    }

    loadTheme()
  }, [])

  const handleThemeChange = async selectedTheme => {
    try {
      setTheme(selectedTheme)
      await AsyncStorage.setItem('app_theme', selectedTheme)
    } catch (e) {
      console.warn('[Theme] Failed to save theme preference:', e.message)
    }
  }

  useEffect(() => {
    console.log("[Auth] Starting Auth listener...");
    const unsubscribe = onAuthStateChanged(async authUser => {
      if (authUser) {
        console.log(`[Auth] User detected: ${authUser.email} (UID: ${authUser.uid})`);
        setUser(authUser)
        
        // Check cache first to speed up entry
        console.log("[Profile] Checking local cache...");
        const cachedProfile = await AsyncStorage.getItem(`profile_${authUser.uid}`)
        if (cachedProfile) {
          console.log("[Profile] Found cached profile, setting UI...");
          setProfile(JSON.parse(cachedProfile))
          setLoading(false)
        } else {
          console.log("[Profile] No cached profile found.");
        }
        
        try {
          console.log("[Profile] Fetching fresh profile from Firebase...");
          const profileDoc = await fetchUserProfile(authUser.uid)
          if (profileDoc) {
            console.log(`[Profile] Fetch successful! Role: ${profileDoc.role}`);
            setProfile(profileDoc)
            await AsyncStorage.setItem(`profile_${authUser.uid}`, JSON.stringify(profileDoc))
          } else {
            console.warn("[Profile] Profile document does not exist in Firestore.");
            // Default to worker if doc doesn't exist
            setProfile({ name: authUser.email, role: 'worker' })
          }
        } catch (e) {
          console.error("[Profile] Fetch error:", e.message);
          // If offline and no cache, let them in as worker for now so they aren't stuck
          if (!profile) {
            console.log("[Profile] No cache and fetch failed. Defaulting to worker view to avoid stuck screen.");
            setProfile({ name: authUser.email, role: 'worker' })
          }
        } finally {
          setLoading(false)
        }
      } else {
        console.log("[Auth] No user signed in.");
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme === 'dark' ? DarkTheme : DefaultTheme}>
        {user ? (
          <AppTabs user={user} profile={profile} theme={theme} onThemeChange={handleThemeChange} />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
