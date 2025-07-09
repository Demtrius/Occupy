import React,{useState,useEffect} from 'react';
import {View,StyleSheet,FlatList,Text,TouchableOpacity} from 'react-native'
import axios from 'axios';
import { ActivityIndicator } from 'react-native';
import Profile from '../screens/Profile'


function Feed(){
const [posts,setPost] = useState([])
const [loading,setLoading] = useState(true)


//'http://127.0.0.1:8000/api/get-post'
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



const renderPost = ({item,navigation,props}) => (
    <View style={styles.container}>
        <Text style={styles.clique}>{item.clique}</Text>
        <TouchableOpacity onPress={() => props.navigation.navigate('Profile')}>
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
    <View style={styles.container}>
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
// add padding in content
const styles = StyleSheet.create({
container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
},
clique: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'left',
    fontSize: 17,
},
username:{
        flex: 1,
        alignItems:'flex-start',
        textAlign:'center',
        fontSize: 10,
        textAlign:'left',
        color: 'red'
},
content: {
padding: 10,
borderWidth: 0.25,
marginBottom: 25.5,
lineHeight: 18,
padding: 40,
fontSize: 20,
},
posted: {
marginRight: 16,
},
caption: {
marginBottom: 25,
}
})

export default Feed;