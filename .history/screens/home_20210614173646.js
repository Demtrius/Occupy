import React from 'react'
import {View,StyleSheet,Text, Button} from 'react-native'
import Details from './DetailsScreen'
function Home({navigation}){
return (
    <View style={styles.home}>
    <Text>Welcome Home</Text>
    <Button
    title
    onPress={ ()=> navigation.navigate("DetailsScreen")}
    />
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