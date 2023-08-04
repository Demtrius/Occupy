import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList,TouchableOpacity} from 'react-native'
import { TextInput, Button, } from 'react-native-paper'
import axios from 'axios'

function Post(props){
const [post, setPost] = useState({
    clique : '',
    content:'',
    caption:'',
    occupier:''
})

const handleInput = (event) => {
    setPost({...post, [event.target.name]: event.target.event})
}

function handleSubmit(event){
    event.preventDefault()
    axios.post('http://127.0.0.1:8000/api/post-create',{post})
    .then(response => console.log(response))
    .catch(err => console.log(err))
}
    return (
        <View style ={{flex: 1}}>
            {/* <TextInput
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
            /> */}
            <form onSubmit={() =>handleSubmit}>
                Clique : <input type="text" onChange={handleInput} name ='clique'></input>
                Content : <input type="text" onChange={handleInput} name='content'></input>
                Caption : < input type='text' onChange={handleInput} name='caption'></input>
                Occupier : <input type='text' onChange={handleInput} name='occupier'></input>
            </form>
            
            {/* <TouchableOpacity onPress={() => CreatePost(content,clique,caption)} style={styles.Button}>
                <Text>Post !</Text>
            </TouchableOpacity> */}
            
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
        flex:1
    }
})

export default Post