import React from 'react'
import {View,StyleSheet,Text} from 'react-native'

function Home(){
return (
    <View style={styles.home}>
    <Text>Welcome Home</Text>
</View>
)
}


const styles = StyleSheet.create({
    home: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
})

export default Home