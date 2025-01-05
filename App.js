import { StatusBar } from 'expo-status-bar';
import React, { useContext } from 'react';
import {
  StyleSheet, Text, View, Button, FlatList, Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Home from './screens/Home'
import Search from './screens/Search'
import Cliques from './screens/Cliques'
import Clique from './screens/Clique'
import Post from './screens/Post'
import Notifications from './screens/Notifications'
import Profile from './screens/Profile'
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Context, Provider } from './components/globalContext/globalContext';
import Landing from './screens/Landing';
import Navigator from './navigation/navigator';
import Feed from './screens/Feed';
import MessageDetail from './screens/MessageDetail'
import ViewUser from './screens/ViewUser';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function CliquesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Cliques"
        component={Cliques}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Clique"
        component={Clique}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function NotificationStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Notification"
        component={Notifications}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MessageDetail"
        component={MessageDetail}
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Search"
        component={Search}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ViewUser"
        component={ViewUser}
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}

function MyTabs(){
return (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: '#6ba32d',
      tabBarInactiveTintColor: 'black',
    }}
  >
  <Tab.Screen
  name="Home"
  component={Feed}
  options={{
    tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
      <AntDesign name="home" size={24} color="black" />
          ),
          headerShown: false // Remove header
  }}
  />
  <Tab.Screen
  name="SearchTab"
  component={SearchStack}
  options={{
    tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
      <Ionicons name="search" size={24} color="black" />
          ),
          headerShown: false // Remove header
  }}
  />
  <Tab.Screen
  name="CliquesTab"
  component={CliquesStack}
  options={{
    tabBarLabel: 'Cliques',
          tabBarIcon: ({ color, size }) => (
      <MaterialIcons name="groups" size={24} color="black" />
          ),
          headerShown: false // Remove header
  }}
  />
  <Tab.Screen
  name="Post"
  component={Post}
  options={{
    tabBarLabel: 'Post',
          tabBarIcon: ({ color, size }) => (
      <Ionicons name="create" size={24} color="black" />
          ),
          headerShown: false, // Remove header
  }}
  />
  <Tab.Screen
  name="NotificationsTab"
  component={NotificationStack}
  options={{
    tabBarLabel: 'Notifications',
          tabBarIcon: ({ color, size }) => (
      <Ionicons name="notifications" size={24} color="black" />
          ),
          headerShown: false, // Remove header
  }}
  />
  <Tab.Screen
  name="Profile"
  component={Profile}
  options={{
    tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
<AntDesign name="user" size={24} color="black" />
          ),
          headerShown: false // Remove header
  }}
  />
</Tab.Navigator>
)
}





function App(props) {
return (
<Provider>
<NavigationContainer>
<Tabs />
</NavigationContainer>
</Provider>
  );
}

function Tabs(props, navigation, route) {
  const globalContext = useContext(Context);
  const { isLoggedIn } = globalContext;
  return (
    <>
      {isLoggedIn ? <MyTabs /> : <Navigator />}
    </>
  );
  }

const styles = StyleSheet.create({
clique: {
flex: 1,
alignItems: 'center',
    justifyContent: 'center',
color: 'green'
},
  home: {
   flex: 1,
   alignItems: 'center',
   justifyContent: 'center',
   color: 'green'
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    color: 'red',
    paddingTop: 50, // Add padding to avoid content getting under the dynamic island
  },
  profile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    color: 'red'
  },
  noti: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  post: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default App;