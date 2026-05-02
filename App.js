import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
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
import MembersScreen from './src/screens/MembersScreen'
import { onAuthStateChanged, fetchUserProfile } from './services/firebase'
import AsyncStorage from '@react-native-async-storage/async-storage'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function AppTabs({ user, profile, theme, onThemeChange, onProfileUpdate }) {
  const insets = useSafeAreaInsets()

  const floatingTabBarStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: insets.bottom,
    borderRadius: 24,
    backgroundColor: theme === 'dark' ? '#121212' : '#fff',
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: theme === 'dark' ? 0.35 : 0.15,
    shadowRadius: 18,
    height: 78,
    paddingTop: 10,
    paddingBottom: 10,
  }

  const baseScreenOptions = ({ route }) => ({
    headerShown: false,
    tabBarItemStyle: { width: '25%' },
    tabBarIconStyle: { marginTop: 4 },
    tabBarIcon: ({ focused, color, size }) => {
      let iconName = 'circle'

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
    tabBarActiveTintColor: theme === 'dark' ? '#4dabf7' : '#007AFF',
    tabBarInactiveTintColor: theme === 'dark' ? '#aaa' : '#ccc',
    tabBarStyle: floatingTabBarStyle,
  })

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme === 'dark' ? '#4dabf7' : '#007AFF'} />
        <Text style={{ marginTop: 10, color: theme === 'dark' ? '#ccc' : '#666' }}>
          Loading profile...
        </Text>
      </View>
    )
  }

  if (profile.role === 'admin') {
    return (
      <Tab.Navigator screenOptions={baseScreenOptions}>
        <Tab.Screen name="Dashboard">
          {props => (
            <AdminDashboardScreen {...props} user={user} profile={profile} theme={theme} />
          )}
        </Tab.Screen>

        <Tab.Screen name="Calculation">
          {props => <CalculationScreen {...props} user={user} theme={theme} />}
        </Tab.Screen>

        <Tab.Screen name="Messages">
          {props => (
            <MessagesScreen {...props} user={user} profile={profile} theme={theme} />
          )}
        </Tab.Screen>

        <Tab.Screen name="Profile">
          {props => (
            <ProfileScreen
              {...props}
              user={user}
              profile={profile}
              theme={theme}
              onThemeChange={onThemeChange}
              onProfileUpdate={onProfileUpdate}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    )
  }

  return (
    <Tab.Navigator screenOptions={baseScreenOptions}>
      <Tab.Screen name="Dashboard">
        {props => (
          <WorkerDashboardScreen {...props} user={user} profile={profile} theme={theme} />
        )}
      </Tab.Screen>

      <Tab.Screen name="Messages">
        {props => (
          <MessagesScreen {...props} user={user} profile={profile} theme={theme} />
        )}
      </Tab.Screen>

      <Tab.Screen name="Profile">
        {props => (
          <ProfileScreen
            {...props}
            user={user}
            profile={profile}
            theme={theme}
            onThemeChange={onThemeChange}
            onProfileUpdate={onProfileUpdate}
          />
        )}
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

  const handleProfileUpdate = async updatedFields => {
    setProfile(prev => {
      const nextProfile = { ...prev, ...updatedFields }
      if (user?.uid) {
        AsyncStorage.setItem(`profile_${user.uid}`, JSON.stringify(nextProfile)).catch(err => {
          console.warn('[Profile] Failed to cache updated profile:', err.message)
        })
      }
      return nextProfile
    })
  }

  useEffect(() => {
    console.log('[Auth] Starting Auth listener...')
    let isSubscribed = true;

    const unsubscribe = onAuthStateChanged(async authUser => {
      if (!isSubscribed) return;

      if (authUser) {
        console.log(`[Auth] User detected: ${authUser.email} (UID: ${authUser.uid})`)
        setUser(authUser)

        console.log('[Profile] Checking local cache...')
        const cachedProfile = await AsyncStorage.getItem(`profile_${authUser.uid}`)
        if (cachedProfile) {
          console.log('[Profile] Found cached profile, setting UI...')
          setProfile(JSON.parse(cachedProfile))
          setLoading(false)
        }

        try {
          console.log('[Profile] Fetching fresh profile from Firebase...')
          const profileDoc = await fetchUserProfile(authUser.uid)
          if (profileDoc) {
            console.log(`[Profile] Fetch successful! Role: ${profileDoc.role}`)
            setProfile(profileDoc)
            await AsyncStorage.setItem(`profile_${authUser.uid}`, JSON.stringify(profileDoc))
          } else if (!cachedProfile) {
            console.warn('[Profile] Profile document does not exist in Firestore.')
            setProfile({ name: authUser.email, role: 'worker' })
          }
        } catch (e) {
          console.error('[Profile] Fetch error:', e.message)
          if (!profile && !cachedProfile) {
            console.log('[Profile] No cache and fetch failed. Defaulting to worker view to avoid stuck screen.')
            setProfile({ name: authUser.email, role: 'worker' })
          }
        } finally {
          setLoading(false)
        }
      } else {
        console.log('[Auth] No user signed in.')
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
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
      <NavigationContainer theme={DefaultTheme}>
        {user ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs">
              {props => (
                <AppTabs
                  {...props}
                  user={user}
                  profile={profile}
                  theme={theme}
                  onThemeChange={handleThemeChange}
                  onProfileUpdate={handleProfileUpdate}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Members">
              {props => <MembersScreen {...props} theme={theme} />}
            </Stack.Screen>
          </Stack.Navigator>
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
