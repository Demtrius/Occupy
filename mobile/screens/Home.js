import React,{useContext,useState,useEffect} from 'react'
import {View,StyleSheet,Text, Button,TouchableOpacity,FlatList, Pressable} from 'react-native'
import { Context } from '../components/globalContext/globalContext'
import Feed from './Feed'
import { ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Link } from 'expo-router';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import PostItem from './PostItem';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PostDetail from './PostDetail';

const Tab = createBottomTabNavigator();

function Home({}){
    const globalContext = useContext(Context)
    const { isLoggedIn } = globalContext;
    const [posts,setPost] = useState([])
    const [loading,setLoading] = useState(true)

    const getPost = () => {
        axios.get( process.env.EXPO_PUBLIC_BACKEND_URL + '/api/post-list')
        .then((response) => {
            const myPost = response.data;
            setPost(myPost)
        })
        .catch((error) => console.error(error))
        .finally(() => {
            setLoading(false)
        })    
    }

    useEffect(() => getPost(), [])

const IconButton = () => {
    return (
    <View style={{flexDirection: 'row', alignItems:'center'}}>
    <FontAwesome name="comment-o" size={22} color="black" />
        {/* Number */}
        <Text style={{fontSize: 12}}> 7 </Text>
    </View>
    )
}

const renderPosts = ({item}) => (
    <View style={styles.container}>
        <Link href={'/posts'}>Open</Link>
        <Text style={styles.clique}>{item.clique}</Text>
        <View style={styles.mainContainer}>
        <Entypo name="dots-three-horizontal" size={16} color="grey" style={{marginLeft:'auto'}}/>
        <Text style={styles.username}>{item.occupier}</Text>
        <Text style={styles.content}>{item.content}</Text>
        <Text style={styles.posted}>{item.posted}</Text>
        <Text style={styles.caption}>{item.caption}</Text>
        <View style={styles.footer}>
        <IconButton />
        </View>
        </View>
    </View>
)

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderColor: 'lightgrey',
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingTop: 50, // Add padding to avoid content getting under the dynamic island
    },
    mainContainer: {
        marginLeft:10,
        flex:1,
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
    color: 'black'
    },
    posted: {
    marginRight: 16,
    },
    caption: {
    marginBottom: 25,
    },
    footer: {
        flexDirection: 'row',
        marginVertical: 5,
        justifyContent: 'space-between'
    }
})

export default Home;