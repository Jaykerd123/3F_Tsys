import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
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
import { onAuthStateChanged, fetchUserProfile, logout } from './services/firebase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Button } from 'react-native'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function AppTabs({ user, profile }) {
  // If we don't have a profile yet, or if they are a worker, show the worker tabs
  // This ensures the navigation bar (nav bars) is ALWAYS visible immediately
  if (!profile || profile.role !== 'admin') {
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
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#ccc',
      })}>
        <Tab.Screen name="Dashboard" options={{ title: 'Dashboard' }}>
          {props => <WorkerDashboardScreen {...props} user={user} profile={profile || { name: user.email, role: 'worker' }} />}
        </Tab.Screen>
        <Tab.Screen name="Messages" options={{ title: 'Messages' }}>
          {props => <MessagesScreen {...props} user={user} profile={profile || { name: user.email, role: 'worker' }} />}
        </Tab.Screen>
        <Tab.Screen name="Profile" options={{ title: 'Profile' }}>
          {props => <ProfileScreen {...props} user={user} profile={profile || { name: user.email, role: 'worker' }} />}
        </Tab.Screen>
      </Tab.Navigator>
    )
  }

  // If confirmed Admin, show the Admin tabs
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
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#ccc',
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
        {props => <ProfileScreen {...props} user={user} profile={profile} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async authUser => {
      if (authUser) {
        setUser(authUser)
        setLoading(false) // Stop loading immediately once we have a user
        
        // Fetch profile in the background
        const cachedProfile = await AsyncStorage.getItem(`profile_${authUser.uid}`)
        if (cachedProfile) setProfile(JSON.parse(cachedProfile))
        
        try {
          const profileDoc = await fetchUserProfile(authUser.uid)
          if (profileDoc) {
            setProfile(profileDoc)
            await AsyncStorage.setItem(`profile_${authUser.uid}`, JSON.stringify(profileDoc))
          }
        } catch (e) {
          console.log("Background profile fetch failed")
        }
      } else {
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
      <NavigationContainer>
        {user ? (
          <AppTabs user={user} profile={profile} />
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
