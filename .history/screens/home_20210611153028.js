import React from 'react';
import {View, StyleSheet, FlatList, Text} from 'react-native';



const Home = props => {
    return (
        <View style={styles.container}>
            <Text style={styles.home}>Home Screen</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 60
    },
    home: {

    }
})

export default Home