import React,{useContext,useState,useEffect} from 'react'
import {View,Text,StyleSheet,FlatList,TouchableOpacity} from 'react-native'
import { TextInput, Button, } from 'react-native-paper'
import { Context } from '../components/globalContext/globalContext'
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
            occupier: [],
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
                if(json.occupier.username !== AsyncStorage.getItem('username')){
                    this.props.history.push('/')
                }
                this.setState({
                    content : json.content,
                    caption: json.caption,
                    posted:json.posted,
                    status: json.status,
                    clique: json.clique,
                    occupier: json.occupier,
                    clique_selected: json.clique.name
                })
            })
        } else {
            fetch(`http://127.0.0.1:8000/api/cliques-list`)
            .then(data => data.json())
            .then(json => {
                this.setState({
                    cliques : json
                })
            })
        }
    }
    componentWillReceiveProps(nextProps){
        if(AsyncStorage.getItem('token') === null){
            this.props.history.push('/')
        }
    }

    handleCliqueSelect(event){
        this.setState({
            clique_selected : event.target.value,
            clique_id : event.target[event.target.selectedIndex].id
        }, ()=> this.props.history.push(`/${this.state.clique_selected}/new/`)
        )
    }

    success(){
        this.props.history.push(`/${this.state.clique_selected}/`)
    }

    handleSubmit(context) {
        let json = {
            content : this.state.content,
            caption: this.state.caption,
            posted: this.state.posted,
            status: json.status,
            clique: Number(this.state.clique_id),
            occupier: Number(this.state.occupierObj.id)

        }

        if(this.props.update === false){
            json['upvotes'] = [context.occupierObj.id]
        }
        json = JSON.stringify(json)
        const url = `/api/reddit/${this.state.clique_selected}/posts/${this.props.update ? this.props.postid + '/' : ''}`
        fetch(url,{
            method: this.props.update ? 'PUT' : 'POST',
            headers: {
                
            }
        })
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