import { StatusBar } from 'expo-status-bar';
import React, {useState,useEffect} from 'react';
import {
  StyleSheet, Text, View,Button,FlatList, Alert,
} 
from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// import { Header } from 'react-native/Libraries/NewAppScreen';
import Header from './components/Header'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Home from './screens/Home'
import Search from './screens/Search'
import Cliques from './screens/Cliques'
import Post from './screens/Post'
import Notifications from './screens/Notifications'
import Profile from './screens/Profile'
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import {Context , Provider} from './components/globalContext/globalContext'
import Landing  from './screens/Landing';
import Navigator from './navigation/navigator'






const Tab = createBottomTabNavigator();


function MyTabs(){
return (
  <Tab.Navigator>
  <Tab.Screen
  name="Home"
  component={Home}
  options={{
    tabBarLabel: 'Home',
    tabBarIcon: ({color,size}) => (
      <AntDesign name="home" size={24} color="black" />
    )
  }}
  />
  <Tab.Screen
  name="Search"
  component={Search}
  options={{
    tabBarLabel: 'Search',
    tabBarIcon: ({color,size}) => (
      <Ionicons name="search" size={24} color="black" />
    )
  }}
  />
  <Tab.Screen
  name="Cliques"
  component={Cliques}
  options={{
    tabBarLabel: 'Cliques',
    tabBarIcon: ({color,size}) => (
      <MaterialIcons name="groups" size={24} color="black" />
    )
  }}
  />
  <Tab.Screen
  name="Post"
  component={Post}
  options={{
    tabBarLabel: 'Post',
    tabBarIcon: ({color,size}) => (
      <Ionicons name="ios-add-circle-sharp" size={24} color="black" />
    )
  }}
  />
  <Tab.Screen
  name="Notifications"
  component={Notifications}
  options={{
    tabBarLabel: 'Notifications',
    tabBarIcon: ({color,size}) => (
      <Ionicons name="notifications" size={24} color="black" />
    )
  }}
  />
  <Tab.Screen
  name="Profile"
  component={Profile}
  options={{
    tabBarLabel: 'Profile',
    tabBarIcon: ({color,size}) => (
<AntDesign name="user" size={24} color="black" />
    )
  }}
  />
</Tab.Navigator>
)
}

function App(props) {
return (
<Provider>
<NavigationContainer>
<Header title="Occupy"/>
{/* <Navigator /> */}
<MyTabs />
</NavigationContainer>
</Provider>

  )
}





const styles = StyleSheet.create({
clique: {
flex: 1,
alignItems: 'center',
justifyContent:'center',
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
    color: 'red'
  },
  profile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    color: 'red'
  },
  noti:{
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  post: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default App;