import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList,TouchableOpacity} from 'react-native'
import { TextInput, Button, } from 'react-native-paper'
import { Context } from '../components/globalContext/globalContext'
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios'
import SearchableDropdown from 'react-native-searchable-dropdown';

const addPost(){
    const [content, setContent] = useState('')
    const [caption, setCaption] = useState('')
    const [posted , setPosted] = useState('')
    const [ status, Setstatus] = useState('Draft')
    const [ clique, SetClique] = useState([])
    const [ occupier, setOccupier] = useState([])



    return (
        <View>

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