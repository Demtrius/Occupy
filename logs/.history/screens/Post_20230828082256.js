import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList,TouchableOpacity} from 'react-native'
import { TextInput, Button, } from 'react-native-paper'
import { Context } from '../components/globalContext/globalContext'
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios'
import SearchableDropdown from 'react-native-searchable-dropdown';

const Post = () => {
    const [content, setContent] = useState('')
    const [caption , setCaption] = useState('')
    const [posted ,setPosted] = useState(new Date())
    const [status, setStatus] = useState('Draft')
    const [clique, setClique] = useState([])
    const [ occupier,setOccupier] = useState([])
    


    const fetchCliques = ( ) => {
        fetch(`http://127.0.0.1:8000/api/cliques-list`)
        .then( response =>  response.json())
        .then( (data) => setClique(data))
    }
    const fetchOccupiers = ( ) => {
        fetch(`http://127.0.0.1:8000/auth/occupier-list/`)
        .then(response  => response.json())
        .then( (data) => setOccupier(data))
    }

    const createPost = async ( ) => {
        await fetch(`http://127.0.0.1:8000/api/post-create`,{
            method: 'POST',
            body: JSON.stringify({
                content : content,
                caption:caption,
                posted : new Date().toLocaleString,
                status:status,
                clique : fetchCliques,
                occupier : fetchOccupiers
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then((response) => response.json())
        .then( (data) => {
            setContent('')
            setCaption('')
            setPosted(new Date().toLocaleString)
            setStatus('Posted')
            setClique(fetchCliques)
            setOccupier(fetchOccupiers)

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
            <TextInput
            label='status'
            value={status}
            mode='outlined'
            onChangeText={text => setStatus('Posted')}
            />
            <TextInput
            label='clique'
            value={clique}
            mode='outlined'
            // onChangeText={text => setClique(text)}
            />
            <TextInput
            label='occupier'
            value={occupier}
            mode='outlined'
            onChangeText={text => setOccupier(fetchOccupiers)}
            />
            <TouchableOpacity onPress={() => createPost()}>
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