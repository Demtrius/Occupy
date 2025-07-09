import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList,TouchableOpacity} from 'react-native'
import { TextInput, Button, } from 'react-native-paper'
import { Context } from '../components/globalContext/globalContext'
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios'


const  Post = () => {
const [content, setContent] = useState('')
const [caption, setCaption] = useState('')
const [clique, setClique] = useState('')
const [open, setOpen] = useState(false)


const handlePost = () => {
  
}



    return (
   <View style={styles.post}> 
   <Text>Content</Text>
   <TextInput value={content} onChangeText={text => setContent(text)}/>
   <Text>Caption</Text>
   <TextInput value={caption} onChangeText={text => setCaption(text)}/>
   <Text>Clique</Text>
   
   
    <TouchableOpacity onPress={handlePost}>
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