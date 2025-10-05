import React from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { useAuthStore } from '../store/auth.store';
import { RootStackParamList } from '../types';

// Import screens
import Landing from '@screens/landing';
import SignIn from '@screens/sign-in';
import Home from '@screens/home';
import Profile from '@screens/profile';
import Register from '@screens/register';
import Cliques from '@screens/cliques';
import Clique from '@screens/clique';
import Feed from '@screens/feed';
import SignInBusiness from '@screens/sign-in-business';
import RegisterBusiness from '@screens/register-business';
import PostDetail from '@screens/post-detail';

const Stack = createStackNavigator<RootStackParamList>();

// Screen options to hide header
const screenOptions: StackNavigationOptions = {
  headerShown: false,
};

/**
 * Main navigation component
 *
 * Handles navigation flow based on authentication state.
 * Shows auth screens when logged out, main app screens when logged in.
 */
function Navigator(): React.ReactElement {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);

  return (
    <Stack.Navigator screenOptions={screenOptions} id={undefined}>
      {!isLoggedIn ? (
        <>
          {/* Authentication Screens */}
          <Stack.Screen
            name="SignIn"
            component={SignIn}
          />
          <Stack.Screen
            name="Register"
            component={Register}
          />
          <Stack.Screen
            name="SignInBusiness"
            component={SignInBusiness}
          />
          <Stack.Screen
            name="RegisterBusiness"
            component={RegisterBussines}
          />
          <Stack.Screen
            name="Landing"
            component={Landing}
          />
        </>
      ) : (
        <>
          {/* Main App Screens */}
          <Stack.Screen
            name="Home"
            component={Home}
          />
          <Stack.Screen
            name="Feed"
            component={Feed}
          />
          <Stack.Screen
            name="PostDetail"
            component={PostDetail}
          />
          <Stack.Screen
            name="Profile"
            component={Profile}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default Navigator;
