import React,{useState,useEffect,useContext} from 'react';
import {View,Text,StyleSheet,FlatList,ActivityIndicator} from 'react-native'
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
// import API from '../components/API.js';
import { useNavigation } from '@react-navigation/native';



const PostDetail = ({route}) => {
    const [post, setPost] = useState(null)
    const [loading , SetLoading] = useState(true)

    // get the post id from the parameters
    const { id } = route.params;

    useEffect(() => {
        axios.get(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/posts/${id}/')
        .then( response => {
        setPost(response.data)
        SetLoading(false)
        })
        .catch(error => {
            console.log(error) 
            SetLoading(false)
        });
    },[id]);

    if(loading){
        return <ActivityIndicator size="large" color="#0000ff" />;
    }
    if (!post) {
        return <Text>Post does not exist</Text>;
      }

      return (
    <View>
      <Text>{post.title}</Text>
      <Text>{post.content}</Text>
        </View>
      );
}

export default PostDetail;