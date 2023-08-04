import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList,TouchableOpacity} from 'react-native'
import { TextInput, Button, } from 'react-native-paper'
import { Context } from '../components/globalContext/globalContext'
import axios from 'axios'


const  Post = () => {
const [content, setContent] = useState('')
const [caption, setCaption] = useState('')
const [clique, setClique] = useState('')
const [occupier, setOccupier] = useState('Tye')


const handlePost = () => {
    const post = {content,caption,clique,occupier}

    fetch(`http://127.0.0.1:8000/api/post-create`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
}



    return (
   <View style={styles.post}> 
   <Text>Make a post</Text>
   </View>
 )
    }

const styles = StyleSheet.create({
    post: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
})

export default Post