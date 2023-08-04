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