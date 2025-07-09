import React from 'react';
import {View, StyleSheet, FlatList, Text,Button} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ScreenContainer } from 'react-native-screens';

export const  Home = ({navigation}) => {
<ScreenContainer>
<Text>Welcome Home</Text>
</ScreenContainer>
}

export const SignIn = ({navigation}) => {

}

const styles = StyleSheet.create({
    home: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
})
