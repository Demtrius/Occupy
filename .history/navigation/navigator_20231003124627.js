import React,{useContext} from 'react';
import {createStackNavigator} from '@react-navigation/stack'
import { NavigationContainer } from '@react-navigation/native';
import { View } from 'react-native'
import Landing from '../screens/Landing';
import SignIn from '../screens/SignIn';
import Home from '../screens/Home';
import Profile from '../screens/Profile';
import Register from '../screens/Register'
import { Context } from '../components/globalContext/globalContext'
import Cliques from  '../screens/Cliques'
import CliqueUI from '../screens/CliqueUI'

const Stack = createStackNavigator();

function Navigator(props){
    const globalContext = useContext(Context)
    const { isLoggedIn,occupierObj } = globalContext

    return(
        <Stack.Navigator>
            {(!isLoggedIn)?
            <>
            <Stack.Screen name='Landing' component={Landing} options={{headerShown: false}} />
            <Stack.Screen name='SignIn' component={SignIn} options={{headerShown: false}} />
            <Stack.Screen name='Register' component={Register} options={{headerShown: false}} />
            </>
            :
            
            <Stack.Screen name='Home' component={Home} options={{headerShown: false}}  />
               
    }
        </Stack.Navigator>
        
    )
}

export default Navigator;