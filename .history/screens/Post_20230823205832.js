import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList,TouchableOpacity} from 'react-native'
import { TextInput, Button, } from 'react-native-paper'
import { Context } from '../components/globalContext/globalContext'
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios'
import SearchableDropdown from 'react-native-searchable-dropdown';

const addPost = () => {

    const [content, setContent] = useState('')
    const [caption, setCaption] = useState('')
    const [posted , setPosted] = useState(new Date())
    const [ status, setStatus] = useState('Draft')
    const [ clique, setClique] = useState([])
    const [ occupier, setOccupier] = useState([])

    function createPost () {
        let json = {
            content: json.content,
            caption: json.caption,
            posted: new Date().toLocaleString,
            status: json.status,
            clique: json.clique.name,
            occupier: json.occupier
        }
        json = JSON.stringify(json)
        const url = `http://127.0.0.1:8000/api/${clique.name}/posts`
        fetch(url ,{
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: json,
        })
        console.log(body)
        .then(data => data.json())
    }

    const cliqueSelect = () => {
        const cliques = ``
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
            value={date.toLocaleString()}
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
            onChangeText={text => setClique(text)}
            />
            <TextInput
            label='clique'
            value={occupier}
            mode='outlined'
            onChangeText={text => setOccupier(occupier)}
            />
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