import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Stores
import { useAuthStore } from '@store/auth.store';
import { useAppStore } from '@store/app.store';

// Screens
import Feed from '@screens/feed';
import Search from '@screens/search';
import Cliques from '@screens/cliques';
import Clique from '@screens/clique';
import Post from '@screens/post';
import Notifications from '@screens/notifications';
import Profile from '@screens/profile';
import MessageDetail from '@screens/message-detail';
import ViewUser from '@screens/view-user';
import CreateClique from '@screens/create-clique';

// Navigation
import Navigator from '@navigation/navigator';

// Types
import { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Cliques Stack Navigator
function CliquesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} id={undefined}>
      <Stack.Screen name="Cliques" component={Cliques} />
      <Stack.Screen name="Clique" component={Clique} />
      <Stack.Screen name="CreateClique" component={CreateClique} />
    </Stack.Navigator>
  );
}

// Notifications Stack Navigator
function NotificationStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} id={undefined}>
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="MessageDetail" component={MessageDetail} />
    </Stack.Navigator>
  );
}

// Search Stack Navigator
function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} id={undefined}>
      <Stack.Screen name="Search" component={Search} />
      <Stack.Screen name="ViewUser" component={ViewUser} />
    </Stack.Navigator>
  );
}

// Main Tab Navigator (for authenticated users)
function MyTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6ba32d',
        tabBarInactiveTintColor: 'black',
        headerShown: false,
      }}
      id={undefined}
    >
      <Tab.Screen
        name="Home"
        component={Feed}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStack}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CliquesTab"
        component={CliquesStack}
        options={{
          tabBarLabel: 'Cliques',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="groups" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Post"
        component={Post}
        options={{
          tabBarLabel: 'Post',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationStack}
        options={{
          tabBarLabel: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="user" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main content component that handles authentication state
function AppContent() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6ba32d" />
      </View>
    );
  }

  // Show authenticated or unauthenticated navigation
  return <>{isLoggedIn ? <MyTabs /> : <Navigator />}</>;
}

// Main App Component
export default function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const setOnlineStatus = useAppStore((state) => state.setOnlineStatus);

  useEffect(() => {
    // Initialize authentication state
    initialize();

    // You can add network status monitoring here if needed
    // Example with NetInfo:
    // const unsubscribe = NetInfo.addEventListener(state => {
    //   setOnlineStatus(state.isConnected ?? false);
    // });
    // return () => unsubscribe();
  }, [initialize, setOnlineStatus]);

  return (
    <QueryClientProvider client={queryClient}>
      {/*<PaperProvider>*/}
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppContent />
        </NavigationContainer>
      {/*</PaperProvider>*/}
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
});
