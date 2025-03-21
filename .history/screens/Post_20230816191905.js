import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList,TouchableOpacity} from 'react-native'
import { TextInput, Button, } from 'react-native-paper'
import { Context } from '../components/globalContext/globalContext'
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios'
import SearchableDropdown from 'react-native-searchable-dropdown';


const  Post = () => {
    const globalContext = useContext(Context)
    const { setIsLoggedIn,occupierObj,setOccupierObj,token,setToken,authTokens,setAuthTokens,setItem} = globalContext

const [content, setContent] = useState('')
const [caption, setCaption] = useState('')
const [clique, setClique] = useState([])
const [posted,setPosted] = useState('')
const [status, setStatus] = useState('')
const [occupier,setOccupier] = useState(occupierObj)



const fetchCliques = () => {
    axios.get('http://127.0.0.1:8000/api/cliques-list')
    .then(result => {
        const res = result.data .data
        return res
    })
}


const handlePost = () => {
    const post = {content,caption,clique,posted,status,occupier}

    fetch(`http://127.0.0.1:8000/api/post-create`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            body: JSON.stringify(post)
        }
    }).then(() => {
        console.log(post)
        console.log('New post added successfully')
    })
    .catch(error => console.error(error))
}



    return (
   <View style={styles.post}> 
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