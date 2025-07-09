import React from 'react';
import {View,Text,StyleSheet} from 'react-native';

function Notifications(){
    return (
        <View style={styles.container}>
            <Text>See Notifications Here !</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
})

export default Notifications