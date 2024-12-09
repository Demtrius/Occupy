import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList,TouchableOpacity } from 'react-native'
import { TextInput, Button, } from 'react-native-paper'
import { Context } from '../components/globalContext/globalContext'
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios'
import SearchableDropdown from 'react-native-searchable-dropdown';
import { ActivityIndicator } from 'react-native';



const Post = () => {
    const [content, setContent] = useState('')
    const [caption , setCaption] = useState('')
    const [posted ,setPosted] = useState(new Date())
    const [clique, setClique] = useState([])
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(null);
    const [items, setItems] = useState([]);
    


const fetchCliques = () => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/cliques-list')
    .then( response =>  response.json())
    .then( (data) => setItems(data.map(item => ({ label: item.name, value: item.id }))))

}
useEffect(() =>fetchCliques() ,[])

    const createPost = ( ) => {
         fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/post-create',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                content : content,
                caption: caption,
                posted : new Date(),
                clique : clique
            }),
        })
        .then((response) => response.json())
        .then((responseJson) => {
            console.log(responseJson);
 })
        .catch((error) => {
            console.log(error)
        })
    }
    return (
        <View>
            <TextInput
            label= 'Content'
            value={content}
            mode='outlined'
            onChangeText={text => setContent(text)}
            />
            <TextInput
            label= 'Caption'
            value={caption}
            mode='outlined'
            onChangeText={text => setCaption(text)}
            />
            <TextInput
            label='posted'
            value={posted.toLocaleString()}
            mode='outlined'
            />
<DropDownPicker
      open={open}
      value={clique}
      items={items}
      setOpen={setOpen}
      setValue={setClique}
      setItems={setItems}
    />
            <Button onPress={() => createPost()}>
                <Text>Post !</Text>
            </Button>
        </View>
    )
}








const styles = StyleSheet.create({
    post: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content : {
        alignItems: 'center',
        justifyContent: 'center',
    }
})

export default Post