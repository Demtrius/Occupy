import React from 'react';
import {View,StyleSheet,Text,Button,TouchableOpacity,TextInput} from 'react-native'
import { ScreenContainer } from 'react-native-screens'
import  { Context } from '../components/globalContext/globalContext'
import Home from '../screens/Home'
import  axiosInstance  from '../components/axiosApi';


function LoginForm({navigation,route,props}){
    const globalContext = useContext(Context)
    const { setIsLoggedIn,occupierObj,setOccupierObj} = globalContext


  const [email, setEmail] = useState("") 
  const [ username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [securePassword, setSecurePassword] = useState(true)
  const [ error, setError] = useState("")


  function Login(){
    let body = JSON.stringify({
        'email': username,
        'password':password
    })

    try {
        const response = axiosInstance.post('http://127.0.0.1:8000/auth/jwt/create/',{
            'email': username,
            'password':password
        });
        axiosInstance.defaults.headers['Authorization'] = 'Bearer' +  response.data.access;
        localStorage.setItem('access_token', response.data.access)
    }
    catch(error){}

}

}