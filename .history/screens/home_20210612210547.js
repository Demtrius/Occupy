import React from 'react';
import {View, StyleSheet, FlatList, Text,Button} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

function Home(){
    return (
        <View style={styles.home}>
            <Text>Welcome to Occupy</Text>
            <Button
            title="Go somewhere"
            />
        </View>
    )
}

const Stack = createStackNavigator();

const styles = StyleSheet.create({
    home: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
})
export default Home