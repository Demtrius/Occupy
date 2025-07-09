import React from 'react';
import {createStackNavigator} from '@react-navigation/stack'
import { View } from 'react-native'

import Landing from '../Landing.js'
import SignIn from '../SignIn'

const Stack = createStackNavigator()

function Navigator(props) {

    return(
        <Stack.Navigator initialRouteName='Landing'>
            <Stack.Screen name='Landing' component={Landing} options={{headerShown: false}}/>
            <Stack.Screen name='SignIn' component={SignIn} options={{headerShown: false}}/>
        </Stack.Navigator>
    )
}