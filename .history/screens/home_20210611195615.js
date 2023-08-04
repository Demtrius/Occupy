import React from 'react';
import {View, StyleSheet, FlatList, Text} from 'react-native';



const Home = props => {
    return (
        <View style={styles.container}>
            <Text style={styles.home}>Hom Screen</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 200,
    },
    home: {
        fontSize: 20,
        color: 'green'
    }
})

export default Home