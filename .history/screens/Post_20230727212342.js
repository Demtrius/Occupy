import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList,TouchableOpacity} from 'react-native'
import { TextInput, Button, } from 'react-native-paper'
import { Context } from '../components/globalContext/globalContext'
import axios from 'axios'


function Post(props){
    const [content ,setContent] = useState('')
    const [ caption, setCaption ] = useState('')
    const [clique, setClique] = useState('')
    const [occupier, setOccupier] = useState('')



    return (
        <View style ={{flex: 1}}>
            <TextInput
            label="Content"
            value={content}
            mode = "outlined"
            onChangeText={text => setContent(text)}
            />

            <TextInput
            label='Clique'
            value={clique}
            mode = "outlined"
            onChangeText={text => setClique(text)}
            /> 

            <TextInput 
            label = 'Caption'
            value = {caption}
            mode = "outlined"
            onChangeText={text => setCaption(text)}
            />
            <TextInput
            label = 'Occupier'
            value = {occupier}
            mode = 'outlined'
            onChangeText={text => setOccupier(text)}
            />
            
            <TouchableOpacity onPress={() => handlePost()} style={styles.Button}>
                <Text>Post !</Text>
            </TouchableOpacity>
            
        </View>
    )
}

const styles = StyleSheet.create({
    post: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {

    },
    Button : {
        alignItems: 'center',
        justifyContent: 'center',
        flex:1
    },

    touch : {
        alignItems: 'center',
        justifyContent: 'center',
        flex:1,
        
    }
})

export default Post