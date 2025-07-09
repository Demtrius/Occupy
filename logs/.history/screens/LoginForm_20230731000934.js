import React,{useState,useContext,localStorage} from 'react';
import {View,StyleSheet,Text,Button,TouchableOpacity,TextInput} from 'react-native'
import { ScreenContainer } from 'react-native-screens'
import  { Context } from '../components/globalContext/globalContext'
import Home from '../screens/Home'
import  axiosInstance  from '../components/axiosApi';
import { AsyncStorage } from react-native-community/async-storage

function LoginForm({navigation,route,props}){
    const globalContext = useContext(Context)
    const { setIsLoggedIn,occupierObj,setOccupierObj} = globalContext


  const [email, setEmail] = useState("") 
  const [ username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [securePassword, setSecurePassword] = useState(true)
  const [ error, setError] = useState("")


  function HandleLoginForm(){
    let body = JSON.stringify({
        'email': username,
        'password':password
    })
    console.log(body)
    axiosInstance.post('http://127.0.0.1:8000/auth/jwt/create/',{
        body :body
    }) 
    axiosInstance.defaults.headers['Authorization'] = 'Bearer' + Response.data.access
    AsyncStorage.setItem('access_token', response.data.access)
    AsyncStorage.setItem('refresh_token', response.data.refresh)
    return data
    .then(res =>{
        console.log(res);
        if(res.ok){
          return res.json();
        } 
         else {
           setError("Invalid credentials")
           throw res.json();
         }
      })
       .then(json => {
         console.log(json)
         setOccupierObj(json)
        //  setToken(json.token)
         setIsLoggedIn(true)
      })
      .catch(error =>{
        console.log(error)
      })
}



}
export default LoginForm