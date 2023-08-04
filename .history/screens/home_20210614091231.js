import React from 'react';
import {View, StyleSheet, FlatList, Text,Button} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ScreenContainer } from 'react-native-screens';

export const  Home = ({navigation}) => {
return (
<ScreenContainer>
<Text>Welcome Home</Text>
</ScreenContainer>
)
}

export const SignIn = ({navigation}) => {
return (
<ScreenContainer>
<Text> Sign In Screen</Text>
<Button title="Sign In" onPress={ ()=> alert("todo")} />
<Button title="Sign Up" onPress={()=> alert('todo')} />
</ScreenContainer>
)
}
export const SignUp = () => {

}

const styles = StyleSheet.create({
    home: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
})
