import React,{useContext,useState,useEffect} from 'react'
import {View,StyleSheet,Text, Button,TouchableOpacity,FlatList} from 'react-native'
import { Context } from '../components/globalContext/globalContext'
import Feed from './Feed'
import { ActivityIndicator } from 'react-native';
import axios from 'axios';

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

    useEffect(() => getPost(), [])


const renderPost = ({item}) => (
    <View style={styles.container}>
        <Text style={styles.clique}>{item.clique}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View>
            <Text style={styles.username}>{item.occupier}</Text>
            </View>
        </TouchableOpacity>
        <View>
        <Text style={styles.content}>{item.content}</Text>
        </View>
        <Text style={styles.posted}>{item.posted}</Text>
        <Text style={styles.caption}>{item.caption}</Text>
    </View>

)
return (
    <View style={styles.home}>
        {/* <Feed />/ */}
        {loading ? <ActivityIndicator/> : (
        <FlatList
        data={posts}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderPost}
        />
        )}
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