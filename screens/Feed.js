import React,{useState,useEffect} from 'react';
import {View,StyleSheet,FlatList,Text,TouchableOpacity} from 'react-native'
import axios from 'axios';
import { ActivityIndicator } from 'react-native';
import Profile from '../screens/Profile'
import { useNavigation } from '@react-navigation/native';
import { Context } from '../components/globalContext/globalContext'




function Feed(){

const [posts,setPost] = useState([])
const [loading,setLoading] = useState(true)


const getPosts = () => {
    
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
useEffect(() => getPosts(), [])

const renderPosts = ({item}) => (
    <View style={styles.container}>
        <View style={styles.mainContainer}>
        <Text style={styles.clique}>{item.clique}</Text>
            <Text style={styles.username}>{item.occupier}</Text>
        <View>
        <Text style={styles.content}>{item.content}</Text>
        </View>
        <Text style={styles.posted}>{item.posted}</Text>
        <Text style={styles.caption}>{item.caption}</Text>
        </View>
    </View>
)
return (
    <View style={styles.container}>
        {loading ? <ActivityIndicator/> : (
        <FlatList
        data={posts}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderPosts}
        />
        )}
    </View>
)
}
// add padding in content
const styles = StyleSheet.create({
container: {
    container: {
        flex: 1,

    },
}
})


export default Feed;