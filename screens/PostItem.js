import React,{useState,useEffect} from 'react';
import {View,StyleSheet,FlatList,Text,TouchableOpacity} from 'react-native'
import axios from 'axios';
import { ActivityIndicator } from 'react-native';
import Profile from '../screens/Profile'
import { useNavigation } from '@react-navigation/native';
import { Context } from '../components/globalContext/globalContext'


const PostItem = () => {
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
const styles = StyleSheet.create({
    mainContainercontainer: {
        flex:1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderColor: 'lightgrey',
        borderBottomWidth: StyleSheet.hairlineWidth

    },
    clique: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: 17,
    },
    username:{
        flex: 1,
        alignItems:'flex-start',
        textAlign:'center',
        fontSize: 10,
        textAlign:'center',
        color: 'red'
},
content: {
padding: 10,
borderWidth: 0.25,
marginBottom: 25.5,
lineHeight: 18,
padding: 40,
fontSize: 20,
color: 'black'
},
posted: {
marginRight: 16,
textAlign: 'center'
},
caption: {
marginBottom: 25,
textAlign: 'center'
},
footer: {
    flexDirection: 'row',
    marginVertical: 5,
    justifyContent: 'space-between',
    borderColor: 'red',
}
})
export default PostItem