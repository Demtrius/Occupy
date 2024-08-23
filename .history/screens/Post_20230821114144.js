import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList,TouchableOpacity} from 'react-native'
import { TextInput, Button, } from 'react-native-paper'
import { Context } from '../components/globalContext/globalContext'
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios'
import SearchableDropdown from 'react-native-searchable-dropdown';

const globalContext = useContext(Context)
const { setIsLoggedIn,occupierObj,setOccupierObj,token,setToken,authTokens,setAuthTokens,setItem} = globalContext

class CreatePost extends Component {
    constructor(props){
        super(props)
        this.state = {
            content : '',
            caption : '',
            posted : new Date().getDate(),
            status : 'Draft',
            clique: [],
            Occupier: [],
            clique_selected: '',
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleCliqueSelect = this.handleCliqueSelect.bind(this)
    }

    getIds(json) {
        let ls = []
        if (json) {
            for (var i = 0; i < json.length; i++) {
                ls[i] = json[i]['id']
            }
        }
        return ls
    } 
    componentDidMount() {
        if(this.props.update){
            fetch(`/api/${this.props.clique}/posts/${this.props.postid}/`)
            .then(data => data.json())
            .then(json => {
                
            })
        }
    }
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