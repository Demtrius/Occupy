import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList,TouchableOpacity} from 'react-native'
import { TextInput, Button, } from 'react-native-paper'
import { Context } from '../components/globalContext/globalContext'
import axios from 'axios'


const  Post = () => {
const [content, setContent] = useState([])
const [caption, setCaption] = useState('')
const [clique, setClique] = useState('')
const [occupier, setOccupier] = useState('Tye')
const [ status, setStatus] = useState('Draft')


const handlePost = () => {
    const post = {content,caption,clique,occupier}

    fetch(`http://127.0.0.1:8000/api/post-create`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            body: JSON.stringify(post)
        }
    }).then(() => {
        console.log(post)
        console.log('New post added successfully')
    })
    .catch(error => console.error(error))
}



    return (
   <View style={styles.post}> 
   <Text>Content</Text>
   <TextInput value={content} onChangeText={text => setContent(text)}/>
   <Text>Caption</Text>
   <TextInput value={caption} onChangeText={text => setCaption(text)}/>
   <Text>Clique</Text>
   <TextInput value={clique} onChangeText={text => setClique(text)}/>
   <Text>Occupier</Text>
   <TextInput value={occupier} onChangeText={text => setOccupier(text)}/>
   <TouchableOpacity onPress={() => handlePost()}>
    <Text>Status</Text>
    <TextInput value={status} onChangeText={text => setStatus(text)}/>
    <Text>Post !</Text>
   </TouchableOpacity>
   
   </View>
 )
}

const styles = StyleSheet.create({
    // post: {
    //     flex: 1,
    //     alignItems: 'center',
    //     justifyContent: 'center',
    // },
    // content : {
    //     alignItems: 'center',
    //     justifyContent: 'center',
    // }
})

export default Post