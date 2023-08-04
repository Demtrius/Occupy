import React from 'react'
import {View,Text,StyleSheet} from 'react-native'

function Profile(){
return (
    <View style={styles.profile}>
    <Text> Your Personal Profile Here !</Text>
</View>
)
}

const styles = StyleSheet.create({
profile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
}
})


export default Profile