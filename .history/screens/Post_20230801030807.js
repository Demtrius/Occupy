import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList,TouchableOpacity} from 'react-native'
import { TextInput, Button, } from 'react-native-paper'
import { Context } from '../components/globalContext/globalContext'
import axios from 'axios'


function Post(){
const [makePost, setMakePost] = useState('')





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