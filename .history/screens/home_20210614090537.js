import React from 'react';
import {View, StyleSheet, FlatList, Text,Button} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

export const  Home = ({navigation}) => {
<View>
    <Text>Welcome Home</Text>
</View>
}


const styles = StyleSheet.create({
    home: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
})
