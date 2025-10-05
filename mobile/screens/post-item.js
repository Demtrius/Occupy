import React,{useState,useEffect} from 'react';
import {View,StyleSheet,FlatList,Text,TouchableOpacity,Button} from 'react-native'
import axios from 'axios';
import { ActivityIndicator } from 'react-native';
import Profile from './profile'
import { useNavigation } from '@react-navigation/native';
import { Context } from '../components/globalContext/globalContext'
import PostDetail from './post-detail';
import { FontAwesome } from '@expo/vector-icons';
const PostItem = () => {
    const [posts,setPost] = useState([])
    const [loading,setLoading] = useState(true)
    const navigation = useNavigation();


    const getPosts = () => {

        axios.get(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/post-list')
        .then((response) => {
            const myPost = response.data;
            setPost(myPost)
        })
        .catch((error) => console.error(error))
        .finally(() => {
            setLoading(false)
        })
    }
useEffect(() => getPosts(), [])




// const renderPosts = ({item}) => (
//     <View style={styles.container}>
//         <View style={styles.mainContainer}>
//         <Text style={styles.clique}>{item.clique}</Text>
//             <Text style={styles.username}>{item.occupier}</Text>
//         <View>
//         <Text style={styles.content}>{item.content}</Text>
//         </View>
//         <Text style={styles.posted}>{item.posted}</Text>
//         <Text style={styles.caption}>{item.caption}</Text>
//         </View>
//     </View>
// )

const renderPosts = ({item}) => (
    <View style={styles.container}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.contentContainer}>
        <View style={styles.header}>
        <Text style={styles.name}>{item.occupier}</Text>
        <Text style={styles.handle}> @{item.clique} · {item.posted}</Text>
        </View>
        <Text style={styles.content}>{item.content}</Text>
        <Text style={styles.caption}>{item.caption}</Text>
        <View style={styles.engagement}>
        <FontAwesome name="comment-o" size={16} color="gray" />
                    <FontAwesome name="retweet" size={16} color="gray" style={styles.icon} />
                    <FontAwesome name="heart-o" size={16} color="gray" style={styles.icon} />
                    <FontAwesome name="share" size={16} color="gray" style={styles.icon} />
        </View>
        </View>
    </View>
);
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
},
avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
},
contentContainer: {
    flex: 1,
},
header: {
    flexDirection: 'row',
    alignItems: 'center',
},
handle: {
    color: 'gray',
},
engagement: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
    marginTop: 5,
},
icon: {
    marginLeft: 15,
},
})
export default PostItem
