import React from 'react'
import {View,Text,StyleSheet,ActivityIndicator,FlatList} from 'react-native'

function Profile(){
    const[profile,setProfile] = useState()
    const [ loading, setLoading] = useState(true)
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