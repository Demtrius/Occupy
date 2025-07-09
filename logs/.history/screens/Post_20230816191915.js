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