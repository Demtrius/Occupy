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
            onChangeText={text => setOccupier(occupier)}
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