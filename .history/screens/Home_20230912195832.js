import React,{useContext,useState} from 'react'
import {View,StyleSheet,Text, Button,TouchableOpacity} from 'react-native'
import { Context } from '../components/globalContext/globalContext'
import Feed from './Feed'

function Home({navigation,route,props}){

    const globalContext = useContext(Context)
    const { isLoggedIn } = globalContext;
    const [posts,setPost] = useState([])
    const [loading,setLoading] = useState(true)

    const getPost = () => {
        axios.get('http://127.0.0.1:8000/api/post-list')
        .then((response) => {
            // console.log(response)
            const myPost = response.data;
            setPost(myPost)
        })
        .catch((error) => console.error(error))
        .finally(() => {
            setLoading(false)
        })    
    }
return (
    <View style={styles.home}>
        <Feed />
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

export default Home;