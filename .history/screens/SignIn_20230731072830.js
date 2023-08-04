import React,{ useContext,useState,localStorage } from 'react'
import {View,StyleSheet,Text,Button,TouchableOpacity,TextInput} from 'react-native'
import { ScreenContainer } from 'react-native-screens'
import  { Context } from '../components/globalContext/globalContext'
import Home from '../screens/Home'
import handleLoginForm from '../screens/LoginForm'
import  axiosInstance  from '../components/axiosApi';
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useNavigation } from '@react-navigation/native';

function SignIn({ navigation,route,props }){

  const globalContext = useContext(Context)
  const { setIsLoggedIn,occupierObj,setOccupierObj,setToken} = globalContext
  

  
  const [email, setEmail] = useState("") 
  const [ username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [securePassword, setSecurePassword] = useState(true)
  const [ error, setError] = useState("")


  
 function handleLogin (){
    let body = JSON.stringify({
        'email': username,
        'password':password
    })
    console.log(body)
 fetch(`http://127.0.0.1:8000/auth/login/`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': 'Bearer '
            // {'Authorization': `Bearer ${user.token}`

        },
        body: body
    })
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
       setToken(json.token)
       setIsLoggedIn(true)
    })
    .catch(error =>{
      console.log(error)
    })



}


    return (
      <View style={styles.container}>

        <Text style={styles.logintxt}>LOGIN</Text>



        <Text>{error}</Text>


        <Text style={styles.email}>Email address</Text>
        <TextInput value={username} onChangeText={text => setUsername(text)} placeholder="Email" style={styles.labelContainer} autoCompleteType="email" textContentType='username'/>
        <Text>Password</Text>
        <TextInput secureTextEntry={securePassword} onChangeText={text => setPassword(text)} placeholder="Password" style={styles.labelContainer} autoCompleteType="password" textContentType='password'/>

        <TouchableOpacity onPress={() => handleLogin()} style={styles.loginContainer}>
          <Text>Login</Text>
        </TouchableOpacity>
      </View>
    );
  };


const styles = StyleSheet.create({
container: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
},
text: {
  marginBottom:10
},
text1: {
  fontWeight:'bold',
  marginBottom:10,
  fontSize: 20
},
buttonContainer:{
alignItems: 'center',
justifyContent: 'center',
paddingVertical: 12,
paddingHorizontal: 32,
borderRadius: 5,
paddingBottom: 10,
marginBottom:30,
elevation: 90,
backgroundColor: 'grey',
},
email:{
fontWeight:'bold',
},
labelContainer:{
width: '100%',
},
loginContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  paddingHorizontal: 80,
  borderRadius: 15,
  paddingBottom: 10,
  marginBottom:30,
  elevation: 90,
  backgroundColor: 'grey',
  marginTop: 25,
},
logintxt:{
  fontSize: 19,
  marginBottom: 40
}
})

export default SignIn