import React from 'react';
import {createStackNavigator} from '@react-navigation/stack'
import { View } from 'react-native'
import Landing from '../screens/Landing';
import SignIn from '../screens/SignIn'
const Stack = createStackNavigator();

function Navigator(props){

    return(
        <Stack.Navigator>
            <Stack.Screen name='Landing' component={Landing} options={{headerShown: false}}/>
            <Stack.Screen name='SignIn' component={SignIn} options={{headerShown: false}}/>
        </Stack.Navigator>
    )
}

export default Navigator;