import React,{useState,useEffect} from 'react'
import {View,Text,StyleSheet,ActivityIndicator,FlatList} from 'react-native'
import axios from 'axios'


function Profile(){
    const[profile,setProfile] = useState([])
    const [ loading, setLoading] = useState(true)

    const getProfile = () => {
        axios.get('http://127.0.0.1:8000/api/current-occupier/',{
            headers: 'application/json'
        })
        .then(response =>{
            console.log(response)
            const myProfile = response.data
            setProfile(myProfile)
        })
        .catch((error) => console.error(error))
        .finally(() =>{
            setLoading(false)
        })
    }
    useEffect(() => getProfile(),[])

    const renderProfile = ({item}) => {
        return (
            <View style={styles.profile}>
            <Text>{item.username}</Text>
            <Text>{item.occupations}</Text>
            <Text>{item.date_joined}</Text>
            <Text>{item.posts}</Text>
        </View>
        )
    }
return ( 
    <View style={styles.profile}>
    <Text> Your Personal Profile Here !</Text>
    {loading ? <ActivityIndicator /> : (
        <FlatList
        data={profile}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderProfile}
        />
    )}
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