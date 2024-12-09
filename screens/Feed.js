import React,{useState,useEffect} from 'react';
import {View,StyleSheet,FlatList,Text,TouchableOpacity,Button} from 'react-native'
import axios from 'axios';
import { ActivityIndicator } from 'react-native';
import Profile from '../screens/Profile'
import { useNavigation } from '@react-navigation/native';
import { Context } from '../components/globalContext/globalContext'
import PostDetail from './PostDetail';
import PostItem from './PostItem';



function Feed(){

const [posts,setPosts] = useState([])
const [loading,setLoading] = useState(true)

const navigation = useNavigation();


// const getPosts = () => {
    
//         axios.get('http://127.0.0.1:8000/api/post-list')
//         .then((response) => {
//             // console.log(response)
//             const myPost = response.data;
//             setPost(myPost)
//         })
//         .catch((error) => console.error(error))
//         .finally(() => {
//             setLoading(false)
//         })    
//     }
// useEffect(() => getPosts(), [])


useEffect( () => {
  fetch( process.env.EXPO_PUBLIC_BACKEND_URL + '/api/post-list')
  .then((response) => response.json())
  .then((data) => setPosts(data))
  .catch((error) => console.error('Error fetching posts:', error));
},[])

const renderPosts = ({item}) => (
  <View style={styles.container}>
  <View style={styles.mainContainer}>
  <TouchableOpacity onPress={ () => navigation.navigate('PostDetail', {id:item.id})}>
  <Text style={styles.clique}>{item.clique}</Text>
  </TouchableOpacity>
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
        
        <FlatList
        data={posts}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderPosts}
        />
        
    </View>
)
}
// add padding in content
const styles = StyleSheet.create({
container: {
flex: 1,
alignItems: 'center',
justifyContent: 'center',
padding: 10,
borderColor: 'lightgrey',
borderBottomWidth: StyleSheet.hairlineWidth
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
  color: 'red'
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


export default Feed;