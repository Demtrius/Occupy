import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList} from 'react-native'
import { TextInput, Button } from 'react-native-paper'

function Post(props){
    const [content, setContent] = useState('')
    const [caption, setCaption] = useState('')
    const [clique , setClique] = useState('')


    const CreatePost = () => {
        // fetch('http://127.0.0.1:8000/api/post-list', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         content : content.toLowerCase(),
        //         caption : caption.toLowerCase(),
        //         clique : clique.toLowerCase
        //     })
        //     .then(resp => resp.json())
        //     .then( data =>  {
        //         console.log(data)
        //     })
        //     .catch(err => console.error(error))
        // })
        fetch('http://127.0.0.1:8000/api/post-list',{
            method: 'POST',
            headers: {
                Accept: 'application/json'
            },
            body: JSON.stringify({
                
            })
        })
    }

    return (
        <View>
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
        </View>
    )
}

const styles = StyleSheet.create({
    post: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
})

export default Post