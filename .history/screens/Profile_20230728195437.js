import React from 'react'
import {View,Text,StyleSheet,ActivityIndicator,FlatList} from 'react-native'
import aixos from 'aixos'
import axios from 'axios'

function Profile(){
    const[profile,setProfile] = useState()
    const [ loading, setLoading] = useState(true)

    const getProfile = () => {
        axios.get('http://127.0.0.1:8000/api/current-occupier/')
        .then(response =>{
            console.log(response)
            const myProfile = response.data
            setProfile(myProfile)
        }
        )
    }
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