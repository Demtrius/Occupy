import React from 'react';
import {View, StyleSheet, FlatList, Text,Button} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ScreenContainer } from 'react-native-screens';

function Home({navigation}){
    return (
        <View style={styles.home}>
            <Text>Home Screen</Text>
            <Button
            title="Sign In"
            onPress={ ()=> navigation.navigate('Sign In')}
            />
        </View>
    )
}


const styles = StyleSheet.create({
    home: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
})
export default Home