import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList,TouchableOpacity} from 'react-native'
import { TextInput, Button } from 'react-native-paper'

function Post(props){
const [post, setPost] = useState({
    clique : '',
    content:'',
    caption:'',
    occupier:''
})


    const CreatePost = () => {

    }

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
            
            <TouchableOpacity onPress={() => CreatePost(content,clique,caption)} style={styles.Button}>
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
        flex:1
    }
})

export default Post